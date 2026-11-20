(function () {
  var root = document.documentElement;
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');
  var label = btn && btn.querySelector('.burger__label');
  var toggle = document.getElementById('motion-toggle');
  var behind = [];

  function setMotion(value, persist) {
    root.dataset.motion = value;
    if (persist) { try { localStorage.setItem('mi-motion', value); } catch (e) {} }
    if (toggle) {
      var reduced = value === 'reduced';
      toggle.setAttribute('aria-pressed', String(reduced));
      toggle.textContent = reduced ? (toggle.dataset.off || 'Animations : réduites') : (toggle.dataset.on || 'Animations : activées');
    }
  }

  if (toggle) {
    setMotion(root.dataset.motion || 'full', false);
    toggle.addEventListener('click', function () {
      setMotion(root.dataset.motion === 'reduced' ? 'full' : 'reduced', true);
    });
  }

  if (!btn || !menu) return;

  function focusables() {
    return [].slice.call(document.querySelectorAll('.hdr a[href], .hdr button')).concat([].slice.call(menu.querySelectorAll('a[href], button')));
  }

  function open() {
    menu.classList.add('is-open');
    menu.removeAttribute('inert');
    root.classList.add('menu-open');
    btn.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = btn.dataset.closeLabel || 'Fermer';
    behind = [].slice.call(document.querySelectorAll('main, footer, .skip'));
    behind.forEach(function (el) { el.setAttribute('inert', ''); });
    var first = menu.querySelector('a[href]');
    if (first) first.focus();
  }

  function close(returnFocus) {
    menu.classList.remove('is-open');
    menu.setAttribute('inert', '');
    root.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = btn.dataset.openLabel || 'Menu';
    behind.forEach(function (el) { el.removeAttribute('inert'); });
    behind = [];
    if (returnFocus) btn.focus();
  }

  btn.addEventListener('click', function () {
    if (btn.getAttribute('aria-expanded') === 'true') close(true); else open();
  });

  document.addEventListener('keydown', function (e) {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key !== 'Tab') return;
    var items = focusables();
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  menu.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && !url.hash) { e.preventDefault(); close(true); }
  });
})();
