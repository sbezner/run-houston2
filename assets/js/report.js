/* report.html — single race report detail (?id=...) */
(function () {
  'use strict';

  var DATA_URL = 'data/race_reports.json';

  function renderReport(report) {
    document.title = report.title + ' — Run Houston';

    var raceLine = [report.race_name, RH.formatDateLong(report.race_date)]
      .filter(Boolean)
      .join(' &middot; ');
    var byline = report.author_name
      ? '<p class="report-byline">By <strong>' + RH.escapeHtml(report.author_name) + '</strong></p>'
      : '';

    // marked v12 is HTML-safe by default for the input fields we use here.
    // Content is curated, not user-submitted, but we still avoid raw HTML by
    // forcing the parser into pure Markdown mode.
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
      byline +
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
        '<p class="error">No report id specified. <a href="reports.html">Browse all reports</a>.</p>';
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
            '<p class="error">Report not found: <code>' + RH.escapeHtml(id) +
            '</code>. <a href="reports.html">Browse all reports</a>.</p>';
          return;
        }
        articleEl.innerHTML = renderReport(report);
      })
      .catch(function (err) {
        console.error(err);
        articleEl.innerHTML =
          '<p class="error">Could not load report. ' +
          RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
