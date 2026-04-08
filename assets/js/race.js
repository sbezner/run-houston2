/* race.html — single race detail (?id=...) */
(function () {
  'use strict';

  var UPCOMING_URL = 'data/races-upcoming.json';

  // Resolve a race id against the rolling upcoming file first, and fall
  // back to the per-year archive (data/races-YYYY.json) based on the year
  // suffix in the id (e.g. "bayou-city-classic-10k-2026" -> races-2026.json).
  // This keeps race.html?id=... URLs alive after a race has happened and
  // fallen out of the upcoming window.
  function findRaceById(id) {
    return RH.loadJson(UPCOMING_URL).then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('Expected ' + UPCOMING_URL + ' to be a JSON array');
      }
      var race = data.find(function (r) { return r.id === id; });
      if (race) return race;

      var match = /-(\d{4})$/.exec(id);
      if (!match) return null;
      var archiveUrl = 'data/races-' + match[1] + '.json';

      return RH.loadJson(archiveUrl)
        .then(function (archive) {
          if (!Array.isArray(archive)) return null;
          return archive.find(function (r) { return r.id === id; }) || null;
        })
        .catch(function () {
          // Missing archive file (e.g. no races-2025.json yet) just means
          // this id can't be resolved — treat it as "not found".
          return null;
        });
    });
  }

  function renderAddressBlock(race) {
    var parts = [];
    if (race.address) parts.push(race.address);
    var cityLine = [race.city, race.state].filter(Boolean).join(', ');
    if (cityLine) parts.push(cityLine + (race.zip ? ' ' + race.zip : ''));
    if (!parts.length) return '';

    return (
      '<dt>Location</dt>' +
      '<dd>' + parts.map(RH.escapeHtml).join('<br>') + '</dd>'
    );
  }

  function renderRace(race) {
    document.title = race.name + ' — Run Houston';

    var distances = (race.distance || [])
      .map(function (d) {
        return '<span class="badge distance">' + RH.escapeHtml(d) + '</span>';
      })
      .join('');

    var surfaceBadge = race.surface
      ? '<span class="badge surface-' + RH.escapeAttr(race.surface) + '">' +
        RH.escapeHtml(race.surface) + '</span>'
      : '';

    var kidBadge = race.kid_run
      ? '<span class="badge kid-run">Kid run</span>'
      : '';

    var date = RH.formatDateLong(race.date);
    var time = RH.formatTime(race.start_time);

    var websiteButton = race.official_website_url
      ? '<p class="race-website-cta">' +
        '<a href="' + RH.escapeAttr(race.official_website_url) +
        '" target="_blank" rel="noopener noreferrer" class="btn-primary">' +
        'Visit official website &rarr;</a>' +
        '</p>'
      : '';

    var description = race.description
      ? '<p class="race-description-full">' + RH.escapeHtml(race.description) + '</p>'
      : '';

    return (
      '<header class="race-detail-header">' +
      '<h1>' + RH.escapeHtml(race.name) + '</h1>' +
      '<p class="race-detail-subtitle">' +
      '<strong>' + RH.escapeHtml(date) + '</strong>' +
      (time ? ' &middot; ' + RH.escapeHtml(time) : '') +
      '</p>' +
      '<div class="race-badges">' + distances + surfaceBadge + kidBadge + '</div>' +
      '</header>' +
      description +
      '<dl class="race-detail-grid">' +
      renderAddressBlock(race) +
      (race.distance && race.distance.length
        ? '<dt>Distances</dt><dd>' +
          race.distance.map(RH.escapeHtml).join(', ') +
          '</dd>'
        : '') +
      (race.surface
        ? '<dt>Surface</dt><dd>' + RH.escapeHtml(race.surface) + '</dd>'
        : '') +
      '<dt>Kid-friendly</dt><dd>' + (race.kid_run ? 'Yes' : 'No') + '</dd>' +
      (race.source_url
        ? '<dt>Source</dt><dd><a href="' + RH.escapeAttr(race.source_url) +
          '" target="_blank" rel="noopener noreferrer">' +
          RH.escapeHtml(RH.prettyHost(race.source_url)) + '</a></dd>'
        : '') +
      '</dl>' +
      websiteButton
    );
  }

  function init() {
    var articleEl = document.getElementById('race-article');
    var id = RH.getQueryParam('id');

    if (!id) {
      articleEl.innerHTML =
        '<p class="error">No race id specified. <a href="index.html">Browse upcoming races</a>.</p>';
      return;
    }

    findRaceById(id)
      .then(function (race) {
        if (!race) {
          articleEl.innerHTML =
            '<p class="error">Race not found: <code>' + RH.escapeHtml(id) +
            '</code>. <a href="index.html">Browse upcoming races</a>.</p>';
          return;
        }
        articleEl.innerHTML = renderRace(race);
      })
      .catch(function (err) {
        console.error(err);
        articleEl.innerHTML =
          '<p class="error">Could not load race. ' + RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
