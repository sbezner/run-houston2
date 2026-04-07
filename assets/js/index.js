/* index.html — upcoming races page */
(function () {
  'use strict';

  var DATA_URL = 'data/races-upcoming.json';

  var SURFACES = [
    { value: 'road', label: 'Road' },
    { value: 'trail', label: 'Trail' },
    { value: 'track', label: 'Track' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'other', label: 'Other' }
  ];

  // Canonical display order; anything not listed is appended alphabetically.
  var DISTANCE_ORDER = [
    '1 Mile',
    '5K',
    '10K',
    '15K',
    '10 Mile',
    'Half Marathon',
    'Marathon',
    '50K',
    '50 Mile',
    '100K',
    '100 Mile',
    'Ultra',
    'Kids'
  ];

  var allRaces = [];
  var state = {
    distances: [],
    surfaces: [],
    window: '90'
  };

  // ---------- Rendering ----------

  function renderChips(containerId, options, group) {
    var el = document.getElementById(containerId);
    var html = options
      .map(function (opt) {
        var value = typeof opt === 'string' ? opt : opt.value;
        var label = typeof opt === 'string' ? opt : opt.label;
        var id = group + '-' + value.toLowerCase().replace(/\s+/g, '-');
        return (
          '<span class="chip">' +
          '<input type="checkbox" id="' + RH.escapeAttr(id) + '" ' +
          'name="' + RH.escapeAttr(group) + '" value="' + RH.escapeAttr(value) + '">' +
          '<label for="' + RH.escapeAttr(id) + '">' + RH.escapeHtml(label) + '</label>' +
          '</span>'
        );
      })
      .join('');
    el.innerHTML = html;
  }

  function buildDistanceOptions(races) {
    var seen = {};
    races.forEach(function (r) {
      (r.distance || []).forEach(function (d) { seen[d] = true; });
    });
    var ordered = [];
    DISTANCE_ORDER.forEach(function (d) {
      if (seen[d]) {
        ordered.push(d);
        delete seen[d];
      }
    });
    Object.keys(seen).sort().forEach(function (d) { ordered.push(d); });
    return ordered;
  }

  function renderRaceCard(race) {
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

    var locationParts = [race.city, race.state].filter(Boolean);
    var location = locationParts.join(', ');

    var time = RH.formatTime(race.start_time);
    var dateLine = RH.formatDate(race.date) + (time ? ' &middot; ' + time : '');

    var nameHtml = race.official_website_url
      ? '<a href="' + RH.escapeAttr(race.official_website_url) + '" ' +
        'target="_blank" rel="noopener noreferrer">' +
        RH.escapeHtml(race.name) + '</a>'
      : RH.escapeHtml(race.name);

    var description = race.description
      ? '<p class="race-description">' + RH.escapeHtml(race.description) + '</p>'
      : '';

    var footer = race.official_website_url
      ? '<div class="race-card-footer"><a href="' +
        RH.escapeAttr(race.official_website_url) +
        '" target="_blank" rel="noopener noreferrer">Race website &rarr;</a></div>'
      : '';

    return (
      '<article class="race-card">' +
      '<h2>' + nameHtml + '</h2>' +
      '<div class="race-meta">' +
      '<span><strong>' + dateLine + '</strong></span>' +
      (location ? '<span>' + RH.escapeHtml(location) + '</span>' : '') +
      '</div>' +
      '<div class="race-badges">' + distances + surfaceBadge + kidBadge + '</div>' +
      description +
      footer +
      '</article>'
    );
  }

  function render() {
    var listEl = document.getElementById('race-list');
    var countEl = document.getElementById('result-count');

    var today = RH.isoToday();
    var cutoff =
      state.window === 'all' ? '9999-12-31' : RH.isoPlusDays(parseInt(state.window, 10));

    var rows;
    try {
      rows = alasql(
        'SELECT * FROM ? ' +
          'WHERE date >= ? AND date <= ? ' +
          'AND HASANY(distance, ?) ' +
          'AND INSET(surface, ?) ' +
          'ORDER BY date ASC',
        [allRaces, today, cutoff, state.distances, state.surfaces]
      );
    } catch (err) {
      console.error('AlaSQL query failed:', err);
      listEl.innerHTML = '<p class="error">Sorry, something went wrong filtering the races.</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent =
      rows.length + ' race' + (rows.length === 1 ? '' : 's') + ' found';

    if (rows.length === 0) {
      listEl.innerHTML =
        '<p class="empty">No races match these filters. Try widening the date window or clearing a chip.</p>';
      return;
    }

    listEl.innerHTML = rows.map(renderRaceCard).join('');
  }

  // ---------- Wiring ----------

  function readChipState(group) {
    var picks = [];
    document
      .querySelectorAll('input[type="checkbox"][name="' + group + '"]')
      .forEach(function (input) {
        if (input.checked) picks.push(input.value);
      });
    return picks;
  }

  function attachFilterHandlers() {
    document
      .getElementById('distance-chips')
      .addEventListener('change', function () {
        state.distances = readChipState('distance');
        render();
      });

    document
      .getElementById('surface-chips')
      .addEventListener('change', function () {
        state.surfaces = readChipState('surface');
        render();
      });

    document
      .getElementById('date-window')
      .addEventListener('change', function (e) {
        state.window = e.target.value;
        render();
      });
  }

  function init() {
    var listEl = document.getElementById('race-list');
    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        allRaces = data;
        renderChips('distance-chips', buildDistanceOptions(allRaces), 'distance');
        renderChips('surface-chips', SURFACES, 'surface');
        attachFilterHandlers();
        render();
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML =
          '<p class="error">Could not load races. ' +
          RH.escapeHtml(err.message) +
          '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
