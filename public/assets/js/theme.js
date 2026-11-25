import { updateThemeLabel } from './i18n.js';

export function initTheme() {
  const toggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('sa-theme') || 'dark';
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sa-theme', theme);
    if (toggleBtn) toggleBtn.textContent = theme === 'dark' ? '☼' : '☾';
    updateThemeLabel();
  };
  setTheme(savedTheme);
  toggleBtn?.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}
