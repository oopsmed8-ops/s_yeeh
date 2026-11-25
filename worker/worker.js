function hasValidImageSignature(buffer, type) {
  const b = new Uint8Array(buffer);
  if (type === "image/jpeg") return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === "image/png") return b.length >= 8 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i) => b[i] === v);
  if (type === "image/webp") return b.length >= 12 && String.fromCharCode(...b.slice(0,4)) === "RIFF" && String.fromCharCode(...b.slice(8,12)) === "WEBP";
  if (type === "image/avif") return b.length >= 12 && String.fromCharCode(...b.slice(4,8)) === "ftyp" && ["avif","avis"].includes(String.fromCharCode(...b.slice(8,12)));
  return false;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    // ALLOWED_ORIGIN accepts one origin or a comma-separated allowlist.
    // Example for local testing + production:
    // http://127.0.0.1:8088,https://www.your-domain.com
    const allowedOrigins = String(env.ALLOWED_ORIGIN || "")
      .split(",").map(value => value.trim()).filter(Boolean);
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "null";
    const cors = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (data, status = 200, extra = {}) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });

    if (origin && !allowedOrigins.includes(origin)) return new Response("Origin not allowed", { status: 403, headers: cors });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/api/health" && request.method === "GET") {
      const bucket = Boolean(env.BUCKET);
      const supabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SECRET_KEY);
      return json({ ok: bucket && supabaseConfigured, service: "Sidahmed-auto media API", bucket, supabaseConfigured });
    }
    if (!env.BUCKET) return json({ error: "R2 binding BUCKET is not configured" }, 500);
    // Public image delivery. Only generated image keys are addressable.
    if (request.method === "GET" && url.pathname.startsWith("/images/")) {
      const key = url.pathname.slice(1);
      if (!/^images\/[a-f0-9-]+\.(jpg|png|webp|avif)$/.test(key)) return new Response("Not found", { status: 404, headers: cors });
      const object = await env.BUCKET.get(key);
      if (!object) return new Response("Image not found", { status: 404, headers: cors });
      const headers = new Headers(cors);
      headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("ETag", object.httpEtag);
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(object.body, { headers });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_SECRET_KEY) {
      return json({ error: "Supabase Worker secrets are not configured" }, 500);
    }

    // Authenticate the Supabase session, then verify the user's admin role server-side.
    async function requireAdmin() {
      const auth = request.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
      const token = auth.slice(7);
      const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": env.SUPABASE_PUBLISHABLE_KEY, "Authorization": `Bearer ${token}` }
      });
      if (!userResponse.ok) throw new Error("UNAUTHORIZED");
      const user = await userResponse.json();
      const profileResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`,
        { headers: { "apikey": env.SUPABASE_SECRET_KEY, "Authorization": `Bearer ${token}` } }
      );
      if (!profileResponse.ok) throw new Error("FORBIDDEN");
      const profiles = await profileResponse.json();
      if (!profiles[0] || profiles[0].role !== "admin") throw new Error("FORBIDDEN");
      return user;
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      try { await requireAdmin(); }
      catch (e) { return json({ error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Administrator access required" }, e.message === "UNAUTHORIZED" ? 401 : 403); }

      const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
      if (!extensions[type]) return json({ error: "Unsupported image type" }, 415);
      const declared = Number(request.headers.get("Content-Length") || 0);
      if (!declared) return json({ error: "Content-Length required" }, 411);
      if (declared > 10 * 1024 * 1024) return json({ error: "Image exceeds 10 MB limit" }, 413);
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) return json({ error: "Invalid image size (maximum 10 MB)" }, 413);
      if (!hasValidImageSignature(bytes, type)) return json({ error: "File content does not match the declared image type" }, 415);

      const key = `images/${crypto.randomUUID()}.${extensions[type]}`;
      await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type } });
      return json({ success: true, key, url: `${url.origin}/${key}` }, 201);
    }

    if (url.pathname === "/api/delete" && request.method === "POST") {
      try { await requireAdmin(); }
      catch (e) { return json({ error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Administrator access required" }, e.message === "UNAUTHORIZED" ? 401 : 403); }
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      const key = String(body.key || "");
      if (!/^images\/[a-f0-9-]+\.(jpg|png|webp|avif)$/.test(key)) return json({ error: "Invalid image key" }, 400);
      await env.BUCKET.delete(key);
      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);
  }
};
