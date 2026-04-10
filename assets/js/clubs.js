/* clubs.html — running clubs directory */
(function () {
  'use strict';

  var DATA_URL = 'data/clubs.json';

  // Coarse area buckets, derived from each club's location string.
  // Keeps the filter UI tractable across ~40 clubs spread across the metro.
  var AREAS = ['Inner Loop', 'West', 'North', 'South', 'Multiple / Various'];

  function deriveArea(club) {
    var loc = (club.location || '').toLowerCase();
    // Order matters. "Spring Branch" is a central-west Houston neighborhood,
    // not the far-north suburb of Spring, TX — catch it BEFORE the North
    // regex below (which would otherwise match on /spring/). "West
    // University Place" is also inner-loop even though it starts with
    // "West", so the Inner Loop regex includes /west university/.
    if (/spring branch/.test(loc)) return 'Inner Loop';
    if (/heights|memorial|inner loop|central|downtown|east end|second ward|washington|rice|midtown|west university/.test(loc)) return 'Inner Loop';
    if (/woodlands|conroe|spring|klein|tomball|humble|atascocita|northwest|north houston|northside/.test(loc)) return 'North';
    if (/katy|cypress|citycentre|westchase/.test(loc)) return 'West';
    if (/pearland|fort bend|sugar|missouri city|richmond|kemah|seabrook|pasadena|clear lake/.test(loc)) return 'South';
    return 'Multiple / Various';
  }

  var allClubs = [];
  var state = {
    search: '',
    areas: [],
    view: 'list' // 'list' | 'map'
  };

  // Leaflet objects are created lazily on first switch to map view, so
  // list-only visitors don't pay for tile loading / DOM.
  var map = null;
  var markerLayer = null;
  // Rough bounding box around the Houston metro — used as the initial map
  // view and as a fallback when no filtered club has coordinates.
  var HOUSTON_BOUNDS = [[29.35, -95.90], [30.20, -94.90]];

  // ---------- Rendering ----------

  function renderAreaChips() {
    var el = document.getElementById('area-chips');
    el.innerHTML = AREAS.map(function (area) {
      var id = 'area-' + area.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        '<span class="chip">' +
        '<input type="checkbox" id="' + RH.escapeAttr(id) + '" name="area" value="' +
        RH.escapeAttr(area) + '">' +
        '<label for="' + RH.escapeAttr(id) + '">' + RH.escapeHtml(area) + '</label>' +
        '</span>'
      );
    }).join('');
  }

  function renderClubCard(club) {
    var safeWebsite = club.website_url ? RH.safeUrl(club.website_url) : '';

    var nameHtml = club.website_url
      ? '<a href="' + RH.escapeAttr(safeWebsite) + '" target="_blank" rel="noopener noreferrer">' +
        RH.escapeHtml(club.club_name) + '</a>'
      : RH.escapeHtml(club.club_name);

    var location = club.location
      ? '<div class="race-meta"><span>' + RH.escapeHtml(club.location) + '</span></div>'
      : '';

    var description = club.description
      ? '<p class="race-description">' + RH.escapeHtml(club.description) + '</p>'
      : '';

    var siteFooter = club.website_url
      ? '<div class="race-card-footer"><a href="' + RH.escapeAttr(safeWebsite) +
        '" target="_blank" rel="noopener noreferrer">' +
        RH.escapeHtml(RH.prettyHost(club.website_url)) + ' &rarr;</a></div>'
      : '<div class="race-card-footer muted">No website listed</div>';

    return (
      '<article class="race-card">' +
      '<h2>' + nameHtml + '</h2>' +
      location +
      description +
      siteFooter +
      '</article>'
    );
  }

  function filterClubs() {
    return alasql(
      'SELECT * FROM ? ' +
        'WHERE INSET(area, ?) ' +
        'AND (HASTEXT(club_name, ?) OR HASTEXT(location, ?) OR HASTEXT(description, ?)) ' +
        'ORDER BY club_name ASC',
      [allClubs, state.areas, state.search, state.search, state.search]
    );
  }

  function renderList(rows) {
    var listEl = document.getElementById('club-list');
    if (rows.length === 0) {
      listEl.innerHTML =
        '<p class="empty">No clubs match. Try clearing the search box or an area chip.</p>';
      return;
    }
    listEl.innerHTML = rows.map(renderClubCard).join('');
  }

  // ---------- Map rendering ----------

  function hasCoords(club) {
    return typeof club.latitude === 'number' && typeof club.longitude === 'number';
  }

  // Collapse clubs that share an exact coordinate into one marker, so stacks
  // of 9 clubs at the same downtown pin become a single marker with a
  // combined popup instead of 8 hidden behind 1.
  function groupByCoord(clubs) {
    var groups = {};
    var order = [];
    clubs.forEach(function (c) {
      var key = c.latitude + ',' + c.longitude;
      if (!groups[key]) {
        groups[key] = { lat: c.latitude, lng: c.longitude, clubs: [] };
        order.push(key);
      }
      groups[key].clubs.push(c);
    });
    return order.map(function (k) { return groups[k]; });
  }

  function clubLinkHtml(club) {
    return club.website_url
      ? '<a href="' + RH.escapeAttr(RH.safeUrl(club.website_url)) +
        '" target="_blank" rel="noopener noreferrer">' +
        RH.escapeHtml(club.club_name) + '</a>'
      : RH.escapeHtml(club.club_name);
  }

  function renderPopup(group) {
    if (group.clubs.length === 1) {
      var c = group.clubs[0];
      return (
        '<div class="rh-popup">' +
        '<strong>' + clubLinkHtml(c) + '</strong>' +
        (c.location
          ? '<br><span class="muted">' + RH.escapeHtml(c.location) + '</span>'
          : '') +
        (c.description
          ? '<br>' + RH.escapeHtml(c.description)
          : '') +
        (c.website_url
          ? '<br><a class="rh-popup-link" href="' + RH.escapeAttr(RH.safeUrl(c.website_url)) +
            '" target="_blank" rel="noopener noreferrer">' +
            RH.escapeHtml(RH.prettyHost(c.website_url)) + ' &rarr;</a>'
          : '') +
        '</div>'
      );
    }

    var items = group.clubs.map(function (c) {
      return '<li>' + clubLinkHtml(c) + '</li>';
    }).join('');

    return (
      '<div class="rh-popup">' +
      '<strong>' + group.clubs.length + ' clubs at this location</strong>' +
      '<ul>' + items + '</ul>' +
      '</div>'
    );
  }

  function ensureMap() {
    if (map) return;
    map = L.map('club-map', {
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

    var geoClubs = rows.filter(hasCoords);
    var groups = groupByCoord(geoClubs);

    var latLngs = groups.map(function (g) {
      var marker = L.marker([g.lat, g.lng], { title: g.clubs[0].club_name });
      marker.bindPopup(renderPopup(g));
      marker.addTo(markerLayer);
      return [g.lat, g.lng];
    });

    if (latLngs.length > 0) {
      map.fitBounds(latLngs, { padding: [32, 32], maxZoom: 12 });
    } else {
      map.fitBounds(HOUSTON_BOUNDS);
    }

    // Leaflet can't compute its own size while its container is hidden.
    setTimeout(function () { map.invalidateSize(); }, 0);

    var noteEl = document.getElementById('map-note');
    var missing = rows.length - geoClubs.length;
    if (rows.length === 0) {
      noteEl.textContent =
        'No clubs match. Try clearing the search box or an area chip.';
    } else if (missing > 0) {
      noteEl.textContent =
        missing + ' club' + (missing === 1 ? ' is' : 's are') +
        ' not shown because they have no coordinates.';
    } else {
      noteEl.textContent = '';
    }
  }

  function render() {
    var listEl = document.getElementById('club-list');
    var countEl = document.getElementById('result-count');

    var rows;
    try {
      rows = filterClubs();
    } catch (err) {
      console.error('AlaSQL query failed:', err);
      listEl.innerHTML = '<p class="error">Sorry, something went wrong filtering the clubs.</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent =
      rows.length + ' club' + (rows.length === 1 ? '' : 's') + ' found';

    if (state.view === 'map') {
      renderMap(rows);
    } else {
      renderList(rows);
    }
  }

  function setView(view) {
    if (view !== 'list' && view !== 'map') return;
    state.view = view;

    var listWrap = document.getElementById('club-list');
    var mapWrap = document.getElementById('club-map-wrap');
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

  function attachHandlers() {
    document
      .getElementById('area-chips')
      .addEventListener('change', function () {
        state.areas = readChipState('area');
        render();
      });

    var searchEl = document.getElementById('club-search');
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
      .getElementById('view-list-btn')
      .addEventListener('click', function () { setView('list'); });
    document
      .getElementById('view-map-btn')
      .addEventListener('click', function () { setView('map'); });
  }

  function injectJsonLd(clubs) {
    // schema.org/SportsClub per club — helps Google surface clubs as
    // local-organization results. Emitted as a single @graph blob so
    // there's just one <script> tag to manage.
    var graph = clubs.map(function (c) {
      var node = {
        '@type': 'SportsClub',
        'name': c.club_name,
        'sport': 'Running'
      };
      if (c.website_url) node.url = c.website_url;
      if (c.description) node.description = c.description;
      if (c.location) {
        node.address = {
          '@type': 'PostalAddress',
          'addressLocality': c.location,
          'addressRegion': 'TX',
          'addressCountry': 'US'
        };
      }
      if (typeof c.latitude === 'number' && typeof c.longitude === 'number') {
        node.geo = {
          '@type': 'GeoCoordinates',
          'latitude': c.latitude,
          'longitude': c.longitude
        };
      }
      return node;
    });

    var data = { '@context': 'https://schema.org', '@graph': graph };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'clubs-jsonld';
    script.textContent = JSON.stringify(data);
    var existing = document.getElementById('clubs-jsonld');
    if (existing) existing.remove();
    document.head.appendChild(script);
  }

  function init() {
    var listEl = document.getElementById('club-list');
    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        // Pre-tag each club with its derived area so AlaSQL can filter on it.
        allClubs = data.map(function (c) {
          return Object.assign({}, c, { area: deriveArea(c) });
        });
        injectJsonLd(data);
        renderAreaChips();
        attachHandlers();
        render();
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML =
          '<p class="error">Could not load clubs. ' + RH.escapeHtml(err.message) + '</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
