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

  var SURFACE_ORDER = ['road', 'trail', 'track', 'other'];

  var allRaces = [];
  var state = {
    distances: [],
    surfaces: [],
    search: '',
    window: 'all',
    view: 'cards' // 'cards' | 'list' | 'map'
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

  function buildSurfaceOptions(races) {
    var seen = {};
    races.forEach(function (r) {
      if (r.surface) seen[r.surface] = true;
    });
    var ordered = [];
    SURFACE_ORDER.forEach(function (s) {
      if (seen[s]) {
        ordered.push({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) });
        delete seen[s];
      }
    });
    Object.keys(seen).sort().forEach(function (s) {
      ordered.push({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) });
    });
    return ordered;
  }

  function renderDateChips() {
    var options = [
      { value: '30', label: '30 days' },
      { value: '60', label: '60 days' },
      { value: '90', label: '90 days' },
      { value: 'all', label: 'All' }
    ];
    var el = document.getElementById('date-chips');
    el.innerHTML = options.map(function (opt) {
      var id = 'date-' + opt.value;
      var checked = opt.value === 'all' ? ' checked' : '';
      return (
        '<span class="chip">' +
        '<input type="radio" id="' + id + '" name="date" value="' +
        RH.escapeAttr(opt.value) + '"' + checked + '>' +
        '<label for="' + id + '">' + RH.escapeHtml(opt.label) + '</label>' +
        '</span>'
      );
    }).join('');
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
        '" target="_blank" rel="noopener noreferrer" class="btn-register">Register &rarr;</a></div>'
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
        'AND INSET(surface, ?) ' +
        'ORDER BY date ASC',
      [allRaces, today, cutoff, state.distances, state.surfaces]
    );

    var tokens = (state.search || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(function (t) { return t.length > 0; });

    return rows.filter(function (race) { return matchesSearch(race, tokens); });
  }

  function renderCards(rows) {
    var el = document.getElementById('race-cards');
    if (rows.length === 0) {
      el.innerHTML =
        '<p class="empty">Hmm, nothing matches. Try widening your filters or clearing the search.</p>';
      return;
    }
    el.innerHTML = rows.map(renderRaceCard).join('');
  }

  function renderTable(rows) {
    var el = document.getElementById('race-list');
    if (rows.length === 0) {
      el.innerHTML =
        '<p class="empty">Hmm, nothing matches. Try widening your filters or clearing the search.</p>';
      return;
    }
    var html =
      '<table class="race-table">' +
      '<thead><tr>' +
      '<th>Date</th>' +
      '<th>Race</th>' +
      '<th class="col-city">City</th>' +
      '<th>Distances</th>' +
      '<th class="col-surface">Surface</th>' +
      '</tr></thead><tbody>';
    rows.forEach(function (race) {
      var dists = (race.distance || []).map(function (d) {
        return '<span class="badge distance">' + RH.escapeHtml(d) + '</span>';
      }).join(' ');
      var surfaceBadge = race.surface
        ? '<span class="badge surface-' + RH.escapeAttr(race.surface) + '">' +
          RH.escapeHtml(race.surface) + '</span>'
        : '';
      html +=
        '<tr>' +
        '<td>' + RH.escapeHtml(RH.formatDate(race.date)) + '</td>' +
        '<td><a href="race.html?id=' + encodeURIComponent(race.id) + '">' +
        RH.escapeHtml(race.name) + '</a></td>' +
        '<td class="col-city">' + RH.escapeHtml(race.city || '') + '</td>' +
        '<td class="badges-cell">' + dists + '</td>' +
        '<td class="col-surface">' + surfaceBadge + '</td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
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
        'Hmm, nothing matches. Try widening your filters or clearing the search.';
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
    var cardsEl = document.getElementById('race-cards');

    var rows;
    try {
      rows = filterRaces();
    } catch (err) {
      console.error('AlaSQL query failed:', err);
      cardsEl.innerHTML = '<p class="error">Sorry, something went wrong filtering the races.</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent =
      rows.length + ' race' + (rows.length === 1 ? '' : 's') + ' near Houston';

    if (state.view === 'map') {
      renderMap(rows);
    } else if (state.view === 'list') {
      renderTable(rows);
    } else {
      renderCards(rows);
    }
  }

  function setView(view) {
    if (view !== 'cards' && view !== 'list' && view !== 'map') return;
    state.view = view;

    var cardsWrap = document.getElementById('race-cards');
    var listWrap = document.getElementById('race-list');
    var mapWrap = document.getElementById('race-map-wrap');
    var cardsBtn = document.getElementById('view-cards-btn');
    var listBtn = document.getElementById('view-list-btn');
    var mapBtn = document.getElementById('view-map-btn');

    cardsWrap.hidden = view !== 'cards';
    listWrap.hidden = view !== 'list';
    mapWrap.hidden = view !== 'map';

    [cardsBtn, listBtn, mapBtn].forEach(function (btn) {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    });

    var activeBtn = view === 'cards' ? cardsBtn : view === 'list' ? listBtn : mapBtn;
    activeBtn.classList.add('is-active');
    activeBtn.setAttribute('aria-pressed', 'true');

    render();
  }

  // ---------- Geolocation ("Near me") ----------

  var userMarker = null;

  function handleNearMe() {
    var btn = document.getElementById('near-me-btn');
    if (!navigator.geolocation) {
      btn.textContent = 'Not supported';
      btn.disabled = true;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Locating\u2026';

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;

        btn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>' +
          'Near me';
        btn.disabled = false;
        btn.classList.add('is-active');

        ensureMap();

        // Add / move user marker
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          var icon = L.divIcon({
            className: 'user-location-icon',
            html: '<div style="width:14px;height:14px;background:#d93636;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 })
            .bindPopup('<div class="rh-popup"><strong>You are here</strong></div>')
            .addTo(map);
        }

        // Zoom to show user + nearby races
        map.setView([lat, lng], 11);
      },
      function () {
        btn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>' +
          'Near me';
        btn.disabled = false;
        document.getElementById('map-note').textContent =
          'Could not get your location. Check your browser permissions.';
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
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
      .getElementById('date-chips')
      .addEventListener('change', function () {
        var checked = document.querySelector('input[name="date"]:checked');
        state.window = checked ? checked.value : 'all';
        render();
      });

    document
      .getElementById('view-cards-btn')
      .addEventListener('click', function () { setView('cards'); });
    document
      .getElementById('view-list-btn')
      .addEventListener('click', function () { setView('list'); });
    document
      .getElementById('view-map-btn')
      .addEventListener('click', function () { setView('map'); });

    document
      .getElementById('near-me-btn')
      .addEventListener('click', handleNearMe);
  }

  function init() {
    var cardsEl = document.getElementById('race-cards');
    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        allRaces = data;
        // Populate hero stat if present
        var heroStat = document.getElementById('hero-stat');
        if (heroStat && data.length) {
          heroStat.textContent = data.length + ' races \u00B7 Apr 2026 \u2013 Jan 2027';
        }
        renderChips('distance-chips', buildDistanceOptions(allRaces), 'distance');
        renderChips('surface-chips', buildSurfaceOptions(allRaces), 'surface');
        renderDateChips();
        attachFilterHandlers();
        render();
      })
      .catch(function (err) {
        console.error(err);
        cardsEl.innerHTML =
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
