(() => {
  'use strict';

  let html2canvasPromise = null;
  let jsPdfPromise = null;
  let bindingScheduled = false;

  const EXPORT_W = 1100;
  const EXPORT_H = 778;

  function loadScript(src, test, marker) {
    if (test()) return Promise.resolve();
    const existing = document.querySelector(`script[data-${marker}]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset[marker] = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load the PDF export library.'));
      document.head.appendChild(script);
    });
  }

  function loadHtml2Canvas() {
    if (!html2canvasPromise) {
      html2canvasPromise = loadScript(
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        () => typeof window.html2canvas === 'function',
        'cmHtml2canvas'
      );
    }
    return html2canvasPromise;
  }

  function loadJsPdf() {
    if (!jsPdfPromise) {
      jsPdfPromise = loadScript(
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        () => !!window.jspdf?.jsPDF,
        'cmJspdf'
      );
    }
    return jsPdfPromise;
  }

  function safeFileName() {
    const title = document.querySelector('#certificate .cert-title')?.textContent || 'Capital Mastery Certificate';
    const name = document.querySelector('#certificate .cert-name')?.textContent || '';
    return `${title} - ${name}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140) + '.pdf';
  }

  async function waitForImages(root) {
    const images = [...root.querySelectorAll('img')];
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve, { once:true });
        img.addEventListener('error', resolve, { once:true });
      });
    }));
    if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
  }

  function qrDataUrl(original) {
    const qr = original.querySelector('.cert-qr');
    const canvas = qr?.querySelector('canvas');
    const img = qr?.querySelector('img');
    if (canvas) {
      try { return canvas.toDataURL('image/png'); } catch (_) {}
    }
    return img?.src || '';
  }

  function certificateBorder(original) {
    if (original.classList.contains('simple')) return '4px solid #244c78';
    if (original.classList.contains('applied')) return '4px solid #147d83';
    return '10px solid #071a33';
  }

  function prepareClone(cloneDoc, original, qrUrl) {
    const clone = cloneDoc.getElementById('certificate');
    if (!clone) return;

    const frame = clone.closest('.cm-cert-responsive-frame');
    if (frame) {
      Object.assign(frame.style, {
        position: 'relative',
        width: `${EXPORT_W}px`,
        height: `${EXPORT_H}px`,
        margin: '0',
        overflow: 'visible'
      });
    }

    Object.assign(clone.style, {
      position: 'relative',
      left: '0',
      top: '0',
      width: `${EXPORT_W}px`,
      maxWidth: 'none',
      height: `${EXPORT_H}px`,
      aspectRatio: 'auto',
      margin: '0',
      transform: 'none',
      transformOrigin: 'top left',
      boxSizing: 'border-box',
      overflow: 'hidden',
      background: original.classList.contains('simple') ? '#ffffff' : '#fffdf8',
      border: certificateBorder(original),
      boxShadow: 'none'
    });

    clone.classList.add('cm-pdf-render');

    const name = clone.querySelector('.cert-name');
    if (name) {
      const len = name.textContent.trim().length;
      name.style.fontSize = len > 34 ? '2.65rem' : len > 22 ? '3.2rem' : '4rem';
      name.style.lineHeight = '1';
      name.style.maxWidth = '90%';
    }

    const qr = clone.querySelector('.cert-qr');
    if (qr && qrUrl) {
      qr.innerHTML = '';
      qr.removeAttribute('style');
      const img = cloneDoc.createElement('img');
      img.src = qrUrl;
      img.alt = 'QR code for public credential verification';
      Object.assign(img.style, {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      });
      qr.appendChild(img);
    }
  }

  async function captureCertificate() {
    const original = document.getElementById('certificate');
    if (!original) throw new Error('Certificate is not ready yet.');

    await waitForImages(original);
    const qrUrl = qrDataUrl(original);

    // Capture the actual certificate element, not an off-screen miniature.  The
    // cloned document is forced to a desktop viewport so mobile Safari scaling
    // rules cannot shrink the certificate inside the export canvas.
    const canvas = await window.html2canvas(original, {
      backgroundColor: original.classList.contains('simple') ? '#ffffff' : '#fffdf8',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: EXPORT_W,
      height: EXPORT_H,
      windowWidth: 1440,
      windowHeight: 1000,
      scrollX: 0,
      scrollY: 0,
      onclone: cloneDoc => prepareClone(cloneDoc, original, qrUrl)
    });

    if (!canvas.width || !canvas.height) throw new Error('The certificate image was empty.');
    return canvas;
  }

  async function downloadPdf(button) {
    const oldText = button.textContent;
    try {
      button.disabled = true;
      button.textContent = 'Preparing PDF…';

      await Promise.all([loadHtml2Canvas(), loadJsPdf()]);
      if (typeof window.html2canvas !== 'function' || !window.jspdf?.jsPDF) {
        throw new Error('PDF export could not initialize.');
      }

      // Two animation frames gives iOS Safari time to finish QR/image layout.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await captureCertificate();
      const image = canvas.toDataURL('image/png');

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Fill the PDF page edge-to-edge with the certificate. Using the PDF's
      // actual point dimensions avoids the iOS Safari unit bug that previously
      // placed a tiny certificate in the upper-left of a mostly blank page.
      pdf.addImage(image, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST');
      pdf.save(safeFileName());
    } catch (error) {
      console.error('Capital Mastery PDF download failed:', error);
      alert(`Could not download the PDF yet. ${error.message || 'Please try again.'}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText === 'Preparing PDF…' ? 'Download PDF' : oldText;
    }
  }

  function bindButton() {
    const oldPrint = document.querySelector('[data-cm-live-print]');
    const currentPdf = document.querySelector('[data-cm-live-pdf]');
    const button = currentPdf || oldPrint;
    if (!button || button.dataset.cmPdfV2Bound === '1') return;

    // Clone once so the old window.print() listener from capital-mastery-live-ui.js
    // is completely removed.
    const clean = button.cloneNode(true);
    clean.dataset.cmPdfV2Bound = '1';
    clean.setAttribute('data-cm-live-pdf', 'true');
    clean.removeAttribute('data-cm-live-print');
    clean.textContent = 'Download PDF';
    button.replaceWith(clean);
    clean.addEventListener('click', () => downloadPdf(clean));
  }

  function scheduleBind() {
    if (bindingScheduled) return;
    bindingScheduled = true;
    requestAnimationFrame(() => {
      bindingScheduled = false;
      bindButton();
    });
  }

  const style = document.createElement('style');
  style.id = 'cm-pdf-v2-styles';
  style.textContent = `
    #certificate.cm-pdf-render{width:${EXPORT_W}px!important;height:${EXPORT_H}px!important;max-width:none!important;transform:none!important;margin:0!important}
    #certificate.cm-pdf-render .cert-inner{padding:5.3% 7%!important}
    #certificate.cm-pdf-render .cert-brand{font-size:1rem!important;gap:10px!important;letter-spacing:.22em!important}
    #certificate.cm-pdf-render .cert-brand img{width:44px!important;height:auto!important}
    #certificate.cm-pdf-render .cert-type{margin-top:2.5%!important;font-size:.86rem!important;letter-spacing:.18em!important}
    #certificate.cm-pdf-render .cert-awarded{margin-top:3%!important;font-size:.68rem!important;letter-spacing:.12em!important}
    #certificate.cm-pdf-render .cert-for{margin-top:2%!important;font-size:.78rem!important}
    #certificate.cm-pdf-render .cert-title{font-size:2.3rem!important;line-height:1.08!important;margin-top:.8%!important;max-width:82%!important}
    #certificate.cm-pdf-render.simple .cert-title{font-size:2rem!important}
    #certificate.cm-pdf-render .cert-description{display:block!important;font-size:.72rem!important;max-width:620px!important;margin-top:1.4%!important}
    #certificate.cm-pdf-render .cert-bottom{margin-top:auto!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1.15fr 1fr!important;gap:25px!important;align-items:end!important}
    #certificate.cm-pdf-render .cert-meta{font-size:.66rem!important;line-height:1.3!important;min-width:0!important;overflow-wrap:anywhere!important}
    #certificate.cm-pdf-render .cert-meta strong{font-size:.72rem!important;line-height:1.25!important;display:block!important}
    #certificate.cm-pdf-render .signature-block img{height:62px!important;width:auto!important;max-width:190px!important;object-fit:contain!important;margin:0 auto!important}
    #certificate.cm-pdf-render.simple .signature-block img{height:55px!important;max-width:210px!important}
    #certificate.cm-pdf-render .signature-line{width:190px!important;margin:0 auto 4px!important}
    #certificate.cm-pdf-render .signature-block strong{font-size:.7rem!important;display:block!important}
    #certificate.cm-pdf-render .signature-block span{font-size:.62rem!important}
    #certificate.cm-pdf-render .cert-qr{width:58px!important;height:58px!important;margin:0 auto 4px!important;background:#fff!important}
    #certificate.cm-pdf-render:not(.simple):not(.applied) .cert-qr{width:64px!important;height:64px!important}
    #certificate.cm-pdf-render .cert-seal{width:112px!important;right:6%!important;top:16%!important}
    #certificate.cm-pdf-render:not(.simple):not(.applied) .cert-seal{right:8%!important;top:15.2%!important;width:132px!important}
    #certificate.cm-pdf-render .corner{width:90px!important;height:90px!important}
    #certificate.cm-pdf-render.simple .corner,#certificate.cm-pdf-render.applied .corner{width:50px!important;height:50px!important}
    #certificate.cm-pdf-render .cm-cert-verify-url{display:none!important}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.addEventListener('hashchange', () => setTimeout(scheduleBind, 40));
  document.addEventListener('cm-auth-changed', () => setTimeout(scheduleBind, 60));
  const app = document.getElementById('app');
  if (app) new MutationObserver(scheduleBind).observe(app, { childList:true, subtree:true });
  setTimeout(scheduleBind, 100);
})();