(() => {
  'use strict';

  let pdfLibPromise = null;
  let busy = false;

  function loadPdfLib() {
    if (window.PDFLib?.PDFDocument) return Promise.resolve(window.PDFLib);
    if (pdfLibPromise) return pdfLibPromise;
    pdfLibPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-cm-pdflib]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.PDFLib), { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      script.async = true;
      script.dataset.cmPdflib = 'true';
      script.onload = () => window.PDFLib?.PDFDocument ? resolve(window.PDFLib) : reject(new Error('PDF library did not initialize.'));
      script.onerror = () => reject(new Error('Could not load the PDF library.'));
      document.head.appendChild(script);
    });
    return pdfLibPromise;
  }

  function safeName() {
    const title = document.querySelector('#certificate .cert-title')?.textContent?.trim() || 'Capital Mastery Certificate';
    const holder = document.querySelector('#certificate .cert-name')?.textContent?.trim() || 'Learner';
    return `${title} - ${holder}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140) + '.pdf';
  }

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function waitForPngButton() {
    for (let i = 0; i < 30; i++) {
      const button = document.querySelector('[data-cm-live-png]');
      if (button?.dataset.cmCanvasPngBound === '1') return button;
      await wait(50);
    }
    return document.querySelector('[data-cm-live-png]');
  }

  async function getRenderedCertificatePng() {
    const pngButton = await waitForPngButton();
    if (!pngButton) throw new Error('Certificate renderer is not ready yet.');

    return await new Promise((resolve, reject) => {
      const originalClick = HTMLAnchorElement.prototype.click;
      let done = false;
      const timeout = setTimeout(() => finish(new Error('Certificate image rendering timed out.')), 15000);

      function finish(error, value) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        HTMLAnchorElement.prototype.click = originalClick;
        if (error) reject(error); else resolve(value);
      }

      HTMLAnchorElement.prototype.click = function() {
        try {
          const href = String(this.href || '');
          const download = String(this.download || '');
          if (href.startsWith('data:image/png') || /\.png$/i.test(download)) {
            finish(null, href);
            return;
          }
        } catch (_) {}
        return originalClick.apply(this, arguments);
      };

      try {
        pngButton.click();
      } catch (error) {
        finish(error);
      }
    });
  }

  async function dataUrlBytes(dataUrl) {
    const response = await fetch(dataUrl);
    return new Uint8Array(await response.arrayBuffer());
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function downloadFixedPdf(button) {
    if (busy) return;
    busy = true;
    const previous = button.textContent;
    try {
      button.disabled = true;
      button.textContent = 'Preparing PDF…';

      const [PDFLib, pngDataUrl] = await Promise.all([
        loadPdfLib(),
        getRenderedCertificatePng()
      ]);

      const pngBytes = await dataUrlBytes(pngDataUrl);
      const pdfDoc = await PDFLib.PDFDocument.create();
      pdfDoc.setTitle(safeName().replace(/\.pdf$/i, ''));
      pdfDoc.setSubject('Capital Mastery verified credential certificate');
      pdfDoc.setCreator('Capital Mastery');

      // A4 landscape in PDF points. The image is explicitly drawn to every page
      // edge, so iOS/Safari cannot reinterpret the certificate as a tiny image in
      // the upper-left corner.
      const pageW = 841.89;
      const pageH = 595.28;
      const page = pdfDoc.addPage([pageW, pageH]);
      const image = await pdfDoc.embedPng(pngBytes);
      page.drawImage(image, { x:0, y:0, width:pageW, height:pageH });

      const bytes = await pdfDoc.save({ useObjectStreams:false });
      downloadBlob(new Blob([bytes], { type:'application/pdf' }), safeName());
    } catch (error) {
      console.error('Capital Mastery iOS PDF fix failed:', error);
      alert(`Could not download the PDF. ${error.message || 'Please try again.'}`);
    } finally {
      button.disabled = false;
      button.textContent = previous === 'Preparing PDF…' ? 'Download PDF' : (previous || 'Download PDF');
      busy = false;
    }
  }

  // Capture phase deliberately runs before the older jsPDF listener. This leaves
  // the renderer used by PNG intact while replacing only the problematic PDF
  // packaging step on every browser/device.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-cm-live-pdf], [data-cm-live-print]');
    if (!button || !document.getElementById('certificate')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    downloadFixedPdf(button);
  }, true);
})();
