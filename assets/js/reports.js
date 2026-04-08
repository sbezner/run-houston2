/* reports.html — race reports listing */
(function () {
  'use strict';

  var DATA_URL = 'data/race_reports.json';
  var PREVIEW_LEN = 200;

  function makePreview(md) {
    if (!md) return '';
    // Strip headings, bold/italic markers, and collapse whitespace
    // for a clean preview snippet.
    var stripped = md
      .replace(/^#+\s.*$/gm, '')
      .replace(/[*_`>]/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped.length <= PREVIEW_LEN) return stripped;
    return stripped.slice(0, PREVIEW_LEN).replace(/\s+\S*$/, '') + '\u2026';
  }

  function renderReportCard(report) {
    var preview = makePreview(report.content_md);
    var raceLine = [report.race_name, RH.formatDate(report.race_date)]
      .filter(Boolean)
      .join(' &middot; ');

    return (
      '<article class="race-card">' +
      '<h2><a href="report.html?id=' + encodeURIComponent(report.id) + '">' +
      RH.escapeHtml(report.title) + '</a></h2>' +
      '<div class="race-meta">' +
      '<span><strong>' + raceLine + '</strong></span>' +
      '</div>' +
      '<p class="race-description">' + RH.escapeHtml(preview) + '</p>' +
      '<div class="race-card-footer">' +
      '<a href="report.html?id=' + encodeURIComponent(report.id) + '">Read more &rarr;</a>' +
      '</div>' +
      '</article>'
    );
  }

  function init() {
    var listEl = document.getElementById('report-list');
    var countEl = document.getElementById('result-count');

    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        var rows = alasql(
          'SELECT * FROM ? ORDER BY race_date DESC',
          [data]
        );
        countEl.textContent =
          rows.length + ' report' + (rows.length === 1 ? '' : 's');
        if (rows.length === 0) {
          listEl.innerHTML = '<p class="empty">No reports yet.</p>';
          return;
        }
        listEl.innerHTML = rows.map(renderReportCard).join('');
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML =
          '<p class="error">Could not load reports. ' +
          RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
