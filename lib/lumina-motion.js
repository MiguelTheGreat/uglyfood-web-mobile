/**
 * LUMINA DESIGN SYSTEM — DROP-IN MOTION & INTERACTION ENGINE
 * Zero external dependencies. Exposes window.LuminaDesign.
 *
 * Includes:
 * - Dual-ring magnetic cursor + click ripples (initCursor)
 * - 4-panel split-curtain transition controller (playCurtain)
 * - Mouse-tracking radial spotlight aura (initRadialAura)
 * - Top scroll progress hairline (initScrollProgress)
 * - Synthesized Web Audio API paper rustle (playPaperRustle)
 * - Floating pill toast notification (showToast)
 * - Light / Dark Museum theme toggle (initTheme / toggleTheme)
 */
(function () {
  let audioCtx = null;
  let noiseBuffer = null;
  let lastRustleAt = 0;
  let toastTimer = null;

  /* ------------------------------------------------------------------------
     1. DUAL-RING MAGNETIC CUSTOM CURSOR
     ------------------------------------------------------------------------ */
  function initCursor() {
    const ring = document.getElementById('cursor-ring');
    const dot = document.getElementById('cursor-dot');
    const label = document.getElementById('cursor-label');
    if (!ring || !dot) return null;

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      rx: window.innerWidth / 2,
      ry: window.innerHeight / 2,
      raf: null
    };

    function tick() {
      const dx = state.x - state.rx;
      const dy = state.y - state.ry;
      state.rx += dx * 0.18;
      state.ry += dy * 0.18;
      dot.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${state.rx}px, ${state.ry}px, 0) translate(-50%, -50%)`;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        state.raf = requestAnimationFrame(tick);
      } else {
        state.raf = null;
      }
    }

    window.addEventListener(
      'mousemove',
      (e) => {
        state.x = e.clientX;
        state.y = e.clientY;
        if (!state.raf && !document.hidden) {
          state.raf = requestAnimationFrame(tick);
        }
      },
      { passive: true }
    );

    window.addEventListener('mousedown', (e) => {
      if (document.body.classList.contains('modal-open')) return;
      const ripple = document.createElement('div');
      ripple.className = 'cursor-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 750);
    });

    document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));
    document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));

    function bindTargets(root = document) {
      root.querySelectorAll('.hover-target, a, button').forEach((el) => {
        if (el.dataset.luminaCursorBound || el.hasAttribute('data-cursor-inspect') || el.hasAttribute('data-cursor-paint')) return;
        el.dataset.luminaCursorBound = '1';
        el.addEventListener('mouseenter', () => {
          document.body.classList.remove('cursor-inspect', 'cursor-painting');
          document.body.classList.add('cursor-hover');
          if (label) label.textContent = '';
        });
        el.addEventListener('mouseleave', () => {
          document.body.classList.remove('cursor-hover');
        });
      });

      root.querySelectorAll('[data-cursor-inspect]').forEach((el) => {
        if (el.dataset.luminaCursorBound) return;
        el.dataset.luminaCursorBound = '1';
        el.addEventListener('mouseenter', () => {
          document.body.classList.remove('cursor-hover', 'cursor-painting');
          document.body.classList.add('cursor-inspect');
          if (label) label.textContent = el.getAttribute('data-cursor-inspect') || 'VIEW';
        });
        el.addEventListener('mouseleave', () => {
          document.body.classList.remove('cursor-inspect');
          if (label) label.textContent = '';
        });
      });

      root.querySelectorAll('[data-cursor-paint]').forEach((el) => {
        if (el.dataset.luminaCursorBound) return;
        el.dataset.luminaCursorBound = '1';
        el.addEventListener('mouseenter', () => {
          document.body.classList.remove('cursor-hover', 'cursor-inspect');
          document.body.classList.add('cursor-painting');
          if (label) label.textContent = '';
        });
        el.addEventListener('mouseleave', () => {
          document.body.classList.remove('cursor-painting');
        });
      });
    }

    bindTargets();
    return { bindTargets };
  }

  /* ------------------------------------------------------------------------
     2. 4-PANEL SPLIT-CURTAIN CONTROLLER
     ------------------------------------------------------------------------ */
  function playCurtain({ title = 'LUMINA.', subtitle = 'Museum Design Language', holdMs = 780 } = {}) {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    const titleEl = overlay.querySelector('#intro-text');
    const subEl = overlay.querySelector('#intro-subtext');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.animation = 'none';
      void titleEl.offsetWidth;
      titleEl.style.animation = '';
    }
    if (subEl) {
      subEl.textContent = subtitle;
      subEl.style.animation = 'none';
      void subEl.offsetWidth;
      subEl.style.animation = '';
    }

    overlay.classList.remove('curtain-hidden', 'curtain-open', 'curtain-closing');
    void overlay.offsetWidth;

    setTimeout(() => {
      overlay.classList.add('curtain-open');
      setTimeout(() => {
        overlay.classList.add('curtain-hidden');
      }, 900);
    }, holdMs);
  }

  /* ------------------------------------------------------------------------
     3. RADIAL MOUSE-TRACKING AURA
     ------------------------------------------------------------------------ */
  function initRadialAura(selector = '.volume-band, .accordion-strip') {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.luminaAuraBound) return;
      el.dataset.luminaAuraBound = '1';
      el.addEventListener(
        'mousemove',
        (e) => {
          const rect = el.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 100;
          const my = ((e.clientY - rect.top) / rect.height) * 100;
          el.style.setProperty('--mx', `${mx.toFixed(1)}%`);
          el.style.setProperty('--my', `${my.toFixed(1)}%`);
        },
        { passive: true }
      );
    });
  }

  /* ------------------------------------------------------------------------
     4. SCROLL PROGRESS HAIRLINE
     ------------------------------------------------------------------------ */
  function initScrollProgress(selector = '.lumina-scroll-progress') {
    const bar = document.querySelector(selector);
    if (!bar) return;
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = `scaleX(${pct})`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------------
     5. SYNTHESIZED WEB AUDIO PAPER RUSTLE (Zero external audio files)
     ------------------------------------------------------------------------ */
  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
      const len = Math.floor(audioCtx.sampleRate * 0.6);
      noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.08) * 0.85;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playPaperRustle(volume = 0.055) {
    const now = performance.now();
    if (now - lastRustleAt < 220) return;
    lastRustleAt = now;

    const ac = ensureAudio();
    if (!ac || !noiseBuffer) return;

    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer;

    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, t);
    bp.frequency.exponentialRampToValueAtTime(2100, t + 0.11);
    bp.frequency.exponentialRampToValueAtTime(1000, t + 0.30);
    bp.Q.value = 0.85;

    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 420;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(volume * 0.4, t + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

    src.connect(bp);
    bp.connect(hp);
    hp.connect(gain);
    gain.connect(ac.destination);
    src.start(t);
    src.stop(t + 0.34);
  }

  /* ------------------------------------------------------------------------
     6. FLOATING PILL TOAST
     ------------------------------------------------------------------------ */
  function showToast(message, duration = 2400) {
    let el = document.getElementById('lumina-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lumina-toast';
      el.className = 'lumina-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
  }

  /* ------------------------------------------------------------------------
     7. THEME TOGGLE (Museum Paper <-> Gallery Noir)
     ------------------------------------------------------------------------ */
  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('lumina-theme', theme);
    } catch {}
  }

  function initTheme() {
    let saved = 'light';
    try {
      saved = localStorage.getItem('lumina-theme') || 'light';
    } catch {}
    setTheme(saved);
    return saved;
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    playPaperRustle(0.04);
    return next;
  }

  window.LuminaDesign = {
    initCursor,
    playCurtain,
    initRadialAura,
    initScrollProgress,
    playPaperRustle,
    showToast,
    setTheme,
    initTheme,
    toggleTheme
  };
})();
