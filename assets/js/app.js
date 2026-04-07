/* Run Houston — upcoming races page
 *
 * Loads data/races-upcoming.json, queries it with AlaSQL based on the
 * current filter state, and renders race cards. No build step, no framework.
 */
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

  // Canonical display order for distance chips. Anything not listed
  // here is appended in alphabetical order.
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

  // ---------- AlaSQL helpers ----------

  // Returns true if `arr` shares at least one element with `picks`,
  // OR `picks` is empty (i.e. no filter selected).
  alasql.fn.HASANY = function (arr, picks) {
    if (!picks || picks.length === 0) return true;
    if (!arr || arr.length === 0) return false;
    for (var i = 0; i < arr.length; i++) {
      if (picks.indexOf(arr[i]) !== -1) return true;
    }
    return false;
  };

  // Returns true if `val` is in `picks`, OR `picks` is empty.
  alasql.fn.INSET = function (val, picks) {
    if (!picks || picks.length === 0) return true;
    return picks.indexOf(val) !== -1;
  };

  // ---------- Date helpers ----------

  function isoToday() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function isoPlusDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function formatDate(iso) {
    // Parse as local date so we don't shift across timezones.
    var parts = iso.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(t) {
    if (!t) return '';
    var parts = t.split(':').map(Number);
    var h = parts[0];
    var m = parts[1];
    var period = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + period;
  }

  // ---------- Rendering ----------

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderChips(containerId, options, group) {
    var el = document.getElementById(containerId);
    var html = options
      .map(function (opt) {
        var value = typeof opt === 'string' ? opt : opt.value;
        var label = typeof opt === 'string' ? opt : opt.label;
        var id = group + '-' + value.toLowerCase().replace(/\s+/g, '-');
        return (
          '<span class="chip">' +
          '<input type="checkbox" id="' + escapeHtml(id) + '" ' +
          'name="' + escapeHtml(group) + '" value="' + escapeHtml(value) + '">' +
          '<label for="' + escapeHtml(id) + '">' + escapeHtml(label) + '</label>' +
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
    var found = Object.keys(seen);
    var ordered = [];
    DISTANCE_ORDER.forEach(function (d) {
      if (seen[d]) {
        ordered.push(d);
        delete seen[d];
      }
    });
    Object.keys(seen).sort().forEach(function (d) { ordered.push(d); });
    return ordered.length ? ordered : found.sort();
  }

  function renderRaceCard(race) {
    var distances = (race.distance || [])
      .map(function (d) {
        return '<span class="badge distance">' + escapeHtml(d) + '</span>';
      })
      .join('');

    var surfaceBadge = race.surface
      ? '<span class="badge surface-' + escapeHtml(race.surface) + '">' +
        escapeHtml(race.surface) + '</span>'
      : '';

    var kidBadge = race.kid_run
      ? '<span class="badge kid-run">Kid run</span>'
      : '';

    var locationParts = [race.city, race.state].filter(Boolean);
    var location = locationParts.join(', ');

    var time = formatTime(race.start_time);
    var dateLine = formatDate(race.date) + (time ? ' &middot; ' + time : '');

    var nameHtml = race.official_website_url
      ? '<a href="' + escapeHtml(race.official_website_url) + '" ' +
        'target="_blank" rel="noopener noreferrer">' +
        escapeHtml(race.name) + '</a>'
      : escapeHtml(race.name);

    var description = race.description
      ? '<p class="race-description">' + escapeHtml(race.description) + '</p>'
      : '';

    var footer = race.official_website_url
      ? '<div class="race-card-footer"><a href="' +
        escapeHtml(race.official_website_url) +
        '" target="_blank" rel="noopener noreferrer">Race website &rarr;</a></div>'
      : '';

    return (
      '<article class="race-card">' +
      '<h2>' + nameHtml + '</h2>' +
      '<div class="race-meta">' +
      '<span><strong>' + dateLine + '</strong></span>' +
      (location ? '<span>' + escapeHtml(location) + '</span>' : '') +
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

    var today = isoToday();
    var cutoff =
      state.window === 'all' ? '9999-12-31' : isoPlusDays(parseInt(state.window, 10));

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
      listEl.innerHTML =
        '<p class="error">Sorry, something went wrong filtering the races.</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent =
      rows.length +
      ' race' +
      (rows.length === 1 ? '' : 's') +
      ' found';

    if (rows.length === 0) {
      listEl.innerHTML =
        '<p class="empty">No races match these filters. Try widening the date window or clearing a chip.</p>';
      return;
    }

    listEl.innerHTML = rows.map(renderRaceCard).join('');
  }

  // ---------- Wiring ----------

  function readChipState(group) {
    var inputs = document.querySelectorAll(
      'input[type="checkbox"][name="' + group + '"]'
    );
    var picks = [];
    inputs.forEach(function (input) {
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

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' loading ' + DATA_URL);
        }
        return res.json();
      })
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
          escapeHtml(err.message) +
          '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
