(() => {
  'use strict';

  let html2canvasPromise = null;
  let jsPdfPromise = null;
  let bindingScheduled = false;

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

  function copyQrIntoClone(original, clone) {
    const source = original.querySelector('.cert-qr');
    const target = clone.querySelector('.cert-qr');
    if (!source || !target) return;

    const canvas = source.querySelector('canvas');
    const img = source.querySelector('img');
    target.innerHTML = '';
    target.removeAttribute('style');

    const out = document.createElement('img');
    out.alt = 'QR code for public credential verification';
    out.style.width = '100%';
    out.style.height = '100%';
    out.style.display = 'block';
    out.style.objectFit = 'contain';

    if (canvas) {
      try { out.src = canvas.toDataURL('image/png'); }
      catch (_) { return; }
    } else if (img?.src) {
      out.src = img.src;
    } else {
      return;
    }
    target.appendChild(out);
  }

  function makeExportStage() {
    const original = document.getElementById('certificate');
    if (!original) throw new Error('Certificate is not ready yet.');

    const stage = document.createElement('div');
    stage.className = 'cm-pdf-export-stage';
    const clone = original.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('cm-pdf-certificate');
    clone.dataset.cmMobileFramed = '';
    copyQrIntoClone(original, clone);
    stage.appendChild(clone);
    document.body.appendChild(stage);
    return { stage, clone };
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

      const { stage, clone } = makeExportStage();
      try {
        await waitForImages(clone);
        // Let Safari finish one paint before rasterization.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const canvas = await window.html2canvas(clone, {
          backgroundColor: '#fffdf8',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: 1100,
          height: 778,
          windowWidth: 1440,
          windowHeight: 1000,
          scrollX: 0,
          scrollY: 0
        });

        if (!canvas.width || !canvas.height) throw new Error('The certificate image was empty.');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        const image = canvas.toDataURL('image/jpeg', 0.97);
        pdf.addImage(image, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        pdf.save(safeFileName());
      } finally {
        stage.remove();
      }
    } catch (error) {
      console.error('Capital Mastery PDF download failed:', error);
      alert(`Could not download the PDF yet. ${error.message || 'Please try again.'}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText === 'Download / Print PDF' ? 'Download PDF' : oldText;
    }
  }

  function bindButton() {
    const button = document.querySelector('[data-cm-live-print]');
    if (!button || button.dataset.cmPdfBound === '1') return;

    // Replacing the button removes the older window.print() listener that caused
    // blank/empty print previews on mobile Safari.
    const clean = button.cloneNode(true);
    clean.dataset.cmPdfBound = '1';
    clean.textContent = 'Download PDF';
    clean.removeAttribute('data-cm-live-print');
    clean.setAttribute('data-cm-live-pdf', 'true');
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
  style.id = 'cm-pdf-download-styles';
  style.textContent = `
    .cm-pdf-export-stage{position:fixed;left:-20000px;top:0;width:1100px;height:778px;z-index:-1000;overflow:hidden;background:#fffdf8;pointer-events:none}
    .cm-pdf-export-stage .cm-pdf-certificate{position:relative!important;left:auto!important;top:auto!important;transform:none!important;transform-origin:initial!important;width:1100px!important;max-width:none!important;height:778px!important;aspect-ratio:auto!important;margin:0!important;box-sizing:border-box!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-inner{padding:5.3% 7%!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-brand{font-size:1rem!important;gap:10px!important;letter-spacing:.22em!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-brand img{width:44px!important;height:auto!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-type{margin-top:2.5%!important;font-size:.86rem!important;letter-spacing:.18em!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-awarded{margin-top:3%!important;font-size:.68rem!important;letter-spacing:.12em!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-name{font-size:4rem!important;line-height:1!important;margin-top:1.3%!important;max-width:90%!important;overflow-wrap:anywhere!important}
    .cm-pdf-export-stage .cm-pdf-certificate.cm-cert-long-name .cert-name{font-size:3.2rem!important}
    .cm-pdf-export-stage .cm-pdf-certificate.cm-cert-very-long-name .cert-name{font-size:2.65rem!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-for{margin-top:2%!important;font-size:.78rem!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-title{font-size:2.3rem!important;line-height:1.08!important;margin-top:.8%!important;max-width:82%!important}
    .cm-pdf-export-stage .cm-pdf-certificate.simple .cert-title{font-size:2rem!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-description{display:block!important;font-size:.72rem!important;max-width:620px!important;margin-top:1.4%!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-bottom{margin-top:auto!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1.15fr 1fr!important;gap:25px!important;align-items:end!important;padding-bottom:0!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-meta{font-size:.66rem!important;line-height:1.3!important;min-width:0!important;overflow-wrap:anywhere!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-meta strong{font-size:.72rem!important;line-height:1.25!important;display:block!important}
    .cm-pdf-export-stage .cm-pdf-certificate .signature-block img{height:62px!important;width:auto!important;max-width:190px!important;object-fit:contain!important;margin:0 auto!important}
    .cm-pdf-export-stage .cm-pdf-certificate.simple .signature-block img{height:55px!important;max-width:210px!important}
    .cm-pdf-export-stage .cm-pdf-certificate .signature-line{width:190px!important;margin:0 auto 4px!important}
    .cm-pdf-export-stage .cm-pdf-certificate .signature-block strong{font-size:.7rem!important;display:block!important}
    .cm-pdf-export-stage .cm-pdf-certificate .signature-block span{font-size:.62rem!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-qr{width:58px!important;height:58px!important;margin:0 auto 4px!important;background:#fff!important}
    .cm-pdf-export-stage .cm-pdf-certificate:not(.simple):not(.applied) .cert-qr{width:64px!important;height:64px!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cert-seal{width:112px!important;right:6%!important;top:16%!important}
    .cm-pdf-export-stage .cm-pdf-certificate:not(.simple):not(.applied) .cert-seal{right:8%!important;top:15.2%!important;width:132px!important}
    .cm-pdf-export-stage .cm-pdf-certificate .corner{width:90px!important;height:90px!important}
    .cm-pdf-export-stage .cm-pdf-certificate.simple .corner,.cm-pdf-export-stage .cm-pdf-certificate.applied .corner{width:50px!important;height:50px!important}
    .cm-pdf-export-stage .cm-pdf-certificate .cm-cert-verify-url{display:none!important}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.addEventListener('hashchange', () => setTimeout(scheduleBind, 40));
  document.addEventListener('cm-auth-changed', () => setTimeout(scheduleBind, 60));
  const app = document.getElementById('app');
  if (app) new MutationObserver(scheduleBind).observe(app, { childList:true, subtree:true });
  setTimeout(scheduleBind, 100);
})();
