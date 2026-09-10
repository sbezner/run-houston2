/* news.html — local running news cards */
(function () {
  'use strict';

  var DATA_URL = 'data/news.json';

  function renderNewsCard(item) {
    return (
      '<article class="news-card">' +
      '<div class="news-card__meta">' +
      '<span class="news-card__source">' + RH.escapeHtml(item.source) + '</span>' +
      '<span class="news-card__date">' + RH.formatDate(item.date) + '</span>' +
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
