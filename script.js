(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Scroll reveal ---------- */
  const revealTargets = $$('[data-reveal], .timeline li');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Header state, scroll progress, floating controls ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress span');
  const toTop = $('.to-top');
  const stickyCta = $('.sticky-cta');
  const navLinks = $$('.header-nav a');
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-stuck', y > 12);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
    if (stickyCta) stickyCta.classList.toggle('is-visible', y > 400);

    let active = null;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 140) active = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + active);
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---------- Countdown ---------- */
  const countdown = $('.countdown');
  if (countdown) {
    const deadline = new Date(countdown.dataset.deadline).getTime();
    const fields = {
      days: $('[data-cd="days"]', countdown),
      hours: $('[data-cd="hours"]', countdown),
      minutes: $('[data-cd="minutes"]', countdown),
      seconds: $('[data-cd="seconds"]', countdown)
    };
    const label = $('.countdown-label', countdown);

    const setValue = (el, value) => {
      const text = String(value).padStart(2, '0');
      if (!el || el.textContent === text) return;
      el.textContent = text;
      if (reduceMotion) return;
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    };

    const render = () => {
      const diff = deadline - Date.now();
      if (!Number.isFinite(deadline)) return;
      if (diff <= 0) {
        countdown.classList.add('is-over');
        if (label) label.textContent = 'Kampanjen har avslutats – kontakta salongen för aktuella priser.';
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      setValue(fields.days, Math.floor(s / 86400));
      setValue(fields.hours, Math.floor(s / 3600) % 24);
      setValue(fields.minutes, Math.floor(s / 60) % 60);
      setValue(fields.seconds, s % 60);
    };

    const timer = setInterval(render, 1000);
    render();
  }

  /* ---------- Count-up numbers ---------- */
  const counters = $$('[data-count-to]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const format = (n) => n.toLocaleString('sv-SE');
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.countTo);
        const suffix = el.dataset.countSuffix || '';
        const duration = 1200;
        const start = performance.now();

        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = format(Math.round(target * eased)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => countObserver.observe(el));
  }

  /* ---------- Hero sparkles ---------- */
  const sparkleHost = $('.hero-sparkles');
  if (sparkleHost && !reduceMotion) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('i');
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = 20 + Math.random() * 75 + '%';
      dot.style.animationDuration = 6 + Math.random() * 8 + 's';
      dot.style.animationDelay = Math.random() * 8 + 's';
      dot.style.transform = 'scale(' + (0.4 + Math.random() * 0.9) + ')';
      fragment.appendChild(dot);
    }
    sparkleHost.appendChild(fragment);
  }

  /* ---------- Hero tilt ---------- */
  const tilt = $('[data-tilt] .hero-img-frame');
  if (tilt && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const host = tilt.parentElement;
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.02)`;
    });
    host.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- FAQ: one open at a time ---------- */
  const faqItems = $$('.faq details');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox');
  const zoomButtons = $$('.gallery .zoom');
  if (lightbox && zoomButtons.length) {
    const lbImg = $('.lb-stage img', lightbox);
    const lbCaption = $('.lb-stage figcaption', lightbox);
    const btnClose = $('.lb-close', lightbox);
    const btnPrev = $('.lb-prev', lightbox);
    const btnNext = $('.lb-next', lightbox);
    let index = 0;
    let lastFocused = null;

    const show = (i) => {
      index = (i + zoomButtons.length) % zoomButtons.length;
      const source = zoomButtons[index].querySelector('img');
      lbImg.src = source.currentSrc || source.src;
      lbImg.alt = source.alt;
      lbCaption.textContent = zoomButtons[index].dataset.caption || '';
    };

    const open = (i) => {
      lastFocused = document.activeElement;
      show(i);
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => { lightbox.hidden = true; lbImg.removeAttribute('src'); }, 300);
      if (lastFocused) lastFocused.focus();
    };

    zoomButtons.forEach((btn, i) => btn.addEventListener('click', () => open(i)));
    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => show(index - 1));
    btnNext.addEventListener('click', () => show(index + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'Tab') {
        const focusables = [btnClose, btnPrev, btnNext];
        const current = focusables.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? current - 1 : current + 1;
        focusables[(next + focusables.length) % focusables.length].focus();
      }
    });

    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 50) show(index + (delta < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- Bokadirekt reviews ---------- */
  const reviewsSection = $('[data-reviews-endpoint]');
  if (reviewsSection && 'fetch' in window) {
    const track = $('[data-reviews-track]', reviewsSection);
    const status = $('[data-reviews-status]', reviewsSection);
    const summary = $('[data-reviews-summary]', reviewsSection);
    const averageEl = $('[data-reviews-average]', reviewsSection);
    const starsEl = $('[data-reviews-stars]', reviewsSection);
    const countEl = $('[data-reviews-count]', reviewsSection);
    const btnPrevRv = $('.rv-prev', reviewsSection);
    const btnNextRv = $('.rv-next', reviewsSection);

    const PAGE_SIZE = 30;
    const dateFormat = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });

    let rendered = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    const buildStars = (score) => {
      const wrap = document.createElement('span');
      wrap.className = 'stars';
      wrap.setAttribute('role', 'img');
      wrap.setAttribute('aria-label', `${score} av 5 i betyg`);
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.textContent = '★';
        if (i > Math.round(score)) star.className = 'is-empty';
        wrap.appendChild(star);
      }
      return wrap;
    };

    const buildCard = (item, order) => {
      const card = document.createElement('article');
      card.className = 'review-card rv-in';
      card.setAttribute('role', 'listitem');
      if (!reduceMotion) card.style.animationDelay = Math.min(order, 6) * 70 + 'ms';

      const quote = document.createElement('span');
      quote.className = 'rv-quote';
      quote.setAttribute('aria-hidden', 'true');
      quote.textContent = '”';
      card.appendChild(quote);

      const stars = buildStars(Number(item.review.score) || 0);
      stars.classList.add('rv-stars');
      card.appendChild(stars);

      const text = document.createElement('p');
      text.className = 'rv-text';
      text.textContent = String(item.review.text).trim();
      card.appendChild(text);

      const name = (item.author && item.author.name ? String(item.author.name) : 'Kund').trim();
      const meta = document.createElement('footer');
      meta.className = 'rv-meta';

      const avatar = document.createElement('span');
      avatar.className = 'rv-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = name.charAt(0).toUpperCase();
      meta.appendChild(avatar);

      const who = document.createElement('span');
      who.className = 'rv-who';
      const whoName = document.createElement('strong');
      whoName.textContent = name;
      who.appendChild(whoName);

      const created = new Date(item.createdAt);
      if (!Number.isNaN(created.getTime())) {
        const time = document.createElement('time');
        time.dateTime = created.toISOString().slice(0, 10);
        time.textContent = dateFormat.format(created);
        who.appendChild(time);
      }
      meta.appendChild(who);
      card.appendChild(meta);
      return card;
    };

    const updateSummary = (total) => {
      if (!scoreCount) return;
      const average = scoreSum / scoreCount;
      averageEl.textContent = average.toFixed(1).replace('.', ',');
      starsEl.replaceChildren(...buildStars(average).childNodes);
      countEl.textContent = `${total || scoreCount} omdömen på Bokadirekt`;
      summary.hidden = false;
    };

    const updateNav = () => {
      if (!btnPrevRv || !btnNextRv) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const showNav = maxScroll > 8 && rendered > 0;
      btnPrevRv.hidden = !showNav;
      btnNextRv.hidden = !showNav;
      btnPrevRv.disabled = track.scrollLeft <= 8;
      btnNextRv.disabled = track.scrollLeft >= maxScroll - 8;
    };

    const load = async () => {
      try {
        const url = new URL(reviewsSection.dataset.reviewsEndpoint, window.location.href);
        url.searchParams.set('page', '1');
        url.searchParams.set('limit', String(PAGE_SIZE));

        const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];

        const fragment = document.createDocumentFragment();
        items.forEach((item) => {
          const score = Number(item && item.review && item.review.score);
          if (Number.isFinite(score)) { scoreSum += score; scoreCount += 1; }
          const text = item && item.review && item.review.text;
          if (!text || !String(text).trim()) return;
          fragment.appendChild(buildCard(item, rendered++));
        });
        track.replaceChildren(fragment);
        track.setAttribute('aria-busy', 'false');

        updateSummary(Number(data.count));
        status.hidden = rendered > 0;
        if (!rendered) status.textContent = 'Inga omdömen att visa just nu.';
        updateNav();
      } catch (error) {
        track.replaceChildren();
        track.setAttribute('aria-busy', 'false');
        status.hidden = false;
        status.textContent = 'Omdömena kunde inte hämtas just nu – du hittar dem alla på Bokadirekt.';
      }
    };

    const scrollByCard = (direction) => {
      const card = $('.review-card', track);
      const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
      track.scrollBy({ left: step * direction, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    if (btnPrevRv) btnPrevRv.addEventListener('click', () => scrollByCard(-1));
    if (btnNextRv) btnNextRv.addEventListener('click', () => scrollByCard(1));
    track.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);

    if ('IntersectionObserver' in window) {
      const reviewsObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        reviewsObserver.disconnect();
        load();
      }, { rootMargin: '200px' });
      reviewsObserver.observe(reviewsSection);
    } else {
      load();
    }
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
