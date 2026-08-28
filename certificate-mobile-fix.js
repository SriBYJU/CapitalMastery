(() => {
  'use strict';

  let scheduled = false;
  let qrLoader = null;

  function isCertificateRoute() {
    return String(location.hash || '').startsWith('#/certificate/');
  }

  function verificationUrl() {
    const text = document.querySelector('.cm-cert-verify-url')?.textContent || '';
    return text.replace(/^\s*Verify:\s*/i, '').trim();
  }

  function ensureFrame() {
    const cert = document.getElementById('certificate');
    if (!cert || cert.dataset.cmMobileFramed === '1') return cert;
    const frame = document.createElement('div');
    frame.className = 'cm-cert-responsive-frame';
    cert.parentNode.insertBefore(frame, cert);
    frame.appendChild(cert);
    cert.dataset.cmMobileFramed = '1';
    return cert;
  }

  function loadQrLibrary() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    if (qrLoader) return qrLoader;
    qrLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-cm-qrcode-lib]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.QRCode), { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.async = true;
      script.dataset.cmQrcodeLib = 'true';
      script.onload = () => window.QRCode ? resolve(window.QRCode) : reject(new Error('QR library did not initialize.'));
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return qrLoader;
  }

  async function makeRealQr() {
    const el = document.getElementById('cm-live-cert-mark');
    const url = verificationUrl();
    if (!el || !url || el.dataset.cmRealQr === url) return;

    el.dataset.cmRealQr = url;
    el.innerHTML = '';
    el.removeAttribute('style');
    el.classList.add('cm-real-qr');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'QR code for public credential verification');
    el.title = 'Scan to verify this credential';

    try {
      const QRCode = await loadQrLibrary();
      if (!document.body.contains(el) || el.dataset.cmRealQr !== url) return;
      new QRCode(el, {
        text: url,
        width: 180,
        height: 180,
        colorDark: '#071a33',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (_) {
      if (!document.body.contains(el)) return;
      const img = document.createElement('img');
      img.src = `https://quickchart.io/qr?size=180&margin=1&text=${encodeURIComponent(url)}`;
      img.alt = 'QR code for public credential verification';
      img.width = 180;
      img.height = 180;
      el.replaceChildren(img);
    }
  }

  function markNameLength(cert) {
    const name = cert.querySelector('.cert-name');
    if (!name) return;
    const length = name.textContent.trim().length;
    cert.classList.toggle('cm-cert-long-name', length > 22);
    cert.classList.toggle('cm-cert-very-long-name', length > 34);
  }

  function enhanceCertificate() {
    if (!isCertificateRoute()) return;
    const cert = ensureFrame();
    if (!cert) return;
    markNameLength(cert);
    makeRealQr();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceCertificate();
    });
  }

  const style = document.createElement('style');
  style.id = 'cm-certificate-mobile-fix-styles';
  style.textContent = `
    .cm-real-qr{display:block!important;background:#fff;overflow:hidden}.cm-real-qr img,.cm-real-qr canvas{display:block!important;width:100%!important;height:100%!important;image-rendering:pixelated}
    .cm-cert-responsive-frame{width:100%}

    @media(max-width:700px){
      .cert-page{padding-top:16px}
      .cert-page .cm-live-verified-banner{width:calc(100% - 16px);margin:0 auto 10px;font-size:.72rem;padding:8px 10px}
      .cm-cert-responsive-frame{position:relative;width:calc(100vw - 16px);height:calc((100vw - 16px)/1.414);margin:0 auto;overflow:hidden}
      .cm-cert-responsive-frame #certificate{position:absolute!important;left:0;top:0;margin:0!important;width:1000px!important;max-width:none!important;height:707.2px!important;aspect-ratio:auto!important;transform-origin:top left!important;transform:scale(calc((100vw - 16px)/1000))!important;box-sizing:border-box!important}

      /* Shared fixed-canvas geometry. The whole desktop certificate is scaled as a
         single object on mobile, so signatures, QR codes and borders never drift. */
      .cm-cert-responsive-frame #certificate .cert-inner{padding:5.3% 7%!important}
      .cm-cert-responsive-frame #certificate .cert-brand{font-size:1rem!important;gap:10px!important;letter-spacing:.22em!important}
      .cm-cert-responsive-frame #certificate .cert-brand img{width:44px!important;height:auto!important}
      .cm-cert-responsive-frame #certificate .cert-type{margin-top:2.5%!important;font-size:.86rem!important;letter-spacing:.18em!important}
      .cm-cert-responsive-frame #certificate .cert-awarded{margin-top:3%!important;font-size:.68rem!important;letter-spacing:.12em!important}
      .cm-cert-responsive-frame #certificate .cert-name{font-size:3.65rem!important;line-height:1!important;margin-top:1.3%!important;max-width:90%!important;overflow-wrap:anywhere!important}
      .cm-cert-responsive-frame #certificate.cm-cert-long-name .cert-name{font-size:3.05rem!important}
      .cm-cert-responsive-frame #certificate.cm-cert-very-long-name .cert-name{font-size:2.45rem!important}
      .cm-cert-responsive-frame #certificate .cert-for{margin-top:2%!important;font-size:.78rem!important}
      .cm-cert-responsive-frame #certificate .cert-title{font-size:2rem!important;line-height:1.08!important;margin-top:.8%!important;max-width:82%!important}
      .cm-cert-responsive-frame #certificate .cert-description{display:block!important;font-size:.72rem!important;max-width:620px!important;margin-top:1.4%!important}
      .cm-cert-responsive-frame #certificate .cert-bottom{margin-top:auto!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1.15fr 1fr!important;gap:25px!important;align-items:end!important;padding-bottom:0!important}
      .cm-cert-responsive-frame #certificate .cert-meta{font-size:.66rem!important;line-height:1.3!important;min-width:0!important;overflow-wrap:anywhere!important}
      .cm-cert-responsive-frame #certificate .cert-meta strong{font-size:.72rem!important;line-height:1.25!important;display:block!important}
      .cm-cert-responsive-frame #certificate .signature-block img{height:62px!important;width:auto!important;max-width:190px!important;object-fit:contain!important;margin:0 auto!important}
      .cm-cert-responsive-frame #certificate .signature-line{width:190px!important;margin:0 auto 4px!important}
      .cm-cert-responsive-frame #certificate .signature-block strong{font-size:.7rem!important;display:block!important}
      .cm-cert-responsive-frame #certificate .signature-block span{font-size:.62rem!important}
      .cm-cert-responsive-frame #certificate .cert-qr{width:58px!important;height:58px!important;margin:0 auto 4px!important}
      .cm-cert-responsive-frame #certificate .corner{width:90px!important;height:90px!important}
      .cm-cert-responsive-frame #certificate .cm-cert-verify-url{display:none!important}

      /* FOUNDATIONS — formal blue certificate */
      .cm-cert-responsive-frame #certificate.simple{border:4px solid #244c78!important;background:#fff!important;box-shadow:none!important}
      .cm-cert-responsive-frame #certificate.simple:before{inset:11px!important;border:1px solid rgba(36,76,120,.42)!important;box-shadow:none!important}
      .cm-cert-responsive-frame #certificate.simple:after{display:none!important}
      .cm-cert-responsive-frame #certificate.simple .corner{width:50px!important;height:50px!important;border-color:#7d8792!important}
      .cm-cert-responsive-frame #certificate.simple .cert-type{color:#244c78!important}
      .cm-cert-responsive-frame #certificate.simple .cert-title{font-size:2rem!important}
      .cm-cert-responsive-frame #certificate.simple .signature-block img{height:55px!important;max-width:210px!important}

      /* APPLIED SKILLS — teal professional certificate */
      .cm-cert-responsive-frame #certificate.applied{border:6px solid #147d83!important;background:linear-gradient(135deg,#fff 0%,#fbffff 60%,#f2faf9 100%)!important;box-shadow:none!important}
      .cm-cert-responsive-frame #certificate.applied:before{inset:10px!important;border:1px solid rgba(20,125,131,.5)!important;box-shadow:none!important}
      .cm-cert-responsive-frame #certificate.applied:after{display:none!important}
      .cm-cert-responsive-frame #certificate.applied .corner{width:50px!important;height:50px!important;border-color:#147d83!important}
      .cm-cert-responsive-frame #certificate.applied .cert-type{color:#147d83!important}
      .cm-cert-responsive-frame #certificate.applied .cert-title{font-size:2.1rem!important}
      .cm-cert-responsive-frame #certificate.applied .signature-block img{height:60px!important;max-width:220px!important}

      /* CAREER — grand navy/gold master certificate */
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied){border:14px solid #071a33!important;background:radial-gradient(circle at 15% 18%,rgba(193,145,65,.06),transparent 22%),radial-gradient(circle at 85% 82%,rgba(7,26,51,.045),transparent 22%),#fffdf8!important;box-shadow:none!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied):before{inset:9px!important;border:2px solid #caa45e!important;box-shadow:inset 0 0 0 6px #fffdf8,inset 0 0 0 7px rgba(7,26,51,.28)!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied):after{display:block!important;content:""!important;position:absolute!important;inset:31px!important;border:1px solid rgba(7,26,51,.16)!important;pointer-events:none!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .corner{width:104px!important;height:104px!important;border-color:#071a33!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .tl{top:28px!important;left:28px!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .tr{top:28px!important;right:28px!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .bl{bottom:28px!important;left:28px!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .br{bottom:28px!important;right:28px!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-inner{padding:5.5% 8.5% 5.2%!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-brand{font-size:1.05rem!important;letter-spacing:.28em!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-brand img{width:49px!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-type{font-size:1rem!important;letter-spacing:.23em!important;margin-top:1.9%!important;color:#ae7b2d!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-awarded{margin-top:3.1%!important;font-size:.72rem!important;letter-spacing:.18em!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-name{font-size:4.5rem!important;margin-top:1.2%!important;line-height:.98!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied).cm-cert-long-name .cert-name{font-size:3.65rem!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied).cm-cert-very-long-name .cert-name{font-size:2.95rem!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-for{margin-top:2.1%!important;font-size:.82rem!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-title{font-size:2.65rem!important;max-width:850px!important;line-height:1.08!important;margin-top:.9%!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-description{font-size:.77rem!important;line-height:1.55!important;max-width:720px!important;margin-top:1.7%!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-bottom{grid-template-columns:.9fr 1.3fr .9fr!important;gap:34px!important;margin-top:auto!important;padding:0 2.5% 1.8%!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .signature-block img{height:78px!important;max-width:250px!important;width:250px!important}.cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .signature-line{width:225px!important;margin-top:-6px!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-qr{width:64px!important;height:64px!important}
      .cm-cert-responsive-frame #certificate:not(.simple):not(.applied) .cert-seal{display:block!important;right:8%!important;top:15.2%!important;width:132px!important}

      .cert-toolbar{width:calc(100% - 16px);margin:18px auto 0!important}
    }

    @media print{
      .cm-cert-responsive-frame{width:auto!important;height:auto!important;overflow:visible!important}
      .cm-cert-responsive-frame #certificate{position:relative!important;left:auto!important;top:auto!important;transform:none!important;width:100%!important;height:auto!important;aspect-ratio:1.414/1!important}
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.addEventListener('hashchange', () => setTimeout(schedule, 30));
  document.addEventListener('cm-auth-changed', () => setTimeout(schedule, 50));
  const app = document.getElementById('app');
  if (app) new MutationObserver(schedule).observe(app, { childList:true, subtree:true });
  setTimeout(schedule, 80);
})();