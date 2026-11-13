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
      var dark = '/shots/' + img.getAttribute('data-shot') + '.webp?v=' + root.getAttribute('data-shots');
      // Only some screens have a light capture; the rest keep the dark one.
      img.onerror = theme === 'light' ? function () { img.onerror = null; img.src = dark; } : null;
      img.src = theme === 'light' ? dark.replace('/shots/', '/shots/light/') : dark;
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

    // Account deletion: an emailed code proves ownership, then the account is deleted.
    document.querySelectorAll('.delete-form').forEach(function (form) {
      var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:18080' : 'https://api.sahamity.com';
      var step = 'email';
      var email = '';
      var error = form.querySelector('.form-error');
      function say(id, en) {
        error.textContent = root.getAttribute('data-lang') === 'id' ? id : en;
        error.hidden = false;
      }
      function show(next) {
        step = next;
        form.querySelectorAll('[data-step]').forEach(function (s) { s.hidden = s.getAttribute('data-step') !== next; });
      }
      function post(path, body) {
        return fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        error.hidden = true;
        var button = form.querySelector('[data-step="' + step + '"] button');
        button.disabled = true;
        var done = function () { button.disabled = false; };
        var offline = function () { say('Tidak dapat terhubung. Coba lagi.', 'Could not connect. Please try again.'); };
        if (step === 'email') {
          email = form.querySelector('input[type="email"]').value.trim();
          post('/v1/auth/delete/request', { email: email, language: root.getAttribute('data-lang') === 'id' ? 'id' : 'en' }).then(function (r) {
            if (r.ok) show('code');
            else if (r.status === 429) say('Terlalu banyak percobaan. Coba lagi nanti.', 'Too many attempts. Please try again later.');
            else say('Masukkan alamat email yang valid.', 'Enter a valid email address.');
          }).catch(offline).then(done);
        } else {
          post('/v1/auth/delete/confirm', { email: email, code: form.querySelector('input[inputmode="numeric"]').value.trim() }).then(function (r) {
            if (r.ok) show('done');
            else if (r.status === 429) say('Terlalu banyak percobaan. Coba lagi nanti.', 'Too many attempts. Please try again later.');
            else say('Kode salah atau kedaluwarsa. Akun Anda belum dihapus.', 'That code is wrong or has expired. Your account has not been deleted.');
          }).catch(offline).then(done);
        }
      });
    });

    // Each phone's status strip takes the colour of its screenshot's top row, as the app's own header would,
    // so no band of a different colour sits between the strip and the screen.
    function topColour(img) {
      try {
        var cv = document.createElement('canvas');
        cv.width = 8; cv.height = 1;
        var cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, img.naturalWidth, 3, 0, 0, 8, 1);
        var d = cx.getImageData(0, 0, 8, 1).data, r = 0, g = 0, b = 0;
        for (var i = 0; i < 32; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        r = Math.round(r / 8); g = Math.round(g / 8); b = Math.round(b / 8);
        return { bg: 'rgb(' + r + ',' + g + ',' + b + ')', fg: 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#000' : '#fff' };
      } catch (e) { return null; }
    }
    function paintScreen(screen) {
      var lang = root.getAttribute('data-lang');
      var imgs = Array.prototype.filter.call(screen.querySelectorAll('.shot img'), function (i) { return i.getAttribute('lang') === lang; });
      var img = imgs.filter(function (i) { return i.classList.contains('on'); })[0] || imgs[0];
      if (!img || !img.complete || !img.naturalWidth) return;
      var c = topColour(img);
      if (!c) return;
      screen.style.setProperty('--bar', c.bg);
      screen.style.setProperty('--bar-fg', c.fg);
    }
    window.sahamityPaint = function () { document.querySelectorAll('.device .screen').forEach(paintScreen); };
    document.querySelectorAll('.device .shot img').forEach(function (img) {
      img.addEventListener('load', function () { paintScreen(img.closest('.screen')); });
    });
    document.querySelectorAll('[data-set-lang],[data-pick-lang]').forEach(function (b) { b.addEventListener('click', window.sahamityPaint); });
    window.sahamityPaint();

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
        window.sahamityPaint();
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

    // Section jumper: next / previous buttons, a dot per section on wide screens, and J / K on the keyboard.
    var jump = document.querySelector('[data-jump]');
    var parts = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    if (jump && parts.length > 1) {
      var dots = jump.querySelector('.jump-dots');
      var prevBtn = jump.querySelector('[data-jump-prev]');
      var nextBtn = jump.querySelector('[data-jump-next]');
      var en = function () { return root.getAttribute('data-lang') !== 'id'; };
      var nameOf = function (s) { return s.getAttribute(en() ? 'data-name-en' : 'data-name-id') || s.id; };
      var links = parts.map(function (s) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + s.id;
        a.innerHTML = '<span></span>';
        li.appendChild(a);
        dots.appendChild(li);
        return a;
      });
      var label = function () {
        links.forEach(function (a, i) { a.firstChild.textContent = nameOf(parts[i]); a.setAttribute('aria-label', nameOf(parts[i])); });
        prevBtn.setAttribute('aria-label', en() ? 'Previous section' : 'Bagian sebelumnya');
      };
      // The section under a line a third of the way down the screen is the current one.
      var current = function () {
        var line = innerHeight / 3, at = 0;
        parts.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) at = i; });
        return at;
      };
      var go = function (i) { parts[Math.max(0, Math.min(parts.length - 1, i))].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); };
      var sync = function () {
        var i = current();
        links.forEach(function (a, j) { a.setAttribute('aria-current', j === i ? 'true' : 'false'); });
        var last = i >= parts.length - 1;
        prevBtn.disabled = i === 0;
        nextBtn.classList.toggle('top', last);
        nextBtn.setAttribute('aria-label', last ? (en() ? 'Back to top' : 'Kembali ke atas') : en() ? 'Next section' : 'Bagian berikutnya');
      };
      prevBtn.addEventListener('click', function () { go(current() - 1); });
      nextBtn.addEventListener('click', function () { var i = current(); go(i >= parts.length - 1 ? 0 : i + 1); });
      addEventListener('keydown', function (e) {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (document.querySelector('#langpick:not([hidden])')) return;
        if (e.key === 'j' || e.key === 'J') { e.preventDefault(); go(current() + 1); }
        else if (e.key === 'k' || e.key === 'K') { e.preventDefault(); go(current() - 1); }
      });
      document.querySelectorAll('[data-set-lang],[data-pick-lang]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(function () { label(); sync(); }, 0); }); });
      addEventListener('scroll', sync, { passive: true });
      addEventListener('resize', sync);
      label();
      sync();
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
          window.sahamityPaint();
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      chapters.forEach(function (c) { tour.observe(c); });
      // Load every tour screen early so switching never shows a blank phone.
      shots.forEach(function (img) { img.loading = 'eager'; });
    }
  });
})();
