/**
 * RubberMats.ch — Cookie Consent Banner (Swiss nDSG compliant)
 * Zero dependencies. Reads <html lang=""> for translations.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rm_cookies';
  var stored = localStorage.getItem(STORAGE_KEY);

  // If already decided, respect choice and optionally load analytics
  if (stored === 'accepted') { loadAnalytics(); return; }
  if (stored === 'refused') return;

  var LANG = document.documentElement.getAttribute('lang') || 'fr';

  var STRINGS = {
    fr: {
      text: 'Nous utilisons des cookies analytiques pour améliorer votre expérience.',
      policy: 'Politique de confidentialité',
      accept: 'Accepter',
      refuse: 'Refuser'
    },
    de: {
      text: 'Wir verwenden analytische Cookies, um Ihre Erfahrung zu verbessern.',
      policy: 'Datenschutzrichtlinie',
      accept: 'Akzeptieren',
      refuse: 'Ablehnen'
    },
    en: {
      text: 'We use analytical cookies to improve your experience.',
      policy: 'Privacy policy',
      accept: 'Accept',
      refuse: 'Decline'
    }
  };

  var t = STRINGS[LANG] || STRINGS.fr;

  function createBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
      'background:#1a1a1a;color:#fff;padding:16px 24px;' +
      'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;' +
      'font-family:inherit;font-size:14px;line-height:1.5;' +
      'box-shadow:0 -4px 20px rgba(0,0,0,0.3);transition:opacity 0.4s ease,transform 0.4s ease;';

    banner.innerHTML =
      '<span style="flex:1 1 300px;">' + t.text + '</span>' +
      '<div style="display:flex;gap:8px;flex-shrink:0;">' +
        '<button id="cookie-accept" style="background:#2D6A3F;color:#fff;border:none;padding:8px 20px;border-radius:4px;font-weight:600;font-size:13px;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">' + t.accept + '</button>' +
        '<button id="cookie-refuse" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);padding:8px 20px;border-radius:4px;font-weight:600;font-size:13px;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">' + t.refuse + '</button>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      dismiss(banner);
      loadAnalytics();
    });

    document.getElementById('cookie-refuse').addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEY, 'refused');
      dismiss(banner);
    });
  }

  function dismiss(banner) {
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(100%)';
    setTimeout(function () { banner.remove(); }, 400);
  }

  function loadAnalytics() {
    var GA_ID = 'G-136LRTKTFB';
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  // Expose for Google Maps consent check
  window.RMcookies = {
    isAccepted: function () { return localStorage.getItem(STORAGE_KEY) === 'accepted'; },
    onAccept: function (cb) {
      if (localStorage.getItem(STORAGE_KEY) === 'accepted') { cb(); return; }
      // Poll briefly for the consent
      var interval = setInterval(function () {
        if (localStorage.getItem(STORAGE_KEY) === 'accepted') { clearInterval(interval); cb(); }
      }, 500);
      setTimeout(function () { clearInterval(interval); }, 30000);
    }
  };

  // Show banner on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBanner);
  } else {
    createBanner();
  }
})();
