(() => {
  'use strict';

  // A SPA rerender may recreate the logo while the device has just gone offline.
  // If the browser decides to revalidate the SVG instead of serving it from cache,
  // replace only that failed decorative/brand asset with a self-contained mark.
  // The application shell and accessible brand text never depend on this fallback.
  const FALLBACK = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Capital Mastery">
      <rect width="64" height="64" rx="14" fill="#071a33"/>
      <path d="M13 14h38v4H13zM13 46h38v4H13z" fill="#b98a43"/>
      <text x="32" y="39" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="21" font-weight="700" fill="#ffffff">CM</text>
    </svg>`);

  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.cmAssetFallback === 'true') return;
    const src = String(image.getAttribute('src') || '');
    if (!/(?:^|\/)assets\/logo-mark\.svg(?:[?#].*)?$/i.test(src)) return;
    image.dataset.cmAssetFallback = 'true';
    image.src = FALLBACK;
  }, true);
})();
