/* report.html — single race report detail (?id=...) */
(function () {
  'use strict';

  var DATA_URL = 'data/race_reports.json';

  function renderReport(report) {
    document.title = report.title + ' — Run Houston';

    // Escape each component before joining so that a future race_name
    // containing HTML can't inject into innerHTML below.
    var raceLine = [
      report.race_name ? RH.escapeHtml(report.race_name) : '',
      RH.formatDateLong(report.race_date)
    ].filter(Boolean).join(' &middot; ');

    // Trust model: marked v12 does NOT sanitize embedded HTML by default.
    // We rely on data/race_reports.json being curated (hand-committed to
    // the repo, not user-submitted). If that ever changes, add a
    // sanitizer like DOMPurify around this call.
    var bodyHtml;
    try {
      bodyHtml = marked.parse(report.content_md || '', { gfm: true, breaks: true });
    } catch (err) {
      console.error('marked failed:', err);
      bodyHtml = '<pre>' + RH.escapeHtml(report.content_md || '') + '</pre>';
    }

    var photos = '';
    if (Array.isArray(report.photos) && report.photos.length) {
      photos =
        '<div class="report-photos">' +
        report.photos
          .map(function (src) {
            return '<img src="' + RH.escapeAttr(src) + '" alt="" loading="lazy">';
          })
          .join('') +
        '</div>';
    }

    return (
      '<header class="report-header">' +
      '<h1>' + RH.escapeHtml(report.title) + '</h1>' +
      '<p class="report-race"><strong>' + raceLine + '</strong></p>' +
      '</header>' +
      '<div class="report-body">' + bodyHtml + '</div>' +
      photos
    );
  }

  function init() {
    var articleEl = document.getElementById('report-article');
    var id = RH.getQueryParam('id');

    if (!id) {
      articleEl.innerHTML =
        '<p class="error">No recap id specified. <a href="reports.html">Browse all recaps</a>.</p>';
      return;
    }

    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        var report = data.find(function (r) { return r.id === id; });
        if (!report) {
          articleEl.innerHTML =
            '<p class="error">Recap not found: <code>' + RH.escapeHtml(id) +
            '</code>. <a href="reports.html">Browse all recaps</a>.</p>';
          return;
        }
        articleEl.innerHTML = renderReport(report);
      })
      .catch(function (err) {
        console.error(err);
        articleEl.innerHTML =
          '<p class="error">Could not load recap. ' +
          RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
