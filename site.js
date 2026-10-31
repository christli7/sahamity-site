// Sahamity website: language and theme (asked on first visit, then remembered), motion and the app tour.
(function () {
  var KEY = 'sahamity.lang';
  var root = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(lang, remember) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
    if (remember) { try { localStorage.setItem(KEY, lang); } catch (e) {} }
  }

  // Theme: the head script sets it before first paint; the app screenshots follow it.
  var THEME_KEY = 'sahamity.theme';
  function applyTheme(theme, remember) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F5F2EB' : '#040508');
    document.querySelectorAll('[data-set-theme]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-theme') === theme));
    });
    document.querySelectorAll('img[data-shot]').forEach(function (img) {
      img.src = (theme === 'light' ? '/shots/light/' : '/shots/') + img.getAttribute('data-shot') + '.webp';
    });
    if (remember) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
  }

  var saved = stored();
  var guess = /^(id|ms)\b/i.test(navigator.language || '') ? 'id' : 'en';
  apply(saved === 'id' || saved === 'en' ? saved : guess, false);

  // Wrap each word of a headline so it can rise in sequence; gradient phrases move as one piece.
  function splitWords(el) {
    var i = 0;
    el.querySelectorAll(':scope > [lang]').forEach(function (block) {
      i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span');
              w.className = 'w';
              w.style.setProperty('--i', i++);
              w.textContent = part;
              frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.classList && child.classList.contains('grad')) {
            child.classList.add('w');
            child.style.setProperty('--i', i++);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      })(block);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-lang'), false);
    applyTheme(root.getAttribute('data-theme') || 'dark', false);
    document.querySelectorAll('[data-set-theme]').forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(b.getAttribute('data-set-theme'), true); });
    });
    document.querySelectorAll('[data-toggle-theme]').forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true); });
    });
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-set-lang'), true); });
    });

    var picker = document.getElementById('langpick');
    if (picker && !saved) {
      picker.hidden = false;
      document.body.style.overflow = 'hidden';
      var first = picker.querySelector('[data-pick-lang="' + root.getAttribute('data-lang') + '"]');
      if (first) first.focus();
      picker.querySelectorAll('[data-pick-lang]').forEach(function (b) {
        b.addEventListener('click', function () {
          apply(b.getAttribute('data-pick-lang'), true);
          picker.hidden = true;
          document.body.style.overflow = '';
        });
      });
    }

    // Store listings are not live yet.
    document.querySelectorAll('[data-store]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.getAttribute('href') !== '#') return;
        e.preventDefault();
        alert(root.getAttribute('data-lang') === 'id' ? 'Segera hadir!' : 'Coming soon!');
      });
    });

    // Seamless ticker tape: duplicate its content once.
    var tape = document.getElementById('tape');
    if (tape) tape.innerHTML += tape.innerHTML;

    document.querySelectorAll('.split').forEach(splitWords);

    // Hero phone: alternate between the IDX and US feeds.
    var heroShots = document.querySelectorAll('#hero-shot img');
    if (heroShots.length && !reduced) {
      var mkt = 'idx';
      setInterval(function () {
        mkt = mkt === 'idx' ? 'us' : 'idx';
        heroShots.forEach(function (img) { img.classList.toggle('on', img.getAttribute('data-mkt') === mkt); });
      }, 4200);
    }

    // Reveal on scroll
    var els = document.querySelectorAll('.reveal, .split, .step');
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (el) { io.observe(el); });
    }

    // Nav state + scroll progress
    var nav = document.querySelector('.nav');
    var bar = document.querySelector('.progress');
    function onScroll() {
      var max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (nav) nav.classList.toggle('scrolled', scrollY > 20);
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!reduced && matchMedia('(pointer: fine)').matches) {
      // Hero: spotlight and 3D tilt follow the pointer.
      var hero = document.querySelector('.hero');
      var spot = hero && hero.querySelector('.spot');
      var tilt = document.querySelector('#stage .tilt');
      if (hero) hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (spot) { spot.style.setProperty('--mx', x * 100 + '%'); spot.style.setProperty('--my', y * 100 + '%'); }
        if (tilt) { tilt.style.setProperty('--ry', (-12 + (x - 0.5) * 14).toFixed(2) + 'deg'); tilt.style.setProperty('--rx', (5 - (y - 0.5) * 10).toFixed(2) + 'deg'); }
      });
      // Step cards: glow follows the pointer.
      document.querySelectorAll('.step').forEach(function (s) {
        s.addEventListener('pointermove', function (e) {
          var r = s.getBoundingClientRect();
          s.style.setProperty('--x', e.clientX - r.left + 'px');
          s.style.setProperty('--y', e.clientY - r.top + 'px');
        });
      });
    }

    // App tour: the sticky phone shows the screen for the chapter in view.
    var chapters = document.querySelectorAll('.chapter');
    var shots = document.querySelectorAll('#tour-shot img');
    if (chapters.length && 'IntersectionObserver' in window) {
      var tour = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var step = en.target.getAttribute('data-step');
          chapters.forEach(function (c) { c.classList.toggle('active', c === en.target); });
          shots.forEach(function (img) { img.classList.toggle('on', img.getAttribute('data-step') === step); });
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      chapters.forEach(function (c) { tour.observe(c); });
      // Load every tour screen early so switching never shows a blank phone.
      shots.forEach(function (img) { img.loading = 'eager'; });
    }
  });
})();
