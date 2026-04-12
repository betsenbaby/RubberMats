/**
 * RubberMats.ch — Language Switcher
 * Handles browser detection, localStorage persistence, and cross-page navigation.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rm_lang';
  var SUPPORTED = ['fr', 'de', 'en'];
  var DEFAULT_LANG = 'fr';

  // Page mapping: { fr: filename, de: filename, en: filename }
  var PAGE_MAP = [
    { fr: 'index.html',    de: 'index.html',    en: 'index.html' },
    { fr: 'produits.html',  de: 'produkte.html',  en: 'products.html' },
    { fr: 'a-propos.html',  de: 'ueber-uns.html', en: 'about.html' },
    { fr: 'contact.html',   de: 'kontakt.html',   en: 'contact.html' }
  ];

  /**
   * Detect current language from the URL path (first segment after /).
   */
  function detectCurrentLang() {
    var segments = window.location.pathname.split('/').filter(Boolean);
    for (var i = 0; i < segments.length; i++) {
      if (SUPPORTED.indexOf(segments[i]) !== -1) {
        return segments[i];
      }
    }
    return null;
  }

  /**
   * Get the preferred language: stored > browser > default.
   */
  function getPreferredLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var browserLang = (navigator.language || navigator.userLanguage || '').substring(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(browserLang) !== -1) return browserLang;

    return DEFAULT_LANG;
  }

  /**
   * Find the current page's filename in the page map.
   */
  function getCurrentPageFile() {
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    return filename;
  }

  /**
   * Given a current page filename and the current language, find the equivalent page in the target language.
   */
  function getEquivalentPage(currentFile, fromLang, toLang) {
    for (var i = 0; i < PAGE_MAP.length; i++) {
      if (PAGE_MAP[i][fromLang] === currentFile) {
        return PAGE_MAP[i][toLang];
      }
    }
    // Fallback to index if no match found
    return 'index.html';
  }

  /**
   * Build the URL for a target language, preserving the current page context.
   */
  function buildLangUrl(targetLang) {
    var currentLang = detectCurrentLang();
    var currentFile = getCurrentPageFile();
    var targetFile = currentLang
      ? getEquivalentPage(currentFile, currentLang, targetLang)
      : 'index.html';

    // Build path relative to site root
    var basePath = window.location.pathname.split('/').slice(0, -1);
    // Replace language segment or build fresh
    var newPath = '/' + targetLang + '/' + targetFile;

    return newPath;
  }

  /**
   * Switch to a new language.
   */
  function switchLang(targetLang) {
    if (SUPPORTED.indexOf(targetLang) === -1) return;
    localStorage.setItem(STORAGE_KEY, targetLang);
    var url = buildLangUrl(targetLang);
    window.location.href = url;
  }

  /**
   * Update <html lang=""> attribute to match current language.
   */
  function updateHtmlLang() {
    var lang = detectCurrentLang() || getPreferredLang();
    document.documentElement.setAttribute('lang', lang);
  }

  /**
   * Highlight the active language in the switcher UI.
   */
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

  /**
   * Bind click handlers to language switcher buttons.
   * Expects elements with data-lang="fr|de|en" attribute.
   */
  function bindSwitcherButtons() {
    var buttons = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        e.preventDefault();
        var lang = this.getAttribute('data-lang');
        switchLang(lang);
      });
    }
  }

  /**
   * Initialize on DOM ready.
   */
  function init() {
    updateHtmlLang();
    bindSwitcherButtons();
    highlightActiveLang();

    // Store current language preference
    var current = detectCurrentLang();
    if (current) {
      localStorage.setItem(STORAGE_KEY, current);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for programmatic use
  window.RMlang = {
    switchLang: switchLang,
    getCurrentLang: detectCurrentLang,
    getPreferredLang: getPreferredLang
  };
})();
