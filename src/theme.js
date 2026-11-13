(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('gallery-theme') || 'system'; } catch {}
  if (!['light', 'dark', 'system'].includes(preference)) preference = 'system';
  const media = matchMedia('(prefers-color-scheme: dark)');
  function apply() { document.documentElement.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference; }
  apply();
  media.addEventListener('change', apply);
  window.galleryTheme = { get: () => preference, set(value) { preference = value; try { localStorage.setItem('gallery-theme', value); } catch {} apply(); } };
})();
