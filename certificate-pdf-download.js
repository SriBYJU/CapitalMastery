(() => {
  'use strict';

  let jsPdfPromise = null;
  let qrLoader = null;
  let bindingScheduled = false;
  const imageCache = new Map();

  const LOGICAL_W = 842;
  const LOGICAL_H = 595;
  const SCALE = 2;

  function loadScript(src, test, marker, integrity) {
    if (test()) return Promise.resolve();
    const existing = document.querySelector(`script[data-${marker}]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.dataset[marker] = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load the PDF library.'));
      document.head.appendChild(script);
    });
  }

  function loadJsPdf() {
    if (!jsPdfPromise) {
      jsPdfPromise = loadScript(
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        () => !!window.jspdf?.jsPDF,
        'cmJspdf',
        'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk'
      );
    }
    return jsPdfPromise;
  }

  function loadQrLibrary() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    if (!qrLoader) {
      qrLoader = loadScript(
        'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
        () => !!window.QRCode,
        'cmQrcodePdf',
        'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU'
      ).then(() => window.QRCode);
    }
    return qrLoader;
  }

  function safeFileName(ext) {
    const title = document.querySelector('#certificate .cert-title')?.textContent || 'Capital Mastery Certificate';
    const name = document.querySelector('#certificate .cert-name')?.textContent || '';
    return `${title} - ${name}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140) + `.${ext}`;
  }

  function tier(cert) {
    if (cert.classList.contains('simple')) return 'foundations';
    if (cert.classList.contains('applied')) return 'applied';
    return 'career';
  }

  function text(root, selector, fallback = '') {
    return root.querySelector(selector)?.textContent?.trim() || fallback;
  }

  function certificateData() {
    const cert = document.getElementById('certificate');
    if (!cert) throw new Error('Certificate is not ready yet.');
    const meta = [...cert.querySelectorAll('.cert-meta strong')].map(el => el.textContent.trim());
    return {
      cert,
      tier: tier(cert),
      type: text(cert, '.cert-type', 'Certificate'),
      awarded: text(cert, '.cert-awarded', 'This certificate is awarded to'),
      name: text(cert, '.cert-name', ''),
      forText: text(cert, '.cert-for', 'for successfully completing the requirements of'),
      title: text(cert, '.cert-title', 'Capital Mastery'),
      description: text(cert, '.cert-description', ''),
      issued: meta[0] || '',
      credentialId: meta[meta.length - 1] || '',
      verifyUrl: text(cert, '.cm-cert-verify-url', '').replace(/^Verify:\s*/i, '')
    };
  }

  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
    imageCache.set(src, promise);
    return promise;
  }

  async function optionalImage(src, fallback = null) {
    try { return await loadImage(src); }
    catch (_) {
      if (!fallback) return null;
      try { return await loadImage(fallback); } catch (_) { return null; }
    }
  }

  async function getQrCanvas(data) {
    const existing = data.cert.querySelector('.cert-qr canvas');
    if (existing) return existing;

    try {
      const QRCode = await loadQrLibrary();
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:256px;height:256px;background:#fff;';
      document.body.appendChild(holder);
      const payload = data.verifyUrl || data.credentialId || data.title;
      new QRCode(holder, {
        text: payload,
        width: 256,
        height: 256,
        colorDark: '#071a33',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      await new Promise(resolve => requestAnimationFrame(resolve));
      const canvas = holder.querySelector('canvas');
      if (!canvas) {
        holder.remove();
        return null;
      }
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext('2d').drawImage(canvas, 0, 0);
      holder.remove();
      return copy;
    } catch (_) {
      return null;
    }
  }

  function setFont(ctx, size, family = 'Arial', weight = '400', style = 'normal') {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
  }

  function fitFont(ctx, value, start, min, maxWidth, family = 'Georgia', weight = '700') {
    let size = start;
    while (size > min) {
      setFont(ctx, size, family, weight);
      if (ctx.measureText(value).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  function wrapText(ctx, value, maxWidth) {
    const words = String(value || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawCenteredLines(ctx, lines, x, y, lineHeight) {
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
  }

  function drawSpaced(ctx, value, centerX, y, spacing) {
    const chars = [...String(value)];
    const widths = chars.map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + Math.max(0, chars.length - 1) * spacing;
    let x = centerX - total / 2;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x, y);
      x += widths[i] + spacing;
    }
  }

  function drawCorner(ctx, x, y, size, horiz, vert, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y + vert * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + horiz * size, y);
    ctx.stroke();
  }

  function drawBackground(ctx, t) {
    if (t === 'foundations') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.strokeStyle = '#244c78';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, LOGICAL_W - 16, LOGICAL_H - 16);
      ctx.strokeStyle = '#9db1c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(21, 21, LOGICAL_W - 42, LOGICAL_H - 42);
      drawCorner(ctx, 35, 35, 40, 1, 1, '#7d8792', 2.2);
      drawCorner(ctx, LOGICAL_W - 35, 35, 40, -1, 1, '#7d8792', 2.2);
      drawCorner(ctx, 35, LOGICAL_H - 35, 40, 1, -1, '#7d8792', 2.2);
      drawCorner(ctx, LOGICAL_W - 35, LOGICAL_H - 35, 40, -1, -1, '#7d8792', 2.2);
      return;
    }

    if (t === 'applied') {
      const grad = ctx.createLinearGradient(0, 0, LOGICAL_W, LOGICAL_H);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(.62, '#fbffff');
      grad.addColorStop(1, '#f2faf9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.strokeStyle = '#147d83';
      ctx.lineWidth = 6;
      ctx.strokeRect(9, 9, LOGICAL_W - 18, LOGICAL_H - 18);
      ctx.strokeStyle = '#75b9bc';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(22, 22, LOGICAL_W - 44, LOGICAL_H - 44);
      drawCorner(ctx, 36, 36, 42, 1, 1, '#147d83', 2.5);
      drawCorner(ctx, LOGICAL_W - 36, 36, 42, -1, 1, '#147d83', 2.5);
      drawCorner(ctx, 36, LOGICAL_H - 36, 42, 1, -1, '#147d83', 2.5);
      drawCorner(ctx, LOGICAL_W - 36, LOGICAL_H - 36, 42, -1, -1, '#147d83', 2.5);
      return;
    }

    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    const glow1 = ctx.createRadialGradient(120, 110, 0, 120, 110, 180);
    glow1.addColorStop(0, 'rgba(193,145,65,.10)');
    glow1.addColorStop(1, 'rgba(193,145,65,0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 300, 300);
    const glow2 = ctx.createRadialGradient(720, 500, 0, 720, 500, 180);
    glow2.addColorStop(0, 'rgba(7,26,51,.06)');
    glow2.addColorStop(1, 'rgba(7,26,51,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(540, 320, 302, 275);

    ctx.strokeStyle = '#071a33';
    ctx.lineWidth = 12;
    ctx.strokeRect(9, 9, LOGICAL_W - 18, LOGICAL_H - 18);
    ctx.strokeStyle = '#caa45e';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, LOGICAL_W - 48, LOGICAL_H - 48);
    ctx.strokeStyle = '#b6bdc6';
    ctx.lineWidth = .8;
    ctx.strokeRect(34, 34, LOGICAL_W - 68, LOGICAL_H - 68);
    drawCorner(ctx, 42, 42, 54, 1, 1, '#071a33', 3);
    drawCorner(ctx, LOGICAL_W - 42, 42, 54, -1, 1, '#071a33', 3);
    drawCorner(ctx, 42, LOGICAL_H - 42, 54, 1, -1, '#071a33', 3);
    drawCorner(ctx, LOGICAL_W - 42, LOGICAL_H - 42, 54, -1, -1, '#071a33', 3);
  }

  function drawBrand(ctx, logo, t) {
    const logoSize = t === 'career' ? 31 : 27;
    const textSize = t === 'career' ? 14 : 13;
    const y = t === 'career' ? 82 : 76;
    const label = 'CAPITAL MASTERY';
    setFont(ctx, textSize, 'Arial', '700');
    const labelWidth = ctx.measureText(label).width + (label.length - 1) * 2.1;
    const groupWidth = (logo ? logoSize + 16 : 0) + labelWidth;
    let left = LOGICAL_W / 2 - groupWidth / 2;
    if (logo) {
      ctx.drawImage(logo, left, y - logoSize + 8, logoSize, logoSize);
      left += logoSize + 16;
    }
    ctx.fillStyle = '#071a33';
    ctx.textAlign = 'left';
    drawSpaced(ctx, label, left + labelWidth / 2, y, 2.1);
    ctx.textAlign = 'center';
  }

  function drawMainText(ctx, data) {
    const t = data.tier;
    const typeColor = t === 'foundations' ? '#244c78' : t === 'applied' ? '#147d83' : '#ae7b2d';
    const dark = '#071a33';
    const muted = '#65707c';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = typeColor;
    setFont(ctx, t === 'career' ? 14 : 12.5, 'Arial', '700');
    drawSpaced(ctx, data.type.toUpperCase(), LOGICAL_W / 2, t === 'career' ? 112 : 106, t === 'career' ? 2.5 : 2.2);

    ctx.fillStyle = muted;
    setFont(ctx, 9.5, 'Arial', '400');
    drawSpaced(ctx, data.awarded.toUpperCase(), LOGICAL_W / 2, 143, 1.35);

    ctx.fillStyle = '#111d2d';
    const nameSize = fitFont(ctx, data.name, t === 'career' ? 48 : 42, 24, 650, 'Georgia', '700');
    setFont(ctx, nameSize, 'Georgia', '700');
    ctx.fillText(data.name, LOGICAL_W / 2, 190);

    ctx.fillStyle = '#5d6874';
    setFont(ctx, 10.5, 'Arial', '400');
    ctx.fillText(data.forText, LOGICAL_W / 2, 220);

    ctx.fillStyle = dark;
    const titleSize = fitFont(ctx, data.title, t === 'career' ? 31 : t === 'applied' ? 27 : 26, 18, 650, 'Georgia', '700');
    setFont(ctx, titleSize, 'Georgia', '700');
    const titleLines = wrapText(ctx, data.title, 660).slice(0, 2);
    drawCenteredLines(ctx, titleLines, LOGICAL_W / 2, 256, titleSize * 1.08);

    if (data.description) {
      ctx.fillStyle = '#616a75';
      setFont(ctx, t === 'career' ? 9.6 : 9.2, 'Arial', '400');
      const descLines = wrapText(ctx, data.description, t === 'career' ? 650 : 610).slice(0, 3);
      const titleBottom = 256 + (titleLines.length - 1) * titleSize * 1.08;
      drawCenteredLines(ctx, descLines, LOGICAL_W / 2, titleBottom + 28, 13.5);
    }
  }

  function drawFooter(ctx, data, signature, qr) {
    const dark = '#071a33';
    const muted = '#66717d';
    const leftX = 150;
    const centerX = LOGICAL_W / 2;
    const rightX = 690;
    const baseline = 548;

    ctx.textAlign = 'center';
    ctx.fillStyle = muted;
    setFont(ctx, 8.5, 'Arial', '400');
    drawSpaced(ctx, 'ISSUED', leftX, baseline - 19, .9);
    ctx.fillStyle = dark;
    setFont(ctx, 9.5, 'Arial', '700');
    ctx.fillText(data.issued, leftX, baseline - 5);

    if (signature) {
      const w = data.tier === 'career' ? 170 : 150;
      const h = data.tier === 'career' ? 58 : 50;
      ctx.drawImage(signature, centerX - w / 2, baseline - 82, w, h);
    }
    ctx.strokeStyle = '#66717d';
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.moveTo(centerX - 76, baseline - 27);
    ctx.lineTo(centerX + 76, baseline - 27);
    ctx.stroke();
    ctx.fillStyle = dark;
    setFont(ctx, 9, 'Arial', '700');
    ctx.fillText('Shriyan Avadhanula', centerX, baseline - 12);
    ctx.fillStyle = muted;
    setFont(ctx, 8, 'Arial', '400');
    ctx.fillText('Founder, Capital Mastery', centerX, baseline + 3);

    if (qr) {
      const q = data.tier === 'career' ? 56 : 50;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rightX - q / 2 - 3, baseline - 94, q + 6, q + 6);
      ctx.drawImage(qr, rightX - q / 2, baseline - 91, q, q);
    }
    ctx.fillStyle = muted;
    setFont(ctx, 8.5, 'Arial', '400');
    drawSpaced(ctx, 'CREDENTIAL ID', rightX, baseline - 19, .55);
    ctx.fillStyle = dark;
    const idSize = fitFont(ctx, data.credentialId, 9, 6.5, 175, 'Arial', '700');
    setFont(ctx, idSize, 'Arial', '700');
    ctx.fillText(data.credentialId, rightX, baseline - 5);
  }

  async function renderCertificateCanvas() {
    const data = certificateData();
    const [logo, signature, seal, qr] = await Promise.all([
      optionalImage('assets/logo-mark.svg', 'assets/icon-192.png'),
      optionalImage('assets/founder-signature.png'),
      data.tier === 'career' ? optionalImage('assets/seal.svg') : Promise.resolve(null),
      getQrCanvas(data)
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = LOGICAL_W * SCALE;
    canvas.height = LOGICAL_H * SCALE;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.scale(SCALE, SCALE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawBackground(ctx, data.tier);
    drawBrand(ctx, logo, data.tier);
    if (seal) ctx.drawImage(seal, LOGICAL_W - 145, 102, 82, 82);
    drawMainText(ctx, data);
    drawFooter(ctx, data, signature, qr);

    return canvas;
  }

  async function downloadPdf(button) {
    try {
      button.disabled = true;
      button.textContent = 'Preparing PDF…';
      await loadJsPdf();
      if (!window.jspdf?.jsPDF) throw new Error('PDF export could not initialize.');

      const canvas = await renderCertificateCanvas();
      const image = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(image, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST');
      pdf.setProperties({ title: safeFileName('pdf').replace(/\.pdf$/i, ''), subject: 'Capital Mastery verified credential certificate', creator: 'Capital Mastery' });
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
    try {
      button.disabled = true;
      button.textContent = 'Preparing PNG…';
      const canvas = await renderCertificateCanvas();
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
      button.textContent = 'Download PNG';
    }
  }

  function bindPdfButton() {
    const button = document.querySelector('[data-cm-live-pdf], [data-cm-live-print]');
    if (!button || button.dataset.cmCanvasPdfBound === '1') return;
    const clean = button.cloneNode(true);
    clean.dataset.cmCanvasPdfBound = '1';
    clean.setAttribute('data-cm-live-pdf', 'true');
    clean.removeAttribute('data-cm-live-print');
    clean.textContent = 'Download PDF';
    button.replaceWith(clean);
    clean.addEventListener('click', () => downloadPdf(clean));
  }

  function bindPngButton() {
    const button = document.querySelector('[data-cm-live-png]');
    if (!button || button.dataset.cmCanvasPngBound === '1') return;
    const clean = button.cloneNode(true);
    clean.dataset.cmCanvasPngBound = '1';
    clean.textContent = 'Download PNG';
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

  window.addEventListener('hashchange', () => setTimeout(scheduleBind, 40));
  document.addEventListener('cm-auth-changed', () => setTimeout(scheduleBind, 60));
  const app = document.getElementById('app');
  if (app) new MutationObserver(scheduleBind).observe(app, { childList: true, subtree: true });
  setTimeout(scheduleBind, 100);
})();
