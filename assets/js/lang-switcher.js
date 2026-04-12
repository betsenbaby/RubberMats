/**
 * RubberMats.ch — Language Switcher
 * Handles browser detection, localStorage persistence, and cross-page navigation.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rm_lang';
  var SUPPORTED = ['fr', 'de', 'en'];
  var DEFAULT_LANG = 'fr';

  // Canonical route mappings (scales better than manual per-page maps)
  var SECTION_ALIASES = {
    products: 'products',
    produits: 'products',
    produkte: 'products'
  };

  var SECTION_BY_LANG = {
    products: { fr: 'produits', de: 'produkte', en: 'products' }
  };

  var FILE_ALIASES = {
    'index.html': 'index.html',
    '404.html': '404.html',
    'products.html': 'products.html',
    'produits.html': 'products.html',
    'produkte.html': 'products.html',
    'about.html': 'about.html',
    'a-propos.html': 'about.html',
    'ueber-uns.html': 'about.html',
    'contact.html': 'contact.html',
    'kontakt.html': 'contact.html'
  };

  var FILE_BY_LANG = {
    'index.html': { fr: 'index.html', de: 'index.html', en: 'index.html' },
    '404.html': { fr: '404.html', de: '404.html', en: '404.html' },
    'products.html': { fr: 'produits.html', de: 'produkte.html', en: 'products.html' },
    'about.html': { fr: 'a-propos.html', de: 'ueber-uns.html', en: 'about.html' },
    'contact.html': { fr: 'contact.html', de: 'kontakt.html', en: 'contact.html' }
  };

  function detectCurrentLang() {
    var segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0 && SUPPORTED.indexOf(segments[0]) !== -1) return segments[0];
    return null;
  }

  function getPreferredLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var browserLang = (navigator.language || navigator.userLanguage || '').substring(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(browserLang) !== -1) return browserLang;

    return DEFAULT_LANG;
  }

  function mapSectionForLang(rawSection, targetLang) {
    if (!rawSection) return null;
    var canonical = SECTION_ALIASES[rawSection] || rawSection;
    var mapped = SECTION_BY_LANG[canonical];
    return mapped ? mapped[targetLang] : rawSection;
  }

  function mapFileForLang(rawFile, targetLang) {
    var canonical = FILE_ALIASES[rawFile] || rawFile;
    var mapped = FILE_BY_LANG[canonical];
    return mapped ? mapped[targetLang] : rawFile;
  }

  function buildLangUrl(targetLang) {
    var currentLang = detectCurrentLang();
    var segments = window.location.pathname.split('/').filter(Boolean);

    if (currentLang) segments.shift();

    if (segments.length === 0) {
      return '/' + targetLang + '/index.html' + window.location.search + window.location.hash;
    }

    var filenameIndex = segments.length - 1;
    var rawFile = segments[filenameIndex] || 'index.html';
    var mappedFile = mapFileForLang(rawFile, targetLang);

    if (segments.length > 1) {
      segments[0] = mapSectionForLang(segments[0], targetLang);
    }
    segments[filenameIndex] = mappedFile;

    return '/' + targetLang + '/' + segments.join('/') + window.location.search + window.location.hash;
  }

  function switchLang(targetLang) {
    if (SUPPORTED.indexOf(targetLang) === -1) return;
    localStorage.setItem(STORAGE_KEY, targetLang);
    window.location.href = buildLangUrl(targetLang);
  }

  function updateHtmlLang() {
    var lang = detectCurrentLang() || getPreferredLang();
    document.documentElement.setAttribute('lang', lang);
  }

  function highlightActiveLang() {
    var current = detectCurrentLang() || getPreferredLang();
    var buttons = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.getAttribute('data-lang') === current) {
        btn.classList.add('active');
        btn.style.color = '#ffffff';
        btn.style.backgroundColor = '#2D6A3F';
        btn.style.padding = '4px 10px';
        btn.style.borderRadius = '3px';
        btn.style.opacity = '1';
      } else {
        btn.classList.remove('active');
        btn.style.color = '#ffffff';
        btn.style.backgroundColor = 'transparent';
        btn.style.opacity = '0.7';
      }
    }
  }

  function bindSwitcherButtons() {
    var buttons = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        e.preventDefault();
        switchLang(this.getAttribute('data-lang'));
      });
    }
  }

  function init() {
    updateHtmlLang();
    bindSwitcherButtons();
    highlightActiveLang();

    var current = detectCurrentLang();
    if (current) localStorage.setItem(STORAGE_KEY, current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RMlang = {
    switchLang: switchLang,
    getCurrentLang: detectCurrentLang,
    getPreferredLang: getPreferredLang
  };
})();
