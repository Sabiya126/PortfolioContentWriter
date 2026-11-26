/* ==========================================================
   Sabiya Shaik — Portfolio · vanilla JavaScript
   ========================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Loader → start everything ---------- */
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    const loader = $('#loader');
    body.classList.remove('is-loading');
    body.classList.add('loaded');
    if (loader) loader.classList.add('done');
    initReveal();
  };
  const t0 = performance.now();
  const ready = () => {
    const wait = reduceMotion ? 0 : Math.max(0, 1500 - (performance.now() - t0));
    setTimeout(start, wait);
  };
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  setTimeout(start, 4500); // safety net if a slow asset delays "load"

  /* ---------- 2. Scroll reveal (IntersectionObserver) ---------- */
  function initReveal() {
    const targets = $$('.reveal, .img-reveal, .steps');
    if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('in')); countersNow(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target._reveal || entry.target; // image frames are observed via their parent (clip-path hides them from the observer)
        el.classList.add('in');
        $$('[data-count]', el).forEach(runCounter);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => {
      if (el.classList.contains('img-reveal')) { el.parentElement._reveal = el; io.observe(el.parentElement); }
      else io.observe(el);
    });
  }

  /* ---------- 3. Counters (only verified figures from the brief) ---------- */
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const end = parseInt(el.dataset.count, 10) || 0;
    if (reduceMotion) { el.textContent = end; return; }
    const dur = 1600, t = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function countersNow() { $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; }); }

  /* ---------- 4. Header, progress bar, back-to-top, parallax ---------- */
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const parallaxEls = reduceMotion ? [] : $$('[data-parallax]');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('scrolled', y > 24);
    toTop.classList.toggle('show', y > 700);
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2) - vh / 2) * speed * -1}px, 0)`;
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- 5. Navigation: mobile menu + active link ---------- */
  const menuBtn = $('#menuBtn');
  const menu = $('#mobileMenu');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    $$('a', menu).forEach(a => { a.tabIndex = open ? 0 : -1; });
  };
  setMenu(false);
  menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  const navLinks = $$('.nav-link');
  const sections = ['home', 'about', 'expertise', 'work', 'experience', 'contact'].map(id => document.getElementById(id));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => s && spy.observe(s));
  }

  /* ---------- 6. Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 7. Custom cursor (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    const dot = $('#cursorDot'), ring = $('#cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;
    root.classList.add('has-cursor');
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      root.classList.add('cursor-on');
    }, { passive: true });
    document.addEventListener('mouseleave', () => root.classList.remove('cursor-on'));
    const loop = () => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    const hoverSel = 'a, button, summary, input, textarea, .x-card, .work-open';
    document.addEventListener('mouseover', e => { if (e.target.closest(hoverSel)) root.classList.add('cursor-hover'); });
    document.addEventListener('mouseout', e => { if (e.target.closest(hoverSel)) root.classList.remove('cursor-hover'); });
  }

  /* ---------- 8. Gallery filter ---------- */
  const filters = $$('.filter');
  const items = $$('.work-item');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    filters.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    let k = 0;
    items.forEach(it => {
      const show = cat === 'all' || it.dataset.category === cat;
      it.hidden = !show;
      it.classList.remove('pop');
      if (show) { it.style.setProperty('--k', k++); void it.offsetWidth; it.classList.add('pop'); }
    });
  }));

  /* ---------- 9. Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg'), lbCat = $('#lbCat'), lbCount = $('#lbCount');
  let current = 0, list = [], lastFocus = null;
  const visibleItems = () => items.filter(i => !i.hidden);
  const show = (idx) => {
    current = (idx + list.length) % list.length;
    const fig = list[current], img = $('img', fig);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCat.textContent = fig.dataset.label || '';
    lbCount.textContent = `${current + 1} / ${list.length}`;
  };
  const openLb = (fig) => {
    list = visibleItems();
    lastFocus = document.activeElement;
    show(list.indexOf(fig));
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    body.classList.add('lb-open');
    $('.lb-close', lb).focus();
  };
  const closeLb = () => {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  };
  items.forEach(fig => $('.work-open', fig).addEventListener('click', () => openLb(fig)));
  $('.lb-close', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', () => show(current - 1));
  $('.lb-next', lb).addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  window.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('button', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- 10. Contact form → mailto ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  const TO = 'shaiksabiyak@gmail.com';
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const d = new FormData(form);
    const name = String(d.get('name')).trim(), email = String(d.get('email')).trim();
    const subject = String(d.get('subject')).trim(), message = String(d.get('message')).trim();
    const text = `Hi Sabiya,\n\n${message}\n\nRegards,\n${name}\n${email}`;
    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    status.textContent = `Opening your email app… if nothing opens, please write to ${TO} directly.`;
  });
})();
