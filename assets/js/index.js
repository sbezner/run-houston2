/* index.html — upcoming races page */
(function () {
  'use strict';

  var DATA_URL = 'data/races-upcoming.json';

  // Canonical display order; anything not listed is appended alphabetically.
  var DISTANCE_ORDER = [
    '1 Mile',
    '5K',
    '6K',
    '10K',
    '12K',
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
    search: '',
    window: 'all',
    view: 'list' // 'list' | 'map'
  };

  // Leaflet map objects are created lazily the first time the user switches
  // to the map view, so list-only visitors don't pay for tile loading / DOM.
  var map = null;
  var markerLayer = null;
  // Rough bounding box around the Houston metro — used as the initial map
  // view and as a fallback when no filtered race has coordinates.
  var HOUSTON_BOUNDS = [[29.35, -95.90], [30.20, -94.90]];

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

    // "This week" badge for races within the next 7 days
    var thisWeekBadge = '';
    if (race.date) {
      var today = new Date(RH.isoToday());
      var raceDate = new Date(race.date);
      var daysAway = Math.round((raceDate - today) / 86400000);
      if (daysAway >= 0 && daysAway <= 7) {
        var label = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : 'This week';
        thisWeekBadge = '<span class="badge this-week">' + label + '</span>';
      }
    }

    var locationParts = [race.city, race.state].filter(Boolean);
    var location = locationParts.join(', ');

    var time = RH.formatTime(race.start_time);
    var dateLine = RH.formatDate(race.date) + (time ? ' &middot; ' + time : '');

    var nameHtml =
      '<a href="race.html?id=' + encodeURIComponent(race.id) + '">' +
      RH.escapeHtml(race.name) + '</a>';

    var description = race.description
      ? '<p class="race-description">' + RH.escapeHtml(race.description) + '</p>'
      : '';

    var footer = race.official_website_url
      ? '<div class="race-card-footer"><a href="' +
        RH.escapeAttr(RH.safeUrl(race.official_website_url)) +
        '" target="_blank" rel="noopener noreferrer">Race website &rarr;</a></div>'
      : '';

    return (
      '<article class="race-card">' +
      '<h2>' + nameHtml + '</h2>' +
      '<div class="race-meta">' +
      '<span><strong>' + dateLine + '</strong></span>' +
      (location ? '<span>' + RH.escapeHtml(location) + '</span>' : '') +
      '</div>' +
      '<div class="race-badges">' + thisWeekBadge + distances + surfaceBadge + kidBadge + '</div>' +
      description +
      footer +
      '</article>'
    );
  }

  // Split the search query into whitespace-separated tokens and require
  // EVERY token to match somewhere across name/city/description. Without
  // this, "5k katy" was matched as a single literal substring (which
  // appears in zero races). Tokenizing makes multi-word queries behave
  // the way users expect — "5k katy" returns 5Ks in Katy, not nothing.
  function matchesSearch(race, tokens) {
    if (tokens.length === 0) return true;
    var haystack = (
      (race.name || '') + ' ' +
      (race.city || '') + ' ' +
      (race.description || '')
    ).toLowerCase();
    for (var i = 0; i < tokens.length; i++) {
      if (haystack.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

  function filterRaces() {
    var today = RH.isoToday();
    var cutoff =
      state.window === 'all' ? '9999-12-31' : RH.isoPlusDays(parseInt(state.window, 10));

    var rows = alasql(
      'SELECT * FROM ? ' +
        'WHERE date >= ? AND date <= ? ' +
        'AND HASANY(distance, ?) ' +
        'ORDER BY date ASC',
      [allRaces, today, cutoff, state.distances]
    );

    var tokens = (state.search || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(function (t) { return t.length > 0; });

    return rows.filter(function (race) { return matchesSearch(race, tokens); });
  }

  function renderList(rows) {
    var listEl = document.getElementById('race-list');
    if (rows.length === 0) {
      listEl.innerHTML =
        '<p class="empty">No races match. Try clearing the search box, widening the date window, or clearing a distance chip.</p>';
      return;
    }
    listEl.innerHTML = rows.map(renderRaceCard).join('');
  }

  // ---------- Map rendering ----------

  function hasCoords(race) {
    return typeof race.latitude === 'number' && typeof race.longitude === 'number';
  }

  function renderPopup(race) {
    var distances = (race.distance || [])
      .map(function (d) { return RH.escapeHtml(d); })
      .join(', ');
    var nameHtml =
      '<a href="race.html?id=' + encodeURIComponent(race.id) + '">' +
      RH.escapeHtml(race.name) + '</a>';
    var dateLine = RH.formatDate(race.date);
    var location = [race.city, race.state].filter(Boolean).join(', ');

    return (
      '<div class="rh-popup">' +
      '<strong>' + nameHtml + '</strong><br>' +
      RH.escapeHtml(dateLine) +
      (location ? '<br><span class="muted">' + RH.escapeHtml(location) + '</span>' : '') +
      (distances ? '<br>' + distances : '') +
      '</div>'
    );
  }

  function ensureMap() {
    if (map) return;
    map = L.map('race-map', {
      scrollWheelZoom: false // avoid trapping page scroll on mobile
    }).fitBounds(HOUSTON_BOUNDS);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
  }

  function renderMap(rows) {
    if (typeof L === 'undefined') {
      document.getElementById('map-note').textContent =
        'Map library failed to load. Check your connection and refresh the page.';
      return;
    }
    ensureMap();
    markerLayer.clearLayers();

    var geo = rows.filter(hasCoords);
    var latLngs = geo.map(function (race) {
      var marker = L.marker([race.latitude, race.longitude]);
      marker.bindPopup(renderPopup(race));
      marker.addTo(markerLayer);
      return [race.latitude, race.longitude];
    });

    if (latLngs.length > 0) {
      map.fitBounds(latLngs, { padding: [32, 32], maxZoom: 12 });
    } else {
      map.fitBounds(HOUSTON_BOUNDS);
    }

    // Leaflet can't compute its own size while the container is display:none.
    // Switching views flips the wrapper's `hidden` attribute, so kick the map
    // once on the next tick to make sure tiles lay out correctly.
    setTimeout(function () { map.invalidateSize(); }, 0);

    var noteEl = document.getElementById('map-note');
    var missing = rows.length - geo.length;
    if (rows.length === 0) {
      noteEl.textContent =
        'No races match. Try clearing the search box, widening the date window, or clearing a distance chip.';
    } else if (missing > 0) {
      noteEl.textContent =
        missing + ' race' + (missing === 1 ? ' is' : 's are') +
        ' not shown because they have no coordinates.';
    } else {
      noteEl.textContent = '';
    }
  }

  function render() {
    var countEl = document.getElementById('result-count');
    var listEl = document.getElementById('race-list');

    var rows;
    try {
      rows = filterRaces();
    } catch (err) {
      console.error('AlaSQL query failed:', err);
      listEl.innerHTML = '<p class="error">Sorry, something went wrong filtering the races.</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent =
      rows.length + ' race' + (rows.length === 1 ? '' : 's') + ' found';

    if (state.view === 'map') {
      renderMap(rows);
    } else {
      renderList(rows);
    }
  }

  function setView(view) {
    if (view !== 'list' && view !== 'map') return;
    state.view = view;

    var listWrap = document.getElementById('race-list');
    var mapWrap = document.getElementById('race-map-wrap');
    var listBtn = document.getElementById('view-list-btn');
    var mapBtn = document.getElementById('view-map-btn');

    if (view === 'map') {
      listWrap.hidden = true;
      mapWrap.hidden = false;
      listBtn.classList.remove('is-active');
      mapBtn.classList.add('is-active');
      listBtn.setAttribute('aria-pressed', 'false');
      mapBtn.setAttribute('aria-pressed', 'true');
    } else {
      listWrap.hidden = false;
      mapWrap.hidden = true;
      listBtn.classList.add('is-active');
      mapBtn.classList.remove('is-active');
      listBtn.setAttribute('aria-pressed', 'true');
      mapBtn.setAttribute('aria-pressed', 'false');
    }

    render();
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

    var searchEl = document.getElementById('race-search');
    var debounce;
    searchEl.addEventListener('input', function (e) {
      clearTimeout(debounce);
      var val = e.target.value;
      debounce = setTimeout(function () {
        state.search = val;
        render();
      }, 150);
    });

    document
      .getElementById('date-window')
      .addEventListener('change', function (e) {
        state.window = e.target.value;
        render();
      });

    document
      .getElementById('view-list-btn')
      .addEventListener('click', function () { setView('list'); });
    document
      .getElementById('view-map-btn')
      .addEventListener('click', function () { setView('map'); });
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
