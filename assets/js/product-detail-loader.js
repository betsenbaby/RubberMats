/**
 * RubberMats.ch — Product Detail Loader
 * Reads data-product-id from <body>, fetches products.json,
 * populates the detail page DOM targets.
 */
(function () {
  'use strict';

  var LANG = document.documentElement.getAttribute('lang') || 'fr';
  var PRODUCT_ID = document.body.getAttribute('data-product-id');
  if (!PRODUCT_ID) return;

  var SECTION = { fr: 'produits', de: 'produkte', en: 'products' };
  var CONTACT = { fr: 'contact', de: 'kontakt', en: 'contact' };

  var T = {
    fr: {
      home: 'Accueil', products: 'Produits', quote: 'Demander un devis',
      variants: 'Variantes disponibles', related: 'Produits similaires',
      code: 'Code', dims: 'Dimensions', desc: 'Description', quoteCol: 'Devis',
      reqBtn: 'Demander \u2192', view: 'Voir',
      noVariants: 'Contactez-nous pour les variantes disponibles.',
      priceHead: 'Prix sur demande',
      priceSub: 'Contactez-nous pour un devis personnalis\u00e9, remises volume et tarifs CHF.',
      priceCta: 'Demander un devis',
      patterns: 'Motifs'
    },
    de: {
      home: 'Startseite', products: 'Produkte', quote: 'Angebot anfordern',
      variants: 'Verf\u00fcgbare Varianten', related: '\u00c4hnliche Produkte',
      code: 'Code', dims: 'Abmessungen', desc: 'Beschreibung', quoteCol: 'Anfrage',
      reqBtn: 'Anfragen \u2192', view: 'Ansehen',
      noVariants: 'Kontaktieren Sie uns f\u00fcr verf\u00fcgbare Varianten.',
      priceHead: 'Preis auf Anfrage',
      priceSub: 'Kontaktieren Sie uns f\u00fcr ein individuelles Angebot, Mengenrabatte und CHF-Preise.',
      priceCta: 'Angebot anfordern',
      patterns: 'Muster'
    },
    en: {
      home: 'Home', products: 'Products', quote: 'Request a quote',
      variants: 'Available variants', related: 'Related products',
      code: 'Code', dims: 'Dimensions', desc: 'Description', quoteCol: 'Quote',
      reqBtn: 'Request \u2192', view: 'View',
      noVariants: 'Contact us for available variants.',
      priceHead: 'Price on request',
      priceSub: 'Contact us for a personalised quote, volume discounts and CHF pricing.',
      priceCta: 'Request a quote',
      patterns: 'Patterns'
    }
  };

  var t = T[LANG] || T.en;
  var sec = SECTION[LANG];
  var con = CONTACT[LANG];

  function el(id) { return document.getElementById(id); }

  /* ── Gallery ─────────────────────────────────────────── */
  function renderGallery(id) {
    var g = el('product-gallery');
    if (!g) return;
    var imgs = ['main.jpg', 'detail-1.jpg', 'detail-2.jpg'];
    var h = '';
    for (var i = 0; i < imgs.length; i++) {
      h += '<img src="/assets/images/products/' + id + '/' + imgs[i] + '" ' +
           'onerror="this.onerror=null;this.src=\'/assets/images/products/placeholder.jpg\';" ' +
           'alt="" loading="lazy" style="width:100%;height:300px;object-fit:cover;border-radius:6px;margin-bottom:12px;">';
    }
    g.innerHTML = h;
  }

  /* ── Variant table (4 cols: Code | Dimensions | Description | Quote) ── */
  function renderVariants(cat) {
    var tbody = document.querySelector('#variant-table tbody');
    if (!tbody) return;
    var variants = cat.variants || cat.products || [];

    // Update thead
    var thead = document.querySelector('#variant-table thead tr');
    if (thead) {
      thead.innerHTML = '<th>' + t.code + '</th><th>' + t.dims + '</th><th>' + t.desc + '</th><th>' + t.quoteCol + '</th>';
    }

    if (variants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">' + t.noVariants + '</td></tr>';
      return;
    }

    var h = '';
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      h += '<tr>' +
        '<td><code class="product-code">' + (v.code || '') + '</code></td>' +
        '<td class="size-cell">' + (v.size || '\u2014') + '</td>' +
        '<td class="desc-cell">' + (v.description || '') + '</td>' +
        '<td><a href="/' + LANG + '/' + con + '.html?product=' + cat.id + '&code=' + encodeURIComponent(v.code || '') + '" class="btn-quote-sm">' + t.reqBtn + '</a></td>' +
        '</tr>';
    }
    tbody.innerHTML = h;

    // Pricing callout below table
    var table = document.getElementById('variant-table');
    if (table && table.parentNode) {
      var d = document.createElement('div');
      d.className = 'pricing-callout';
      d.innerHTML =
        '<div class="pricing-callout-icon">\u2709</div>' +
        '<div class="pricing-callout-text"><strong>' + t.priceHead + '</strong><span>' + t.priceSub + '</span></div>' +
        '<a href="/' + LANG + '/' + con + '.html?product=' + cat.id + '" class="btn-contact-price">' + t.priceCta + '</a>';
      table.parentNode.insertBefore(d, table.nextSibling);
    }
  }

  /* ── Related products ────────────────────────────────── */
  function renderRelated(all, current) {
    var box = el('related-products');
    if (!box) return;
    var rel = all.filter(function(c) { return c.use_case === current.use_case && c.id !== current.id; });
    if (rel.length < 3) {
      var others = all.filter(function(c) { return c.id !== current.id && rel.indexOf(c) === -1; });
      while (rel.length < 3 && others.length > 0) rel.push(others.shift());
    }
    rel = rel.slice(0, 3);

    var h = '';
    for (var i = 0; i < rel.length; i++) {
      var r = rel[i];
      var nm = (r.name && r.name[LANG]) || r.name.en || r.id;
      h += '<div class="col-12 col-sm-6 col-md-4 margin-20px-bottom">' +
        '<div style="background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">' +
          '<img src="/assets/images/products/' + r.id + '/main.jpg" onerror="this.onerror=null;this.src=\'/assets/images/products/placeholder.jpg\';" alt="' + nm + '" style="width:100%;height:160px;object-fit:cover;">' +
          '<div style="padding:16px;">' +
            '<h4 style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px;">' + nm + '</h4>' +
            '<a href="/' + LANG + '/' + sec + '/' + r.id + '.html" style="font-size:13px;color:#2D6A3F;font-weight:600;text-decoration:none;">' + t.view + ' \u2192</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    box.innerHTML = h;
  }

  /* ── Main loader ─────────────────────────────────────── */
  function load() {
    fetch('/data/products.json')
      .then(function(r) { if (!r.ok) return fetch('../../data/products.json'); return r; })
      .then(function(r) { if (!r.ok) return fetch('../../../data/products.json'); return r; })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var cats = data.categories || [];
        var cat = null;
        for (var i = 0; i < cats.length; i++) {
          if (cats[i].id === PRODUCT_ID) { cat = cats[i]; break; }
        }
        if (!cat) return;

        var name = (cat.name && cat.name[LANG]) || cat.name.en || cat.id;
        document.title = name + ' | rubbermats.ch';

        var titleEl = el('product-title');
        if (titleEl) titleEl.textContent = name;

        var descEl = el('product-description');
        if (descEl) {
          descEl.textContent = (cat.description && cat.description[LANG])
            ? cat.description[LANG]
            : name + ' \u2014 TJP Mats.';
        }

        var badgeEl = el('product-use-badge');
        if (badgeEl) badgeEl.textContent = cat.use_case || '';

        if (cat.top_patterns && cat.top_patterns.length) {
          var pEl = el('product-patterns');
          if (pEl) pEl.innerHTML = '<strong>' + t.patterns + ':</strong> ' + cat.top_patterns.join(', ');
        }

        // Breadcrumb
        var bc = el('breadcrumb');
        if (bc) {
          bc.innerHTML = '<ol class="breadcrumb" style="background:transparent;padding:0;margin-bottom:12px;">' +
            '<li class="breadcrumb-item"><a href="/' + LANG + '/" style="color:#aaa;font-size:13px;">' + t.home + '</a></li>' +
            '<li class="breadcrumb-item"><a href="/' + LANG + '/' + sec + '.html" style="color:#aaa;font-size:13px;">' + t.products + '</a></li>' +
            '<li class="breadcrumb-item active" style="color:#fff;font-size:13px;">' + name + '</li>' +
            '</ol>';
        }

        var vt = el('variant-title');
        if (vt) vt.textContent = t.variants;

        renderGallery(PRODUCT_ID);
        renderVariants(cat);
        renderRelated(cats, cat);
      })
      .catch(function(err) { console.warn('product-detail-loader:', err); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
