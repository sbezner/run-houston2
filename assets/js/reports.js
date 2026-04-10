/* reports.html — race reports listing with search */
(function () {
  'use strict';

  var DATA_URL = 'data/race_reports.json';
  var PREVIEW_LEN = 200;

  var allReports = [];
  var state = { search: '' };

  function makePreview(md) {
    if (!md) return '';
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
    var raceLine = [
      report.race_name ? RH.escapeHtml(report.race_name) : '',
      RH.formatDate(report.race_date)
    ].filter(Boolean).join(' &middot; ');

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

  function matchesSearch(report, tokens) {
    if (tokens.length === 0) return true;
    var haystack = (
      (report.title || '') + ' ' +
      (report.race_name || '') + ' ' +
      (report.content_md || '')
    ).toLowerCase();
    for (var i = 0; i < tokens.length; i++) {
      if (haystack.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

  function render() {
    var listEl = document.getElementById('report-list');
    var countEl = document.getElementById('result-count');

    var tokens = (state.search || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(function (t) { return t.length > 0; });

    var rows = allReports.filter(function (r) {
      return matchesSearch(r, tokens);
    });

    // Sort newest first
    rows.sort(function (a, b) {
      return (b.race_date || '').localeCompare(a.race_date || '');
    });

    countEl.textContent =
      rows.length + ' recap' + (rows.length === 1 ? '' : 's') +
      (tokens.length ? ' found' : '');

    if (rows.length === 0) {
      listEl.innerHTML = tokens.length
        ? '<p class="empty">No recaps match. Try a different search term.</p>'
        : '<p class="empty">No recaps yet.</p>';
      return;
    }
    listEl.innerHTML = rows.map(renderReportCard).join('');
  }

  function init() {
    var listEl = document.getElementById('report-list');

    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        allReports = data;

        // Wire up search
        var searchEl = document.getElementById('recap-search');
        var debounce;
        searchEl.addEventListener('input', function (e) {
          clearTimeout(debounce);
          var val = e.target.value;
          debounce = setTimeout(function () {
            state.search = val;
            render();
          }, 150);
        });

        render();
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML =
          '<p class="error">Could not load recaps. ' +
          RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
