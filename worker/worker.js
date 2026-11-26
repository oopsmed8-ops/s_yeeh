// Sidahmed-auto media API — Cloudflare Worker (يحل محل الكود القديم بالكامل)
// المتغيّرات: SUPABASE_URL ، SUPABASE_PUBLISHABLE_KEY ، ALLOWED_ORIGIN (اختياري) ، BUCKET (R2)
// المفتاح السري SUPABASE_SECRET_KEY لم يعد مطلوباً.

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };
const KEY_RE = /^images\/[a-f0-9-]+\.(jpg|png|webp|avif|gif)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const list = String(env.ALLOWED_ORIGIN || "").split(",").map(v => v.trim()).filter(Boolean);
    const okOrigin = list.length === 0 || list.some(a => a === "*" || a === origin ||
      (a.includes("*.") && new RegExp("^" + a.replace(/[.]/g, "\\.").replace("*", "[a-z0-9-]+") + "$").test(origin)));
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? (origin || "*") : "null",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-File-Name",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (url.pathname === "/api/health") {
      return json({
        ok: Boolean(env.BUCKET && env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY),
        version: "v3-admin-check-fixed",
        bucket: Boolean(env.BUCKET),
        supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY)
      });
    }

    if (!env.BUCKET) return json({ error: "R2 binding BUCKET is not configured" }, 500);

    // عرض الصور
    if (request.method === "GET" && url.pathname.startsWith("/images/")) {
      const key = url.pathname.slice(1);
      if (!KEY_RE.test(key)) return new Response("Not found", { status: 404, headers: cors });
      const object = await env.BUCKET.get(key);
      if (!object) return new Response("Image not found", { status: 404, headers: cors });
      const headers = new Headers(cors);
      headers.set("Content-Type", (object.httpMetadata && object.httpMetadata.contentType) || "application/octet-stream");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(object.body, { headers });
    }

    // التحقق من المسؤول: نفس استعلام لوحة الإدارة (المفتاح العام + توكن المستخدم)
    async function authorize() {
      const auth = request.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
      const token = auth.slice(7);

      if (env.UPLOAD_SECRET && token === env.UPLOAD_SECRET) return;   // الطريقة القديمة (إن وُجد السر)

      if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new Error("UNAUTHORIZED");
      const userRes = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
        headers: { "apikey": env.SUPABASE_PUBLISHABLE_KEY, "Authorization": "Bearer " + token }
      });
      if (!userRes.ok) throw new Error("UNAUTHORIZED");
      const user = await userRes.json();

      const profileUrl = env.SUPABASE_URL + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=role&limit=1";
      const profRes = await fetch(profileUrl, {
        headers: { "apikey": env.SUPABASE_PUBLISHABLE_KEY, "Authorization": "Bearer " + token }
      });
      if (!profRes.ok) throw new Error("FORBIDDEN");
      const rows = await profRes.json();
      if (!rows[0] || rows[0].role !== "admin") throw new Error("FORBIDDEN");
    }
    const deny = e => json({ error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Admin required" }, e.message === "UNAUTHORIZED" ? 401 : 403);

    // رفع صورة: المسارين /upload و /api/upload
    if ((url.pathname === "/upload" || url.pathname === "/api/upload") && request.method === "POST") {
      try { await authorize(); } catch (e) { return deny(e); }
      const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (!EXT[type]) return json({ error: "Unsupported image type" }, 415);
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength) return json({ error: "Empty file" }, 400);
      if (bytes.byteLength > 10 * 1024 * 1024) return json({ error: "Max 10MB" }, 413);
      const key = "images/" + crypto.randomUUID() + "." + EXT[type];
      await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type } });
      return json({ success: true, key, url: url.origin + "/" + key }, 201);
    }

    // حذف صورة
    if ((url.pathname === "/api/delete" || url.pathname === "/delete") && request.method === "POST") {
      try { await authorize(); } catch (e) { return deny(e); }
      let body; try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400); }
      const key = String(body.key || "");
      if (!KEY_RE.test(key)) return json({ error: "Invalid image key" }, 400);
      await env.BUCKET.delete(key);
      return json({ success: true });
    }

    return json({ error: "Not found", path: url.pathname, method: request.method }, 404);
  }
};
