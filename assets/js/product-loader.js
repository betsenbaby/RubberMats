/**
 * RubberMats.ch — Product Loader
 * Fetches products.json, renders cards into #product-grid.
 * Uses CSS flexbox layout (no Isotope dependency) with JS-based filtering.
 */
(function () {
  'use strict';

  var LANG = document.documentElement.getAttribute('lang') || 'fr';
  var PRODUCT_PAGE = { fr: 'produits', de: 'produkte', en: 'products' };

  var STRINGS = {
    fr: { variants: 'variante(s) disponible(s)', details: 'Voir les détails', noProducts: 'Aucun produit trouvé.', priceCta: 'Prix sur demande' },
    de: { variants: 'Variante(n) verfügbar', details: 'Details ansehen', noProducts: 'Keine Produkte gefunden.', priceCta: 'Preis auf Anfrage' },
    en: { variants: 'variant(s) available', details: 'View details', noProducts: 'No products found.', priceCta: 'Price on request' }
  };

  var t = STRINGS[LANG] || STRINGS.en;

  function renderCard(cat) {
    var name = (cat.name && cat.name[LANG]) || cat.name.en || cat.id;
    var useCase = cat.use_case || 'other';
    var variants = cat.variants || cat.products || [];
    var variantCount = variants.length;
    var codes = variants.slice(0, 3).map(function (v) { return v.code; });
    var codesHtml = codes.length > 0
      ? '<span class="product-codes-list">' + codes.join(' &middot; ') + (variantCount > 3 ? ' &hellip;' : '') + '</span>'
      : '';

    return (
      '<div class="grid-item col-12 col-sm-6 col-lg-4 margin-30px-bottom ' + useCase + '" data-use-case="' + useCase + '">' +
        '<div class="product-card bg-white border-radius-6px overflow-hidden box-shadow-small box-shadow-large-hover" style="height:100%;">' +
          '<div class="product-img-wrap position-relative overflow-hidden">' +
            '<img src="/assets/images/products/' + cat.id + '/main.jpg" ' +
                 'onerror="this.onerror=null;this.src=\'/assets/images/products/placeholder.jpg\';" ' +
                 'alt="' + name + '" loading="lazy" class="w-100" style="height:240px;object-fit:cover;">' +
            '<span class="product-badge alt-font text-uppercase letter-spacing-1px bg-dark-orange text-white position-absolute top-15px left-15px padding-5px-tb padding-10px-lr border-radius-3px text-extra-small font-weight-600">' + useCase + '</span>' +
          '</div>' +
          '<div class="product-info padding-25px-all">' +
            '<h3 class="product-name alt-font font-weight-600 text-extra-dark-gray text-medium margin-10px-bottom">' + name + '</h3>' +
            '<p class="product-variants text-medium-gray text-small margin-5px-bottom">' + variantCount + ' ' + t.variants + '</p>' +
            '<p class="card-price-cta">' + t.priceCta + '</p>' +
            '<div class="product-codes text-extra-small text-medium-gray margin-10px-bottom">' + codesHtml + '</div>' +
            '<a href="/' + LANG + '/' + PRODUCT_PAGE[LANG] + '/' + cat.id + '.html" class="btn btn-very-small btn-dark-gray btn-round-edge">' +
              t.details + ' <i class="feather icon-feather-arrow-right text-extra-small margin-5px-left"></i>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindFilters() {
    var buttons = document.querySelectorAll('.btn-filter');
    var items = document.querySelectorAll('#product-grid .grid-item');

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        e.preventDefault();
        // Update active state
        for (var j = 0; j < buttons.length; j++) buttons[j].classList.remove('active');
        this.classList.add('active');

        var filter = this.getAttribute('data-filter');
        for (var k = 0; k < items.length; k++) {
          var item = items[k];
          if (filter === '*') {
            item.style.display = '';
          } else {
            var useCase = item.getAttribute('data-use-case');
            item.style.display = (useCase === filter) ? '' : 'none';
          }
        }
      });
    }
  }

  function loadProducts() {
    var container = document.getElementById('product-grid');
    if (!container) return;

    fetch('/data/products.json')
      .then(function (res) {
        if (!res.ok) return fetch('../data/products.json');
        return res;
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var categories = data.categories || [];
        if (categories.length === 0) {
          container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-medium-gray">' + t.noProducts + '</p></div>';
          return;
        }

        var html = '';
        for (var i = 0; i < categories.length; i++) {
          html += renderCard(categories[i]);
        }
        container.innerHTML = html;
        bindFilters();
      })
      .catch(function (err) {
        console.warn('product-loader: failed to load products.json', err);
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-medium-gray">' + t.noProducts + '</p></div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
  } else {
    loadProducts();
  }
})();
