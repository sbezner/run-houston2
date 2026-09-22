/* news.html — local running news cards */
(function () {
  'use strict';

  var DATA_URL = 'data/news.json';

  function renderNewsCard(item) {
    // Only show date if it exists (some items don't have verifiable publication dates)
    var dateHtml = item.date ? 
      '<span class="news-card__date">' + RH.formatDate(item.date) + '</span>' : '';
    var separator = (item.date && item.source) ? ' &middot; ' : '';
    
    return (
      '<article class="news-card">' +
      '<div class="news-card__meta">' +
      (item.source ? '<span class="news-card__source">' + RH.escapeHtml(item.source) + '</span>' : '') +
      separator +
      dateHtml +
      '</div>' +
      '<h2 class="news-card__title">' + RH.escapeHtml(item.headline) + '</h2>' +
      '<p class="news-card__summary">' + RH.escapeHtml(item.summary) + '</p>' +
      '<a href="' + RH.escapeAttr(item.url) + '" class="news-card__link" target="_blank" rel="noopener noreferrer">' +
      'Read on ' + RH.escapeHtml(item.source.split('/')[0]) + ' &rarr;' +
      '</a>' +
      '</article>'
    );
  }

  function init() {
    var listEl = document.getElementById('news-list');

    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!data || !Array.isArray(data.items)) {
          throw new Error('Expected ' + DATA_URL + ' to contain an items array');
        }

        var items = data.items;

        if (items.length === 0) {
          listEl.innerHTML = '<p class="empty">No news yet.</p>';
          return;
        }

        // Sort by date (newest first), then items without dates by headline
        items.sort(function (a, b) {
          // Items with dates come first, sorted newest to oldest
          if (a.date && b.date) {
            return b.date.localeCompare(a.date);
          }
          // Items with dates come before items without
          if (a.date && !b.date) return -1;
          if (!a.date && b.date) return 1;
          // Items without dates sort alphabetically by headline
          return (a.headline || '').localeCompare(b.headline || '');
        });

        listEl.innerHTML = items.map(renderNewsCard).join('');
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML =
          '<p class="error">Could not load news. ' +
          RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
