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
      if (test()) return Promise.resolve();
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
      script.onerror = () => reject(new Error('Could not load the certificate export library.'));
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

  function safeFileName(ext = 'pdf') {
    const title = document.querySelector('#certificate .cert-title')?.textContent || 'Capital Mastery Certificate';
    const name = document.querySelector('#certificate .cert-name')?.textContent || '';
    return `${title} - ${name}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140) + `.${ext}`;
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

  function tier(original) {
    if (original.classList.contains('simple')) return 'foundations';
    if (original.classList.contains('applied')) return 'applied';
    return 'career';
  }

  function tierDesign(original) {
    const t = tier(original);
    if (t === 'foundations') {
      return {
        border: '4px solid #244c78',
        background: '#ffffff',
        nameNormal: '4rem', nameLong: '3.2rem', nameVeryLong: '2.65rem'
      };
    }
    if (t === 'applied') {
      return {
        border: '6px solid #147d83',
        background: 'linear-gradient(135deg,#fff 0%,#fbffff 60%,#f2faf9 100%)',
        nameNormal: '4rem', nameLong: '3.2rem', nameVeryLong: '2.65rem'
      };
    }
    return {
      border: '14px solid #071a33',
      background: 'radial-gradient(circle at 15% 18%,rgba(193,145,65,.06),transparent 22%),radial-gradient(circle at 85% 82%,rgba(7,26,51,.045),transparent 22%),#fffdf8',
      nameNormal: '4.85rem', nameLong: '3.9rem', nameVeryLong: '3.05rem'
    };
  }

  function prepareClone(cloneDoc, original, qrUrl) {
    const clone = cloneDoc.getElementById('certificate');
    if (!clone) return;
    const design = tierDesign(original);

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
      left: '0', top: '0',
      width: `${EXPORT_W}px`, maxWidth: 'none',
      height: `${EXPORT_H}px`, aspectRatio: 'auto',
      margin: '0', transform: 'none', transformOrigin: 'top left',
      boxSizing: 'border-box', overflow: 'hidden',
      background: design.background,
      border: design.border,
      boxShadow: 'none'
    });
    clone.classList.add('cm-export-render');

    const name = clone.querySelector('.cert-name');
    if (name) {
      const len = name.textContent.trim().length;
      name.style.fontSize = len > 34 ? design.nameVeryLong : len > 22 ? design.nameLong : design.nameNormal;
      name.style.lineHeight = tier(original) === 'career' ? '.98' : '1';
      name.style.maxWidth = '90%';
    }

    const qr = clone.querySelector('.cert-qr');
    if (qr && qrUrl) {
      qr.innerHTML = '';
      qr.removeAttribute('style');
      const img = cloneDoc.createElement('img');
      img.src = qrUrl;
      img.alt = 'QR code for public credential verification';
      Object.assign(img.style, { display:'block', width:'100%', height:'100%', objectFit:'contain' });
      qr.appendChild(img);
    }
  }

  async function captureCertificate() {
    const original = document.getElementById('certificate');
    if (!original) throw new Error('Certificate is not ready yet.');
    await waitForImages(original);
    const qrUrl = qrDataUrl(original);

    const canvas = await window.html2canvas(original, {
      backgroundColor: tier(original) === 'foundations' ? '#ffffff' : '#fffdf8',
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
      if (typeof window.html2canvas !== 'function' || !window.jspdf?.jsPDF) throw new Error('PDF export could not initialize.');

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await captureCertificate();
      const image = canvas.toDataURL('image/png');

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'landscape', unit:'pt', format:'a4', compress:true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(image, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST');
      pdf.save(safeFileName('pdf'));
    } catch (error) {
      console.error('Capital Mastery PDF download failed:', error);
      alert(`Could not download the PDF yet. ${error.message || 'Please try again.'}`);
    } finally {
      button.disabled = false;
      button.textContent = 'Download PDF';
    }
  }

  async function downloadPng(button) {
    const oldText = button.textContent;
    try {
      button.disabled = true;
      button.textContent = 'Preparing PNG…';
      await loadHtml2Canvas();
      if (typeof window.html2canvas !== 'function') throw new Error('PNG export could not initialize.');

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await captureCertificate();
      const link = document.createElement('a');
      link.download = safeFileName('png');
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Capital Mastery PNG download failed:', error);
      alert(`Could not download the PNG yet. ${error.message || 'Please try again.'}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText || 'Download PNG';
    }
  }

  function bindPdfButton() {
    const oldPrint = document.querySelector('[data-cm-live-print]');
    const currentPdf = document.querySelector('[data-cm-live-pdf]');
    const button = currentPdf || oldPrint;
    if (!button || button.dataset.cmPdfV4Bound === '1') return;

    const clean = button.cloneNode(true);
    clean.dataset.cmPdfV4Bound = '1';
    clean.setAttribute('data-cm-live-pdf', 'true');
    clean.removeAttribute('data-cm-live-print');
    clean.textContent = 'Download PDF';
    button.replaceWith(clean);
    clean.addEventListener('click', () => downloadPdf(clean));
  }

  function bindPngButton() {
    const button = document.querySelector('[data-cm-live-png]');
    if (!button || button.dataset.cmPngV4Bound === '1') return;

    const clean = button.cloneNode(true);
    clean.dataset.cmPngV4Bound = '1';
    clean.setAttribute('data-cm-live-png', 'true');
    button.replaceWith(clean);
    clean.addEventListener('click', () => downloadPng(clean));
  }

  function scheduleBind() {
    if (bindingScheduled) return;
    bindingScheduled = true;
    requestAnimationFrame(() => {
      bindingScheduled = false;
      bindPdfButton();
      bindPngButton();
    });
  }

  const style = document.createElement('style');
  style.id = 'cm-export-v4-styles';
  style.textContent = `
    #certificate.cm-export-render{width:${EXPORT_W}px!important;height:${EXPORT_H}px!important;max-width:none!important;transform:none!important;margin:0!important;box-shadow:none!important}
    #certificate.cm-export-render .cm-cert-verify-url{display:none!important}
    #certificate.cm-export-render .cert-description{display:block!important}

    /* Foundations export — blue formal certificate */
    #certificate.cm-export-render.simple{border:4px solid #244c78!important;background:#fff!important}
    #certificate.cm-export-render.simple:before{inset:11px!important;border:1px solid rgba(36,76,120,.42)!important;box-shadow:none!important}
    #certificate.cm-export-render.simple:after{display:none!important}
    #certificate.cm-export-render.simple .cert-inner{padding:5.3% 7%!important}
    #certificate.cm-export-render.simple .cert-type{color:#244c78!important;font-size:.86rem!important}
    #certificate.cm-export-render.simple .cert-title{font-size:2rem!important;max-width:82%!important}
    #certificate.cm-export-render.simple .corner{width:50px!important;height:50px!important;border-color:#7d8792!important}
    #certificate.cm-export-render.simple .signature-block img{height:55px!important;max-width:210px!important}
    #certificate.cm-export-render.simple .cert-qr{width:58px!important;height:58px!important}

    /* Applied Skills export — teal professional certificate */
    #certificate.cm-export-render.applied{border:6px solid #147d83!important;background:linear-gradient(135deg,#fff 0%,#fbffff 60%,#f2faf9 100%)!important}
    #certificate.cm-export-render.applied:before{inset:10px!important;border:1px solid rgba(20,125,131,.5)!important;box-shadow:none!important}
    #certificate.cm-export-render.applied:after{display:none!important}
    #certificate.cm-export-render.applied .cert-inner{padding:5.3% 7%!important}
    #certificate.cm-export-render.applied .cert-type{color:#147d83!important;font-size:.86rem!important}
    #certificate.cm-export-render.applied .cert-title{font-size:2.1rem!important;max-width:82%!important}
    #certificate.cm-export-render.applied .corner{width:50px!important;height:50px!important;border-color:#147d83!important}
    #certificate.cm-export-render.applied .signature-block img{height:60px!important;max-width:220px!important}
    #certificate.cm-export-render.applied .cert-qr{width:58px!important;height:58px!important}

    #certificate.cm-export-render.simple .cert-brand,#certificate.cm-export-render.applied .cert-brand{font-size:1rem!important;gap:10px!important;letter-spacing:.22em!important}
    #certificate.cm-export-render.simple .cert-brand img,#certificate.cm-export-render.applied .cert-brand img{width:44px!important;height:auto!important}
    #certificate.cm-export-render.simple .cert-awarded,#certificate.cm-export-render.applied .cert-awarded{margin-top:3%!important;font-size:.68rem!important;letter-spacing:.12em!important}
    #certificate.cm-export-render.simple .cert-for,#certificate.cm-export-render.applied .cert-for{margin-top:2%!important;font-size:.78rem!important}
    #certificate.cm-export-render.simple .cert-description,#certificate.cm-export-render.applied .cert-description{font-size:.72rem!important;max-width:620px!important;margin-top:1.4%!important}
    #certificate.cm-export-render.simple .cert-bottom,#certificate.cm-export-render.applied .cert-bottom{margin-top:auto!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1.15fr 1fr!important;gap:25px!important;align-items:end!important}
    #certificate.cm-export-render.simple .signature-line,#certificate.cm-export-render.applied .signature-line{width:190px!important;margin:0 auto 4px!important}

    /* Career export — grand navy/gold master certificate */
    #certificate.cm-export-render:not(.simple):not(.applied){border:14px solid #071a33!important;background:radial-gradient(circle at 15% 18%,rgba(193,145,65,.06),transparent 22%),radial-gradient(circle at 85% 82%,rgba(7,26,51,.045),transparent 22%),#fffdf8!important}
    #certificate.cm-export-render:not(.simple):not(.applied):before{inset:9px!important;border:2px solid #caa45e!important;box-shadow:inset 0 0 0 6px #fffdf8,inset 0 0 0 7px rgba(7,26,51,.28)!important}
    #certificate.cm-export-render:not(.simple):not(.applied):after{display:block!important;content:""!important;position:absolute!important;inset:31px!important;border:1px solid rgba(7,26,51,.16)!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .corner{width:104px!important;height:104px!important;border-color:#071a33!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-inner{padding:5.5% 8.5% 5.2%!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-brand{font-size:1.05rem!important;letter-spacing:.28em!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-brand img{width:49px!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-type{font-size:1rem!important;letter-spacing:.23em!important;margin-top:1.9%!important;color:#ae7b2d!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-awarded{margin-top:3.1%!important;font-size:.72rem!important;letter-spacing:.18em!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-for{margin-top:2.1%!important;font-size:.82rem!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-title{font-size:2.65rem!important;max-width:850px!important;line-height:1.08!important;margin-top:.9%!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-description{font-size:.77rem!important;line-height:1.55!important;max-width:720px!important;margin-top:1.7%!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-bottom{grid-template-columns:.9fr 1.3fr .9fr!important;gap:34px!important;margin-top:auto!important;padding:0 2.5% 1.8%!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .signature-block img{height:78px!important;max-width:250px!important;width:250px!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .signature-line{width:225px!important;margin-top:-6px!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-qr{width:64px!important;height:64px!important}
    #certificate.cm-export-render:not(.simple):not(.applied) .cert-seal{display:block!important;right:8%!important;top:15.2%!important;width:132px!important}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.CM_CERT_EXPORT = { captureCertificate, downloadPdf, downloadPng };

  window.addEventListener('hashchange', () => setTimeout(scheduleBind, 40));
  document.addEventListener('cm-auth-changed', () => setTimeout(scheduleBind, 60));
  const app = document.getElementById('app');
  if (app) new MutationObserver(scheduleBind).observe(app, { childList:true, subtree:true });
  setTimeout(scheduleBind, 100);
})();