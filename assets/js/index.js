/* index.html — upcoming races page */
(function () {
  'use strict';

  var DATA_URL = 'data/races-upcoming.json';

  var DISTANCE_ORDER = [
    '1 Mile', '5K', '6K', '10K', '12K', '15K', '10 Mile',
    'Half Marathon', 'Marathon', '50K', '50 Mile', '100K', '100 Mile',
    'Ultra', 'Kids'
  ];

  var SURFACE_ORDER = ['road', 'trail', 'track', 'other'];

  var allRaces = [];
  var state = {
    distances: [],
    surfaces: [],
    search: '',
    window: '90',
    view: 'cards',     // 'cards' | 'list' | 'map' | 'cal'
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    userLat: null,
    userLng: null,
    sortByDistance: false
  };

  var MOBILE =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 720px)').matches;

  var map = null;
  var markerLayer = null;
  var HOUSTON_BOUNDS = [[29.35, -95.90], [30.20, -94.90]];

  // ---------- Distance helpers ----------

  function haversineMi(lat1, lng1, lat2, lng2) {
    var R = 3959;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function hasCoords(race) {
    return typeof race.latitude === 'number' && typeof race.longitude === 'number';
  }

  // ---------- URL state ----------

  function pushStateToUrl() {
    var params = new URLSearchParams();
    if (state.window !== '7') params.set('w', state.window);
    if (state.surfaces.length) params.set('s', state.surfaces.join(','));
    if (state.distances.length) params.set('d', state.distances.join(','));
    if (state.search) params.set('q', state.search);
    var qs = params.toString();
    history.replaceState(null, '', qs ? ('?' + qs) : window.location.pathname);
  }

  function readStateFromUrl() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('w')) {
      state.window = params.get('w');
      var radio = document.querySelector('input[name="date"][value="' + state.window + '"]');
      if (radio) radio.checked = true;
      var dLabel = document.getElementById('dd-date-label');
      var dBtn = document.getElementById('dd-date-btn');
      if (state.window === 'all') {
        dLabel.textContent = 'All dates';
        dBtn.classList.add('has-selection');
      } else if (state.window === '90') {
        dLabel.textContent = 'Next 90 days';
        dBtn.classList.remove('has-selection');
      } else {
        dLabel.textContent = 'Next ' + state.window + ' days';
        dBtn.classList.add('has-selection');
      }
    }
    if (params.has('s') && params.get('s')) {
      state.surfaces = params.get('s').split(',');
      state.surfaces.forEach(function (s) {
        var cb = document.querySelector('input[name="surface"][value="' + s + '"]');
        if (cb) cb.checked = true;
      });
      var sLabel = document.getElementById('dd-surface-label');
      var sBtn = document.getElementById('dd-surface-btn');
      sLabel.textContent = state.surfaces.map(function (s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
      }).join(', ');
      sBtn.classList.add('has-selection');
    }
    if (params.has('d') && params.get('d')) {
      state.distances = params.get('d').split(',');
      state.distances.forEach(function (d) {
        var cb = document.querySelector('input[name="distance"][value="' + d + '"]');
        if (cb) cb.checked = true;
      });
      var distLabel = document.getElementById('dd-distance-label');
      var distBtn = document.getElementById('dd-distance-btn');
      distLabel.textContent = state.distances.length <= 3
        ? state.distances.join(', ')
        : state.distances.length + ' selected';
      distBtn.classList.add('has-selection');
    }
    if (params.has('q') && params.get('q')) {
      state.search = params.get('q');
      var searchEl = document.getElementById('race-search');
      if (searchEl) searchEl.value = state.search;
    }
  }

  // ---------- Chip helpers ----------

  function renderChips(containerId, options, group) {
    var el = document.getElementById(containerId);
    var html = options.map(function (opt) {
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
    }).join('');
    el.innerHTML = html;
  }

  function buildDistanceOptions(races) {
    var seen = {};
    races.forEach(function (r) {
      (r.distance || []).forEach(function (d) { seen[d] = true; });
    });
    var ordered = [];
    DISTANCE_ORDER.forEach(function (d) {
      if (seen[d]) { ordered.push(d); delete seen[d]; }
    });
    Object.keys(seen).sort().forEach(function (d) { ordered.push(d); });
    return ordered;
  }

  function buildSurfaceOptions(races) {
    var seen = {};
    races.forEach(function (r) { if (r.surface) seen[r.surface] = true; });
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

  // ---------- Card rendering ----------

  function renderRaceCard(race) {
    var surfaceClass = race.surface ? ' race-card--' + race.surface : '';
    
    var date = new Date(race.date + 'T12:00:00');
    var day = date.getDate();
    var monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    var month = monthNames[date.getMonth()];

    var badges = (race.distance || []).map(function (dist) {
      return '<span class="badge distance">' + RH.escapeHtml(dist) + '</span>';
    }).join('');

    var kidBadge = race.kid_run
      ? '<span class="badge kid-run">Kids</span>'
      : '';

    var location = race.city ? RH.escapeHtml(race.city) : '';
    var timeStr = race.start_time ? ' &middot; ' + RH.escapeHtml(RH.formatTime(race.start_time)) : '';

    var registerBtn = race.official_website_url
      ? '<a href="' + RH.escapeAttr(RH.safeUrl(race.official_website_url)) +
        '" target="_blank" rel="noopener noreferrer" class="btn-register">Register</a>'
      : '';

    return (
      '<article class="race-card' + surfaceClass + '">' +
      '<div class="race-card__date-bib">' +
      '<div class="race-card__date-day">' + day + '</div>' +
      '<div class="race-card__date-mon">' + month + '</div>' +
      '</div>' +
      '<div class="race-card__main">' +
      '<h2 class="race-card__name"><a href="race.html?id=' + encodeURIComponent(race.id) + '">' +
      RH.escapeHtml(race.name) + '</a></h2>' +
      '<div class="race-card__meta">' + location + timeStr + '</div>' +
      '<div class="race-card__badges">' + badges + kidBadge + '</div>' +
      '</div>' +
      '<div class="race-card__actions">' + registerBtn + '</div>' +
      '</article>'
    );
  }

  // ---------- Search ----------

  function matchesSearch(race, tokens) {
    if (tokens.length === 0) return true;
    var haystack = (
      (race.name || '') + ' ' + (race.city || '') + ' ' + (race.description || '')
    ).toLowerCase();
    for (var i = 0; i < tokens.length; i++) {
      if (haystack.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

  // ---------- Filter ----------

  function filterRaces() {
    var today = RH.isoToday();
    var tokens = (state.search || '').toLowerCase().split(/\s+/).filter(function (t) {
      return t.length > 0;
    });
    var cutoff = state.window === 'all' ? '9999-12-31' : RH.isoPlusDays(parseInt(state.window, 10));
    var rows = alasql(
      'SELECT * FROM ? WHERE date >= ? AND date <= ? AND HASANY(distance, ?) AND INSET(surface, ?) ORDER BY date ASC',
      [allRaces, today, cutoff, state.distances, state.surfaces]
    );
    rows = rows.filter(function (r) { return matchesSearch(r, tokens); });

    if (state.sortByDistance && state.userLat !== null) {
      rows.sort(function (a, b) {
        var da = hasCoords(a) ? haversineMi(state.userLat, state.userLng, a.latitude, a.longitude) : Infinity;
        var db = hasCoords(b) ? haversineMi(state.userLat, state.userLng, b.latitude, b.longitude) : Infinity;
        return da - db;
      });
    }
    return rows;
  }

  // ---------- Empty state ----------

  function emptyStateHtml() {
    if (state.window === '7') {
      return '<p class="empty">No races in the next 7 days. ' +
        '<button type="button" class="link-btn" data-action="expand-window">' +
        'Try the next 30 days &rarr;</button></p>';
    }
    return '<p class="empty">Hmm, nothing matches. Try widening your filters or clearing the search.</p>';
  }

  function wireExpandWindow(container) {
    var btn = container.querySelector('[data-action="expand-window"]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      state.window = '30';
      var radio = document.querySelector('input[name="date"][value="30"]');
      if (radio) radio.checked = true;
      document.getElementById('dd-date-label').textContent = 'Next 30 days';
      document.getElementById('dd-date-btn').classList.add('has-selection');
      render();
    });
  }

  // ---------- Views: cards, table, calendar, map ----------

  function renderCards(rows) {
    var el = document.getElementById('race-cards');
    if (rows.length === 0) {
      el.innerHTML = emptyStateHtml();
      wireExpandWindow(el);
      return;
    }
    el.innerHTML = rows.map(renderRaceCard).join('');
  }

  function renderTable(rows) {
    var el = document.getElementById('race-list');
    if (rows.length === 0) {
      el.innerHTML = emptyStateHtml();
      wireExpandWindow(el);
      return;
    }
    var showDist = state.sortByDistance && state.userLat !== null;
    var html =
      '<table class="race-table"><thead><tr>' +
      '<th>Date</th><th>Race</th><th class="col-city">City</th>' +
      '<th>Distances</th><th class="col-surface">Surface</th>' +
      (showDist ? '<th>Away</th>' : '') +
      '</tr></thead><tbody>';
    rows.forEach(function (race) {
      var dists = (race.distance || []).map(function (d) {
        return '<span class="badge distance">' + RH.escapeHtml(d) + '</span>';
      }).join(' ');
      var surfaceBadge = race.surface
        ? '<span class="badge surface-' + RH.escapeAttr(race.surface) + '">' +
          RH.escapeHtml(race.surface) + '</span>'
        : '';
      var distCell = '';
      if (showDist) {
        distCell = hasCoords(race)
          ? '<td>' + haversineMi(state.userLat, state.userLng, race.latitude, race.longitude).toFixed(1) + ' mi</td>'
          : '<td class="muted">—</td>';
      }
      html +=
        '<tr>' +
        '<td>' + RH.escapeHtml(RH.formatDate(race.date)) + '</td>' +
        '<td><a href="race.html?id=' + encodeURIComponent(race.id) + '">' +
        RH.escapeHtml(race.name) + '</a></td>' +
        '<td class="col-city">' + RH.escapeHtml(race.city || '') + '</td>' +
        '<td class="badges-cell">' + dists + '</td>' +
        '<td class="col-surface">' + surfaceBadge + '</td>' +
        distCell +
        '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function renderCalendar(rows) {
    var el = document.getElementById('race-cal');
    var year = state.calYear;
    var month = state.calMonth;
    var today = RH.isoToday();

    // Group races by date
    var byDate = {};
    rows.forEach(function (r) {
      if (!r.date) return;
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });

    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var monthName = firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    var html = '<div class="cal-header">' +
      '<button type="button" class="cal-nav" id="cal-prev-btn" aria-label="Previous month">&#8592;</button>' +
      '<span class="cal-month-label">' + RH.escapeHtml(monthName) + '</span>' +
      '<button type="button" class="cal-nav" id="cal-next-btn" aria-label="Next month">&#8594;</button>' +
      '</div><div class="cal-grid">';

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d) {
      html += '<div class="cal-day-header">' + d + '</div>';
    });

    for (var i = 0; i < firstDay.getDay(); i++) {
      html += '<div class="cal-day cal-day--empty"></div>';
    }

    for (var day = 1; day <= lastDay.getDate(); day++) {
      var iso = year + '-' + pad2(month + 1) + '-' + pad2(day);
      var dayRaces = byDate[iso] || [];
      var cls = 'cal-day' +
        (iso === today ? ' cal-day--today' : '') +
        (dayRaces.length ? ' cal-day--has-races' : '');

      html += '<div class="' + cls + '" data-date="' + iso + '">' +
        '<span class="cal-day-num">' + day + '</span>';

      if (dayRaces.length) {
        html += '<div class="cal-dots">';
        dayRaces.slice(0, 4).forEach(function (r) {
          var dotCls = 'cal-dot' + (r.surface ? ' cal-dot--' + RH.escapeAttr(r.surface) : '');
          html += '<span class="' + dotCls + '" title="' + RH.escapeAttr(r.name) + '"></span>';
        });
        if (dayRaces.length > 4) {
          html += '<span class="cal-dot-count">+' + (dayRaces.length - 4) + '</span>';
        }
        html += '</div><div class="cal-race-list">';
        dayRaces.forEach(function (r) {
          html += '<a href="race.html?id=' + encodeURIComponent(r.id) +
            '" class="cal-race-item">' + RH.escapeHtml(r.name) + '</a>';
        });
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;

    // Month nav — re-render with same filtered rows (filters unchanged)
    document.getElementById('cal-prev-btn').addEventListener('click', function () {
      if (state.calMonth === 0) { state.calYear--; state.calMonth = 11; }
      else { state.calMonth--; }
      renderCalendar(rows);
    });
    document.getElementById('cal-next-btn').addEventListener('click', function () {
      if (state.calMonth === 11) { state.calYear++; state.calMonth = 0; }
      else { state.calMonth++; }
      renderCalendar(rows);
    });

    // Toggle day popover on click
    el.addEventListener('click', function (e) {
      var dayEl = e.target.closest('.cal-day--has-races');
      // If click was on a link inside the popover, let it navigate
      if (e.target.closest('.cal-race-item')) return;
      var wasOpen = dayEl && dayEl.classList.contains('cal-day--open');
      el.querySelectorAll('.cal-day--open').forEach(function (d) { d.classList.remove('cal-day--open'); });
      if (dayEl && !wasOpen) dayEl.classList.add('cal-day--open');
    });

    // Close open day on outside click
    document.addEventListener('click', function closeCal(e) {
      if (!el.contains(e.target)) {
        el.querySelectorAll('.cal-day--open').forEach(function (d) { d.classList.remove('cal-day--open'); });
        document.removeEventListener('click', closeCal);
      }
    });
  }

  // ---------- Map ----------

  function renderPopup(race) {
    var distances = (race.distance || []).map(function (d) { return RH.escapeHtml(d); }).join(', ');
    var nameHtml = '<a href="race.html?id=' + encodeURIComponent(race.id) + '">' + RH.escapeHtml(race.name) + '</a>';
    var location = [race.city, race.state].filter(Boolean).join(', ');
    return (
      '<div class="rh-popup"><strong>' + nameHtml + '</strong><br>' +
      RH.escapeHtml(RH.formatDate(race.date)) +
      (location ? '<br><span class="muted">' + RH.escapeHtml(location) + '</span>' : '') +
      (distances ? '<br>' + distances : '') +
      '</div>'
    );
  }

  function ensureMap() {
    if (map) return;
    map = L.map('race-map', { scrollWheelZoom: !MOBILE }).fitBounds(HOUSTON_BOUNDS);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 20, detectRetina: true
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    if (MOBILE) { map.on('click', function () { closeSheet(); }); }
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
      if (MOBILE) {
        marker.on('click', function (e) { L.DomEvent.stopPropagation(e); openSheet(race); });
      } else {
        marker.bindPopup(renderPopup(race));
        marker.on('mouseover', function () { map.getContainer().style.cursor = 'pointer'; });
        marker.on('mouseout', function () { map.getContainer().style.cursor = ''; });
      }
      marker.addTo(markerLayer);
      return [race.latitude, race.longitude];
    });
    if (latLngs.length > 0) {
      map.fitBounds(latLngs, { padding: [32, 32], maxZoom: 12 });
    } else {
      map.fitBounds(HOUSTON_BOUNDS);
    }
    setTimeout(function () { map.invalidateSize(); }, 0);
    var noteEl = document.getElementById('map-note');
    var missing = rows.length - geo.length;
    if (rows.length === 0) {
      noteEl.textContent = 'Hmm, nothing matches. Try widening your filters or clearing the search.';
    } else if (missing > 0) {
      noteEl.textContent = missing + ' race' + (missing === 1 ? ' is' : 's are') +
        ' not shown because they have no coordinates.';
    } else {
      noteEl.textContent = '';
    }
  }

  // ---------- Render ----------

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
    countEl.textContent = rows.length + ' race' + (rows.length === 1 ? '' : 's') + ' near Houston';
    if (state.view === 'map') { renderMap(rows); }
    else if (state.view === 'list') { renderTable(rows); }
    else if (state.view === 'cal') { renderCalendar(rows); }
    else { renderCards(rows); }
    pushStateToUrl();
  }

  function setView(view) {
    if (view !== 'cards' && view !== 'list' && view !== 'map' && view !== 'cal') return;
    state.view = view;
    if (view !== 'map') { closeSheet(); }

    if (view === 'cal' && state.window !== 'all') {
      state.window = 'all';
      var allRadio = document.querySelector('input[name="date"][value="all"]');
      if (allRadio) allRadio.checked = true;
      document.getElementById('dd-date-label').textContent = 'All dates';
      document.getElementById('dd-date-btn').classList.remove('has-selection');
    }

    var cardsWrap = document.getElementById('race-cards');
    var listWrap = document.getElementById('race-list');
    var mapWrap = document.getElementById('race-map-wrap');
    var calWrap = document.getElementById('race-cal');
    cardsWrap.hidden = view !== 'cards';
    listWrap.hidden = view !== 'list';
    mapWrap.hidden = view !== 'map';
    calWrap.hidden = view !== 'cal';

    var cardsBtn = document.getElementById('view-cards-btn');
    var listBtn = document.getElementById('view-list-btn');
    var mapBtn = document.getElementById('view-map-btn');
    var calBtn = document.getElementById('view-cal-btn');
    [cardsBtn, listBtn, mapBtn, calBtn].forEach(function (btn) {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    });
    var activeBtn = view === 'cards' ? cardsBtn : view === 'list' ? listBtn : view === 'map' ? mapBtn : calBtn;
    activeBtn.classList.add('is-active');
    activeBtn.setAttribute('aria-pressed', 'true');
    render();
  }

  // ---------- Mobile bottom sheet ----------

  function renderSheetHtml(race) {
    var distances = (race.distance || []).map(function (d) {
      return '<span class="badge distance">' + RH.escapeHtml(d) + '</span>';
    }).join('');
    var surfaceBadge = race.surface
      ? '<span class="badge surface-' + RH.escapeAttr(race.surface) + '">' + RH.escapeHtml(race.surface) + '</span>'
      : '';
    var location = [race.city, race.state].filter(Boolean).join(', ');
    var dateLine = RH.formatDate(race.date) + (race.start_time ? ' &middot; ' + RH.formatTime(race.start_time) : '');
    var registerBtn = race.official_website_url
      ? '<a href="' + RH.escapeAttr(RH.safeUrl(race.official_website_url)) +
        '" target="_blank" rel="noopener noreferrer" class="btn-register">Register &rarr;</a>'
      : '';
    return (
      '<button class="sheet-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="sheet-race-name" id="sheet-race-name">' + RH.escapeHtml(race.name) + '</div>' +
      '<div class="sheet-meta">' + dateLine + (location ? ' &middot; ' + RH.escapeHtml(location) : '') + '</div>' +
      '<div class="sheet-badges">' + distances + surfaceBadge + '</div>' +
      '<div class="sheet-actions">' +
        '<a href="race.html?id=' + encodeURIComponent(race.id) + '" class="sheet-detail-link">View details</a>' +
        (registerBtn || '') +
      '</div>'
    );
  }

  function openSheet(race) {
    var sheet = document.getElementById('race-map-sheet');
    if (!sheet) return;
    sheet.innerHTML = renderSheetHtml(race);
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('open');
    var closeBtn = sheet.querySelector('.sheet-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
  }

  function closeSheet() {
    var sheet = document.getElementById('race-map-sheet');
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('open');
    setTimeout(function () {
      if (!sheet.classList.contains('open')) { sheet.hidden = true; sheet.innerHTML = ''; }
    }, 220);
  }

  // ---------- Geolocation ----------

  var NEAR_ME_SVG =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>';

  // Near me for cards/list — sorts by distance and shows "X mi" badge
  function handleCardNearMe() {
    var btn = document.getElementById('card-near-me-btn');
    if (!navigator.geolocation) { btn.textContent = 'Not supported'; btn.disabled = true; return; }
    btn.disabled = true;
    btn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        state.userLat = pos.coords.latitude;
        state.userLng = pos.coords.longitude;
        state.sortByDistance = true;
        btn.disabled = false;
        btn.classList.add('is-active');
        btn.innerHTML = NEAR_ME_SVG + ' Near me';
        render();
      },
      function () {
        btn.disabled = false;
        btn.innerHTML = NEAR_ME_SVG + ' Near me';
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  // ---------- Wiring ----------

  function readChipState(group) {
    var picks = [];
    document.querySelectorAll('input[type="checkbox"][name="' + group + '"]').forEach(function (input) {
      if (input.checked) picks.push(input.value);
    });
    return picks;
  }

  function attachFilterHandlers() {
    document.getElementById('distance-chips').addEventListener('change', function () {
      state.distances = readChipState('distance'); render();
    });
    document.getElementById('surface-chips').addEventListener('change', function () {
      state.surfaces = readChipState('surface'); render();
    });

    var searchEl = document.getElementById('race-search');
    var debounce;
    searchEl.addEventListener('input', function (e) {
      clearTimeout(debounce);
      var val = e.target.value;
      debounce = setTimeout(function () { state.search = val; render(); }, 150);
    });

    var ddPairs = [
      { btn: 'dd-date-btn', panel: 'dd-date-panel' },
      { btn: 'dd-surface-btn', panel: 'dd-surface-panel' },
      { btn: 'dd-distance-btn', panel: 'dd-distance-panel' }
    ];

    function closeAllPanels() {
      ddPairs.forEach(function (p) {
        document.getElementById(p.panel).hidden = true;
        document.getElementById(p.btn).setAttribute('aria-expanded', 'false');
      });
    }

    ddPairs.forEach(function (pair) {
      var btn = document.getElementById(pair.btn);
      var panel = document.getElementById(pair.panel);
      btn.addEventListener('click', function () {
        var open = !panel.hidden;
        closeAllPanels();
        if (!open) { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-dd')) closeAllPanels();
    });

    document.getElementById('dd-date-panel').addEventListener('change', function () {
      var checked = document.querySelector('input[name="date"]:checked');
      state.window = checked ? checked.value : 'all';
      var label = document.getElementById('dd-date-label');
      var btn = document.getElementById('dd-date-btn');
      if (state.window === 'all') { label.textContent = 'All dates'; btn.classList.remove('has-selection'); }
      else { label.textContent = 'Next ' + state.window + ' days'; btn.classList.add('has-selection'); }
      closeAllPanels(); render();
    });

    document.getElementById('dd-surface-panel').addEventListener('change', function () {
      state.surfaces = readChipState('surface');
      var label = document.getElementById('dd-surface-label');
      var btn = document.getElementById('dd-surface-btn');
      if (state.surfaces.length === 0) { label.textContent = 'All surfaces'; btn.classList.remove('has-selection'); }
      else {
        label.textContent = state.surfaces.map(function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join(', ');
        btn.classList.add('has-selection');
      }
      closeAllPanels(); render();
    });

    document.getElementById('dd-distance-panel').addEventListener('change', function () {
      state.distances = readChipState('distance');
      var label = document.getElementById('dd-distance-label');
      var btn = document.getElementById('dd-distance-btn');
      if (state.distances.length === 0) { label.textContent = 'All distances'; btn.classList.remove('has-selection'); }
      else if (state.distances.length <= 3) { label.textContent = state.distances.join(', '); btn.classList.add('has-selection'); }
      else { label.textContent = state.distances.length + ' selected'; btn.classList.add('has-selection'); }
      closeAllPanels(); render();
    });

    document.getElementById('view-cards-btn').addEventListener('click', function () { setView('cards'); });
    document.getElementById('view-list-btn').addEventListener('click', function () { setView('list'); });
    document.getElementById('view-map-btn').addEventListener('click', function () { setView('map'); });
    document.getElementById('view-cal-btn').addEventListener('click', function () { setView('cal'); });
    document.getElementById('card-near-me-btn').addEventListener('click', handleCardNearMe);
  }

  // ---------- Init ----------

  function init() {
    var cardsEl = document.getElementById('race-cards');
    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        allRaces = data;
        var heroStat = document.getElementById('hero-stat');
        if (heroStat && data.length) {
          var future = data.filter(function (r) { return r.date >= RH.isoToday(); });
          heroStat.innerHTML =
            '<strong>' + future.length + ' races</strong>' +
            '<span class="page-hero__stats-sep">·</span>' +
            '<strong>54 clubs</strong>' +
            '<span class="page-hero__stats-sep">·</span>' +
            'Updated weekly';
        }
        renderChips('distance-chips', buildDistanceOptions(allRaces), 'distance');
        renderChips('surface-chips', buildSurfaceOptions(allRaces), 'surface');
        attachFilterHandlers();
        readStateFromUrl();
        render();
      })
      .catch(function (err) {
        console.error(err);
        cardsEl.innerHTML = '<p class="error">Could not load races. ' + RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
