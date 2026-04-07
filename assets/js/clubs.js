/* clubs.html — running clubs directory */
(function () {
  'use strict';

  var DATA_URL = 'data/clubs.json';

  // Coarse area buckets, derived from each club's location string.
  // Keeps the filter UI tractable across ~40 clubs spread across the metro.
  var AREAS = ['Inner Loop', 'West', 'North', 'South', 'Multiple / Various'];

  function deriveArea(club) {
    var loc = (club.location || '').toLowerCase();
    // Order matters: Inner Loop is checked first so neighborhoods like
    // "West University Place" stay inside the loop instead of being lumped
    // in with the western suburbs.
    if (/heights|memorial|inner loop|central|downtown|east end|second ward|washington|rice|midtown|west university/.test(loc)) return 'Inner Loop';
    if (/woodlands|conroe|spring|klein|tomball|humble|atascocita|northwest|north houston|northside/.test(loc)) return 'North';
    if (/katy|cypress|citycentre|westchase/.test(loc)) return 'West';
    if (/pearland|fort bend|sugar|missouri city|richmond|kemah|seabrook|pasadena|clear lake/.test(loc)) return 'South';
    return 'Multiple / Various';
  }

  var allClubs = [];
  var state = {
    search: '',
    areas: []
  };

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
    var nameHtml = club.website_url
      ? '<a href="' + RH.escapeAttr(club.website_url) + '" target="_blank" rel="noopener noreferrer">' +
        RH.escapeHtml(club.club_name) + '</a>'
      : RH.escapeHtml(club.club_name);

    var location = club.location
      ? '<div class="race-meta"><span>' + RH.escapeHtml(club.location) + '</span></div>'
      : '';

    var description = club.description
      ? '<p class="race-description">' + RH.escapeHtml(club.description) + '</p>'
      : '';

    var siteFooter = club.website_url
      ? '<div class="race-card-footer"><a href="' + RH.escapeAttr(club.website_url) +
        '" target="_blank" rel="noopener noreferrer">' +
        RH.escapeHtml(RH.prettyHost(club.website_url)) + ' &rarr;</a></div>'
      : '<div class="race-card-footer muted">No website listed</div>';

    var directions =
      typeof club.latitude === 'number' && typeof club.longitude === 'number'
        ? ' &middot; <a href="https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(club.latitude + ',' + club.longitude) +
          '" target="_blank" rel="noopener noreferrer">Map</a>'
        : '';

    return (
      '<article class="race-card">' +
      '<h2>' + nameHtml + '</h2>' +
      location +
      description +
      siteFooter.replace('</div>', directions + '</div>') +
      '</article>'
    );
  }

  function render() {
    var listEl = document.getElementById('club-list');
    var countEl = document.getElementById('result-count');

    var rows;
    try {
      rows = alasql(
        'SELECT * FROM ? ' +
          'WHERE INSET(area, ?) ' +
          'AND (HASTEXT(club_name, ?) OR HASTEXT(location, ?) OR HASTEXT(description, ?)) ' +
          'ORDER BY club_name ASC',
        [allClubs, state.areas, state.search, state.search, state.search]
      );
    } catch (err) {
      console.error('AlaSQL query failed:', err);
      listEl.innerHTML = '<p class="error">Sorry, something went wrong filtering the clubs.</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent =
      rows.length + ' club' + (rows.length === 1 ? '' : 's') + ' found';

    if (rows.length === 0) {
      listEl.innerHTML =
        '<p class="empty">No clubs match. Try clearing the search box or an area chip.</p>';
      return;
    }

    listEl.innerHTML = rows.map(renderClubCard).join('');
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
