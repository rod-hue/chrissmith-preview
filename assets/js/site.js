(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasG = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (!hasG) { document.documentElement.classList.add('no-js'); }

  /* ---------- nav, menu, progress ---------- */
  const nav = $('.nav'), burger = $('.nav__burger'), menu = $('.menu'), prog = $('.progress');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 600 && !menu.classList.contains('is-open'));
    lastY = y;
    prog.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => {
    menu.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* active nav link */
  const links = $$('.nav__links a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-on', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['effect', 'about', 'model', 'campaigns', 'company', 'news', 'advisory'].forEach(id => { const el = document.getElementById(id); el && io.observe(el); });

  /* ---------- counters ---------- */
  const count = el => {
    const to = +el.dataset.count; if (reduce || !to) return;
    const t0 = performance.now(), d = 1600;
    const step = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  $$('[data-count]').forEach(el => { if (!el.closest('.hero')) cio.observe(el); });
  const oio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); oio.unobserve(e.target); } }), { threshold: .35 });
  $$('.stat, .grid95').forEach(el => oio.observe(el));

  /* ---------- form -> mailto ---------- */
  const form = $('.form');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form), ok = $('.form__ok', form);
    if (!f.get('name') || !f.get('email') || !f.get('msg')) { ok.textContent = 'Please add your name, email and a short note.'; return; }
    const body = `Name: ${f.get('name')}\nOrganization: ${f.get('org') || ''}\nEmail: ${f.get('email')}\nPhone: ${f.get('phone') || ''}\nTopic: ${f.get('topic')}\n\n${f.get('msg')}`;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent('Inquiry: ' + f.get('topic') + ' (' + f.get('name') + ')')}&body=${encodeURIComponent(body)}`;
    ok.textContent = 'Opening your email app. Thank you.';
  });

  if (!hasG) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: .11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; }
      const t = $(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -10 }); }
    }));
  }

  /* ---------- split h2 into words ---------- */
  $$('.h2').forEach(h => {
    const walk = n => {
      [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const o = document.createElement('span'); o.className = 'w'; const i = document.createElement('span'); i.textContent = w; o.appendChild(i); frag.appendChild(o);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c);
      });
    };
    walk(h);
    if (!reduce) gsap.from($$('.w > span', h), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  /* ---------- hero intro: wipe, never fade, nothing crosses the face ---------- */
  const hero = $('.hero');
  $$('.hero__name span').forEach(s => s.dataset.l = s.textContent);
  const bare = (el) => { const t = el.style.transform, c = el.style.clipPath; el.style.transform = 'none'; el.style.clipPath = 'none'; const r = el.getBoundingClientRect(); el.style.transform = t; el.style.clipPath = c; return r; };
  const placeFirst = () => { const S = $('.hero__name span'), st = $('.hero__stage'), f = $('.hero__first'); if (!S || !f) return;
    const r = bare(S), rs = st.getBoundingClientRect(); f.style.setProperty('--nx', (r.left - rs.left - r.width * .02) + 'px');
    /* "Effect" hangs off the bottom-right of the H; ripple centers on his chest */
    const H = $$('.hero__name span').pop(), e = $('.hero__last'), rh = bare(H);
    const pr = bare($('.hero__person')); if (e) { const wide = innerWidth > 860; const want = wide ? Math.max(rh.right - rs.left - e.offsetWidth, pr.right - rs.left - pr.width * .08) : rh.right - rs.left - e.offsetWidth; e.style.setProperty('--ex', Math.min(want, rs.width - e.offsetWidth - 16) + 'px'); e.style.setProperty('--ey', (rh.bottom - rs.top - e.offsetHeight * .18) + 'px'); }
    const p = $('.hero__person').getBoundingClientRect();
    st.style.setProperty('--rx', (p.left + p.width * .5 - rs.left) + 'px'); st.style.setProperty('--ry', (p.top + p.height * .3 - rs.top) + 'px'); };
  placeFirst(); addEventListener('resize', placeFirst); document.fonts && document.fonts.ready.then(placeFirst);
  if (!reduce) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__photo', { scale: 1.3, duration: 2.4, ease: 'power2.out' }, 0)
      .from('.hero__name span', { yPercent: 105, duration: 1.3, stagger: .07, clipPath: 'inset(0 0 100% 0)' }, .15)
      .from('.hero__first span', { yPercent: 100, clipPath: 'inset(0 0 100% 0)', duration: 1 }, .35)
      .from('.hero__last span', { xPercent: -30, clipPath: 'inset(0 100% 0 0)', duration: 1.2 }, 1.1)
      .fromTo('.hero__cut', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, .3)
      .from('.hero__cut', { y: 60, duration: 1.8 }, .3)
      .from('.hero__copy > *', { y: 40, opacity: 0, duration: 1, stagger: .09 }, .9)
      .from('.chip', { x: 30, clipPath: 'inset(0 0 0 100% round 14px)', duration: 1, stagger: .12, onComplete() { $$('.hero [data-count]').forEach(count); } }, 1.3)
      .from('.ticker', { yPercent: 100, duration: .9 }, 1.2);

    /* scroll: letters drift apart behind him, photo deepens */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const L = $$('.hero__name span');
      L.forEach((s, i) => gsap.to(s, { xPercent: (i - 2) * 22, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } }));
      gsap.to('.hero__person', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__photo', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      /* subtle pointer parallax (background only) */
      const bg = $('.hero__lattice'), bk = $('.hero__bokeh');
      const mv = e => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; gsap.to(bg, { x: x * 20, y: y * 20, duration: 1 }); gsap.to(bk, { x: x * -40, y: y * -30, duration: 1.2 }); };
      hero.addEventListener('pointermove', mv);
      return () => hero.removeEventListener('pointermove', mv);
    });
  }

  /* ---------- generic reveals ---------- */
  if (!reduce) {
    const rv = (sel, opts = {}) => $$(sel).forEach(el => gsap.from(el, Object.assign({ y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }, opts)));
    rv('.define__card', { y: 70, rotate: -1.5 }); gsap.from('.ripples li', { x: -40, opacity: 0, stagger: .12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ripples', start: 'top 85%' } });
    gsap.from('.define__ripple', { scale: .25, opacity: 0, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.define', start: 'top 70%' } });
    rv('.lede'); rv('.about__copy > p:not(.lede):not(.kicker)'); rv('.pull'); rv('.facets li', { stagger: .08 });
    rv('.press__note'); rv('.camps__note'); rv('.model__intro'); rv('.night__copy p'); rv('.beyond__copy > p'); rv('.contact__copy > p');
    gsap.utils.toArray('.stat').forEach((s, i) => gsap.from(s, { y: 60, opacity: 0, duration: 1.1, delay: i * .08, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } }));
    gsap.from('.star', { y: 60, opacity: 0, scale: .96, duration: 1.1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.stars__grid', start: 'top 85%' } });
    gsap.from('.svc', { y: 50, opacity: 0, duration: 1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.svcs', start: 'top 85%' } });
    gsap.from('.clip', { y: 40, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.clips', start: 'top 88%' } });
    gsap.from('.feat', { y: 60, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.feats', start: 'top 88%' } });
    /* image wipes */
    $$('.about__main, .beyond__img, .reel figure, .advisory__img, .contact__img').forEach(f => {
      gsap.fromTo(f, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 88%' } });
    });
    gsap.from('.about__float--a', { yPercent: 30, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.beyond__row figure', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.beyond__row', start: 'top 90%' } });
  }

  /* ---------- pinned scenes (desktop) ---------- */
  const mm2 = gsap.matchMedia();
  mm2.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
    /* model: lines from his hands to each pillar, drawn as the pillars arrive (no pin) */
    const stage = $('.model__stage'), svg = $('.model__lines'), hub = $('.model__hub');
    const paths = $$('.model__lines path'), cards = $$('.pillar');
    const drawLines = () => {
      const s = stage.getBoundingClientRect(), h = hub.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
      const hx = h.left + h.width / 2 - s.left, hy = h.top + h.height / 2 - s.top;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect(), left = i % 2 === 0;
        const x = (left ? r.right + 10 : r.left - 10) - s.left, y = r.top + r.height / 2 - s.top;
        const mx = hx + (x - hx) * .45;
        paths[i].setAttribute('d', `M${hx} ${hy} C ${mx} ${hy}, ${mx} ${y}, ${x} ${y}`);
        const L = paths[i].getTotalLength(); paths[i].style.strokeDasharray = `${L}`; paths[i].dataset.l = L;
        if (!paths[i].dataset.done) paths[i].style.strokeDashoffset = `${L}`;
      });
    };
    drawLines(); addEventListener('resize', drawLines); ScrollTrigger.addEventListener('refresh', drawLines);
    $('.model__cut').complete ? drawLines() : $('.model__cut').addEventListener('load', () => { drawLines(); ScrollTrigger.refresh(); });
    gsap.fromTo('.model__cut', { clipPath: 'inset(100% 0 0 0)', yPercent: 8 }, { clipPath: 'inset(0% 0 0 0)', yPercent: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: stage, start: 'top 75%' } });
    const order = [0, 1, 2, 3, 4, 5];
    order.forEach((i, k) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: cards[i], start: 'top 82%' } });
      tl.to(paths[i], { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut', delay: (k % 2) * .15, onComplete() { paths[i].dataset.done = 1; } })
        .from(cards[i], { opacity: 0, x: i % 2 === 0 ? -40 : 40, clipPath: 'inset(0 0 0 0 round 16px)', duration: .9, ease: 'expo.out' }, '-=.35');
    });

    /* campaigns: horizontal rail */
    const track = $('.camps__track'), line = $('.camps__line');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 40);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.camps', start: 'top top', end: () => '+=' + dist(), pin: '.camps__pin', scrub: .7, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1,
        onUpdate: s => line.style.setProperty('--p', s.progress.toFixed(3)) }
    });
  });

  /* night reel parallax */
  if (!reduce) {
    $$('.reel img').forEach((im, i) => gsap.fromTo(im, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  ScrollTrigger.sort();
  addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
