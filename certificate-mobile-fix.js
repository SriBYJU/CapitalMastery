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
    } catch (error) {
      // Network-safe fallback: the credential URL itself is public, so using it in
      // this image request does not expose private account data.
      if (!document.body.contains(el)) return;
      const img = document.createElement('img');
      img.src = `https://quickchart.io/qr?size=180&margin=1&text=${encodeURIComponent(url)}`;
      img.alt = 'QR code for public credential verification';
      img.width = 180;
      img.height = 180;
      el.replaceChildren(img);
    }
  }

  function enhanceCertificate() {
    if (!isCertificateRoute()) return;
    const cert = ensureFrame();
    if (!cert) return;

    const name = cert.querySelector('.cert-name');
    if (name) {
      const length = name.textContent.trim().length;
      cert.classList.toggle('cm-cert-long-name', length > 22);
      cert.classList.toggle('cm-cert-very-long-name', length > 34);
    }

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

      .cm-cert-responsive-frame #certificate{
        position:absolute!important;left:0;top:0;margin:0!important;
        width:1000px!important;max-width:none!important;height:707.2px!important;aspect-ratio:auto!important;
        transform-origin:top left!important;transform:scale(calc((100vw - 16px)/1000))!important;
      }

      /* Restore the desktop certificate typography inside the fixed 1000px canvas,
         then scale the WHOLE certificate down. This prevents individual mobile font
         rules from pushing the signature or QR code outside the border. */
      .cm-cert-responsive-frame #certificate .cert-inner{padding:5.3% 7%!important}
      .cm-cert-responsive-frame #certificate .cert-brand{font-size:1rem!important;gap:10px!important;letter-spacing:.22em!important}
      .cm-cert-responsive-frame #certificate .cert-brand img{width:44px!important;height:auto!important}
      .cm-cert-responsive-frame #certificate .cert-type{margin-top:2.5%!important;font-size:.86rem!important;letter-spacing:.18em!important}
      .cm-cert-responsive-frame #certificate .cert-awarded{margin-top:3%!important;font-size:.68rem!important;letter-spacing:.12em!important}
      .cm-cert-responsive-frame #certificate .cert-name{font-size:3.5rem!important;line-height:1!important;margin-top:1.3%!important;max-width:90%;overflow-wrap:anywhere}
      .cm-cert-responsive-frame #certificate.cm-cert-long-name .cert-name{font-size:2.9rem!important}
      .cm-cert-responsive-frame #certificate.cm-cert-very-long-name .cert-name{font-size:2.35rem!important}
      .cm-cert-responsive-frame #certificate .cert-for{margin-top:2%!important;font-size:.78rem!important}
      .cm-cert-responsive-frame #certificate .cert-title{font-size:2rem!important;line-height:1.08!important;margin-top:.8%!important;max-width:80%!important}
      .cm-cert-responsive-frame #certificate .cert-description{display:block!important;font-size:.72rem!important;max-width:620px!important;margin-top:1.4%!important}
      .cm-cert-responsive-frame #certificate .cert-bottom{margin-top:auto!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1.15fr 1fr!important;gap:25px!important;align-items:end!important;padding-bottom:0!important}
      .cm-cert-responsive-frame #certificate .cert-meta{font-size:.66rem!important;line-height:1.3!important;min-width:0!important;overflow-wrap:anywhere}
      .cm-cert-responsive-frame #certificate .cert-meta strong{font-size:.72rem!important;line-height:1.25!important;display:block!important}
      .cm-cert-responsive-frame #certificate .signature-block img{height:62px!important;width:auto!important;max-width:190px!important;object-fit:contain!important;margin:0 auto!important}
      .cm-cert-responsive-frame #certificate .signature-line{width:190px!important;margin:0 auto 4px!important}
      .cm-cert-responsive-frame #certificate .signature-block strong{font-size:.7rem!important;display:block!important}
      .cm-cert-responsive-frame #certificate .signature-block span{font-size:.62rem!important}
      .cm-cert-responsive-frame #certificate .cert-qr{width:58px!important;height:58px!important;margin:0 auto 4px!important}
      .cm-cert-responsive-frame #certificate .cert-seal{width:112px!important;right:6%!important;top:16%!important}
      .cm-cert-responsive-frame #certificate .corner{width:90px!important;height:90px!important}
      .cm-cert-responsive-frame #certificate.simple .corner,.cm-cert-responsive-frame #certificate.applied .corner{width:50px!important;height:50px!important}
      .cm-cert-responsive-frame #certificate .cm-cert-verify-url{display:none!important}

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
  if (app) {
    const observer = new MutationObserver(schedule);
    observer.observe(app, { childList:true, subtree:true });
  }

  setTimeout(schedule, 80);
})();
