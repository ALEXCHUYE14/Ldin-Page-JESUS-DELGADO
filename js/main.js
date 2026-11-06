/* ==========================================================================
   JESÚS DELGADO · FOTOGRAFÍA — Interacciones
   Módulos: Preloader · Header · Menú móvil · Scrollspy · Hero · Contadores ·
            Portafolio + Lightbox · Testimonios · Paquetes · Formularios ·
            Modal · Toasts
   El contenido vive en index.html (SEO); este archivo solo añade comportamiento.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const CFG = window.APP_CONFIG || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name) => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const waLink = (text) => `https://wa.me/${CFG.WHATSAPP_NUMBER || '51958634348'}?text=${encodeURIComponent(text || CFG.WHATSAPP_DEFAULT_TEXT || '')}`;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------- Preloader + AOS ---------------- */
  function initPreloader() {
    const pre = $('#preloader');
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      pre && pre.classList.add('is-done');
      if (window.AOS) window.AOS.init({ duration: 1000, easing: 'ease-out-cubic', once: true, offset: 60, disable: reduceMotion });
      else document.documentElement.classList.add('no-aos');
    };
    if (document.readyState === 'complete') setTimeout(finish, 300);
    else window.addEventListener('load', () => setTimeout(finish, 300));
    setTimeout(finish, 2400);
  }

  /* ---------------- Header + WhatsApp flotante ---------------- */
  function initHeader() {
    const header = $('#header');
    const wa = $('.wa-float');
    let ticking = false;
    let formInView = false;   // la sección de reserva ya tiene su propio botón de WhatsApp
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      wa && wa.classList.toggle('is-visible', y > window.innerHeight * 0.35 && !formInView);
      ticking = false;
    };
    const form = $('#leadForm');
    if (wa && form && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { formInView = entry.isIntersecting; update(); }, { threshold: 0.15 }).observe(form);
    }
    update();
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    setTimeout(() => {
      if (!wa || !wa.classList.contains('is-visible')) return;
      wa.classList.add('is-nudge');
      setTimeout(() => wa.classList.remove('is-nudge'), 4500);
    }, 22000);
  }

  /* ---------------- Menú móvil ---------------- */
  function initMobileMenu() {
    const burger = $('#burger');
    const nav = $('#nav');
    if (!burger || !nav) return;
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) set(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1024) set(false); });
  }

  /* ---------------- Scrollspy ---------------- */
  function initScrollspy() {
    const links = $$('.nav__link[data-spy]');
    const sections = links.map(l => document.getElementById(l.dataset.spy)).filter(Boolean);
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(l => {
          const on = l.dataset.spy === en.target.id;
          l.classList.toggle('is-active', on);
          on ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------------- Hero (Swiper + Ken Burns + contador) ---------------- */
  function initHero() {
    if (!window.Swiper || !$('#heroSlider')) return;
    const idx = $('#heroIndex'), total = $('#heroTotal'), bar = $('#heroProgress'), cap = $('#heroCaption');
    const slides = $$('#heroSlider .swiper-slide');
    total.textContent = pad(slides.length);

    const sync = (sw) => {
      idx.textContent = pad(sw.realIndex + 1);
      if (!reduceMotion) { bar.classList.remove('is-running'); void bar.offsetWidth; bar.classList.add('is-running'); }
      const text = slides[sw.realIndex]?.dataset.caption || '';
      cap.classList.add('is-changing');
      setTimeout(() => { cap.textContent = text; cap.classList.remove('is-changing'); }, 350);
    };

    new window.Swiper('#heroSlider', {
      effect: 'fade', fadeEffect: { crossFade: true },
      loop: true, speed: 1600, allowTouchMove: false,
      autoplay: reduceMotion ? false : { delay: 6000, disableOnInteraction: false },
      on: { init: sync, slideChange: sync }
    });
  }

  /* ---------------- Contadores ---------------- */
  function initCounters() {
    const els = $$('[data-count]');
    if (reduceMotion) return; // los valores finales ya están en el HTML
    els.forEach(el => { el.textContent = '0'; });
    const run = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const t0 = performance.now(), dur = 2000;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------- Portafolio: filtros + lightbox ---------------- */
  function initPortfolio() {
    const grid = $('#gallery');
    if (!grid) return;
    const tiles = $$('.tile', grid);
    let visible = tiles.slice();

    // Contadores por categoría en los filtros
    $$('[data-count-cat]').forEach(s => {
      const c = s.dataset.countCat;
      s.textContent = c === 'all' ? tiles.length : tiles.filter(t => t.dataset.cat === c).length;
    });

    const toSlide = (t) => {
      const a = $('.tile__link', t);
      return { href: a.getAttribute('href'), type: 'image', title: a.dataset.title, description: a.dataset.desc };
    };
    const lightbox = window.GLightbox ? window.GLightbox({
      elements: visible.map(toSlide),
      touchNavigation: true, keyboardNavigation: true, loop: true,
      zoomable: true, draggable: true, openEffect: 'zoom', closeEffect: 'fade'
    }) : null;

    grid.addEventListener('click', e => {
      const tile = e.target.closest('.tile');
      if (!tile || !lightbox) return; // sin JS/lightbox, el enlace abre la imagen
      e.preventDefault();
      lightbox.openAt(visible.indexOf(tile));
    });

    const filters = $$('.filter');
    const indicator = $('.filters__indicator');
    const moveIndicator = (btn) => {
      if (!indicator || !btn) return;
      indicator.style.width = btn.offsetWidth + 'px';
      indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    const active = () => $('.filter.is-active');
    requestAnimationFrame(() => moveIndicator(active()));
    window.addEventListener('resize', () => moveIndicator(active()));
    document.fonts && document.fonts.ready.then(() => moveIndicator(active()));

    let busy = false;
    filters.forEach(btn => btn.addEventListener('click', () => {
      if (busy || btn.classList.contains('is-active')) return;
      busy = true;
      filters.forEach(f => { const on = f === btn; f.classList.toggle('is-active', on); f.setAttribute('aria-pressed', String(on)); });
      moveIndicator(btn);
      if (btn.parentElement.scrollWidth > btn.parentElement.clientWidth) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      const cat = btn.dataset.filter;
      visible.forEach(t => t.classList.add('is-entering'));
      setTimeout(() => {
        visible = tiles.filter(t => cat === 'all' || t.dataset.cat === cat);
        tiles.forEach(t => t.classList.toggle('is-hidden', !visible.includes(t)));
        visible.forEach((t, i) => setTimeout(() => t.classList.remove('is-entering'), 40 + Math.min(i, 12) * 55));
        tiles.filter(t => !visible.includes(t)).forEach(t => t.classList.remove('is-entering'));
        lightbox && lightbox.setElements(visible.map(toSlide));
        window.AOS && window.AOS.refresh();
        busy = false;
      }, reduceMotion ? 0 : 320);
    }));
  }

  /* ---------------- Testimonios ---------------- */
  function initTestimonials() {
    if (!window.Swiper || !$('#testimonialsSlider')) return;
    new window.Swiper('#testimonialsSlider', {
      slidesPerView: 1.08, spaceBetween: 14, rewind: true, grabCursor: true, speed: 700,
      autoplay: reduceMotion ? false : { delay: 7000, disableOnInteraction: false, pauseOnMouseEnter: true },
      navigation: { prevEl: '#tPrev', nextEl: '#tNext' },
      pagination: { el: '#tPagination', clickable: true },
      a11y: { prevSlideMessage: 'Testimonio anterior', nextSlideMessage: 'Testimonio siguiente' },
      breakpoints: { 720: { slidesPerView: 2, spaceBetween: 20 }, 1140: { slidesPerView: 3, spaceBetween: 24 } }
    });
  }

  /* ---------------- Toasts ---------------- */
  function toast({ type = 'ok', title, text, action }) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <span class="toast__icon">${icon(type === 'ok' ? 'check' : 'alert')}</span>
      <div>
        <strong>${esc(title)}</strong>
        ${text ? `<p>${esc(text)}</p>` : ''}
        ${action ? `<a href="${esc(action.href)}" target="_blank" rel="noopener">${esc(action.label)} ${icon('arrow-up-right')}</a>` : ''}
      </div>`;
    $('#toasts').appendChild(el);
    const remove = () => { el.classList.add('is-out'); setTimeout(() => el.remove(), 400); };
    setTimeout(remove, action ? 9000 : 5500);
    el.addEventListener('click', e => { if (!e.target.closest('a')) remove(); });
  }

  /* ---------------- Validación ---------------- */
  function validate(scope) {
    let firstBad = null;
    $$('input[required], select[required], input[pattern]', scope).forEach(input => {
      const ok = input.checkValidity() && (input.tagName !== 'SELECT' || input.value !== '');
      input.closest('.field')?.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = input;
    });
    firstBad && firstBad.focus();
    return !firstBad;
  }
  function clearInvalidOnInput(form) {
    const clear = e => { const f = e.target.closest('.field'); if (f) { f.classList.remove('is-invalid'); e.target.removeAttribute('aria-invalid'); } };
    form.addEventListener('input', clear);
    form.addEventListener('change', clear);
  }
  function setMinDate() {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const today = d.toISOString().slice(0, 10);
    $$('input[type="date"]').forEach(i => { i.min = today; });
  }
  function followUpText(d) {
    const fecha = d.fecha_evento ? new Date(d.fecha_evento + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return [
      `Hola Jesús, soy ${d.nombre}.`,
      `Acabo de enviar una solicitud desde tu web para: ${d.tipo_evento}${d.paquete ? ` (${d.paquete})` : ''}`,
      fecha && `Fecha: ${fecha}`,
      d.lugar_evento && `Lugar: ${d.lugar_evento}`
    ].filter(Boolean).join('\n');
  }

  async function sendLead(form, extra) {
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.website) return { ok: true, bot: true }; // honeypot: bots lo rellenan
    delete data.website;
    const payload = { ...data, ...extra };
    const btn = $('.form__submit', form);
    btn.classList.add('is-loading'); btn.disabled = true;
    try {
      const res = await window.LeadService.submit(payload);
      if (res.ok) {
        toast({
          type: 'ok',
          title: '¡Solicitud enviada!',
          text: res.demo ? 'Modo demostración: conecta Supabase en js/config.js para guardar los leads.' : 'Jesús te contactará muy pronto con tu propuesta personalizada.',
          action: { href: waLink(followUpText(payload)), label: 'Agilizar por WhatsApp' }
        });
      } else {
        toast({ type: 'error', title: 'No pudimos enviar tu solicitud', text: 'Inténtalo de nuevo o escríbenos por WhatsApp.', action: { href: waLink(followUpText(payload)), label: 'Escribir por WhatsApp' } });
      }
      return res;
    } catch (err) {
      console.error(err);
      toast({ type: 'error', title: 'Error de conexión', text: 'Revisa tu internet o contáctanos por WhatsApp.', action: { href: waLink(), label: 'Abrir WhatsApp' } });
      return { ok: false };
    } finally {
      btn.classList.remove('is-loading'); btn.disabled = false;
    }
  }

  /* ---------------- Formulario principal (2 pasos) ---------------- */
  let selectedPackage = null;
  function setPackage(name) {
    selectedPackage = name || null;
    $('#packageChip').hidden = !selectedPackage;
    $('#packageName').textContent = selectedPackage || '';
  }

  function initLeadForm() {
    const form = $('#leadForm');
    if (!form) return;
    clearInvalidOnInput(form);
    const steps = $$('.form__step', form);
    const dots = $$('[data-step-dot]', form);
    const fill = $('#progressFill');

    const goTo = (n, focus = true) => {
      steps.forEach(s => s.classList.toggle('is-active', s.dataset.step === String(n)));
      dots.forEach(d => d.classList.toggle('is-active', Number(d.dataset.stepDot) <= n));
      fill.style.transform = `scaleX(${n === 2 ? 1 : 0})`;
      const first = $(`.form__step[data-step="${n}"] input, .form__step[data-step="${n}"] select`, form);
      focus && first && setTimeout(() => first.focus({ preventScroll: true }), 60);
    };
    form._goTo = goTo;

    $('[data-next]', form).addEventListener('click', () => { if (validate(steps[0])) goTo(2); });
    $('[data-prev]', form).addEventListener('click', () => goTo(1));
    $('#packageClear').addEventListener('click', () => setPackage(null));
    steps[0].addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); $('[data-next]', form).click(); }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate(steps[0])) { goTo(1); return; }
      if (!validate(steps[1])) return;
      const res = await sendLead(form, { paquete: selectedPackage, origen: 'formulario_reserva' });
      if (res.ok) { form.reset(); setPackage(null); goTo(1, false); }
    });
  }

  /* ---------------- "Cotizar este paquete" ---------------- */
  function initPackages() {
    const form = $('#leadForm');
    const select = $('#f-tipo');
    const choose = (tipo, paquete) => {
      if (select && tipo) { select.value = tipo; select.closest('.field').classList.remove('is-invalid'); }
      setPackage(paquete);
      form._goTo && form._goTo(1, false);
      $('#reservar').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      form.classList.remove('is-highlight'); void form.offsetWidth; form.classList.add('is-highlight');
      setTimeout(() => $('#f-nombre').focus({ preventScroll: true }), 900);
    };
    $$('[data-package]').forEach(btn => btn.addEventListener('click', () => {
      choose(btn.dataset.package, btn.closest('.service').querySelector('.service__title').textContent.trim());
    }));
    $$('[data-package-link]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); choose(a.dataset.packageLink, 'Bodas & Novios');
    }));
  }

  /* ---------------- Modal "Consultar Disponibilidad" ---------------- */
  function initModal() {
    const modal = $('#availabilityModal');
    const form = $('#quickForm');
    if (!modal) return;
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('is-locked');
      setTimeout(() => $('#q-nombre').focus(), 80);
    };
    const close = () => {
      modal.classList.add('is-closing');
      setTimeout(() => {
        modal.hidden = true; modal.classList.remove('is-closing');
        document.body.classList.remove('is-locked');
        lastFocus && lastFocus.focus({ preventScroll: true });
      }, 280);
    };
    $$('[data-open-modal]').forEach(b => b.addEventListener('click', open));
    $$('[data-close-modal]', modal).forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (modal.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button, input, select, textarea, a[href]', modal).filter(el => !el.disabled && el.offsetParent !== null && !el.classList.contains('hp'));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    clearInvalidOnInput(form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate(form)) return;
      const res = await sendLead(form, { origen: 'modal_disponibilidad' });
      if (res.ok) { form.reset(); close(); }
    });
  }

  /* ---------------- FAQ: solo una abierta a la vez ---------------- */
  function initFaq() {
    const items = $$('.faq__item');
    items.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
    }));
  }

  /* ---------------- Init ---------------- */
  const start = () => {
    $('#year').textContent = new Date().getFullYear();
    initPreloader();
    initHeader();
    initMobileMenu();
    initScrollspy();
    initHero();
    initCounters();
    initPortfolio();
    initTestimonials();
    initLeadForm();
    initPackages();
    initModal();
    initFaq();
    setMinDate();
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
