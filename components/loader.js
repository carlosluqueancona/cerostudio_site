(function () {
  var navEl = document.getElementById('navbar-placeholder');
  var ftEl = document.getElementById('footer-placeholder');
  if (!navEl && !ftEl) return;

  Promise.all([
    navEl ? fetch('/components/navbar.html').then(function (r) { return r.text(); }) : Promise.resolve(''),
    ftEl ? fetch('/components/footer.html').then(function (r) { return r.text(); }) : Promise.resolve('')
  ]).then(function (parts) {
    function inject(placeholder, html) {
      if (!placeholder || !html) return;
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      var nodes = Array.from(tmp.childNodes);
      nodes.forEach(function (n) { placeholder.parentNode.insertBefore(n, placeholder); });
      placeholder.parentNode.removeChild(placeholder);
    }

    inject(navEl, parts[0]);
    inject(ftEl, parts[1]);

    /* On the homepage, convert /# links to # so navigation is in-page */
    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHome) {
      document.querySelectorAll('#navbar a[href^="/#"], #mobileNav a[href^="/#"]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').slice(1));
      });
    }

    document.dispatchEvent(new CustomEvent('csComponentsReady'));
  }).catch(function (err) {
    console.warn('Component loader failed:', err);
  });
})();
