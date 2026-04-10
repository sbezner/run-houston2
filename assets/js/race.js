/* race.html — single race detail (?id=...) */
(function () {
  'use strict';

  var DATA_URL = 'data/races-upcoming.json';

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

  function injectJsonLd(race) {
    // schema.org/Event — makes the race eligible for Google's enriched
    // event cards / events vertical. Googlebot executes JS and picks this
    // up post-render. Only emit fields we actually have; omit the rest
    // rather than guessing.
    var data = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': race.name,
      'url': 'https://runhouston.app/race.html?id=' + encodeURIComponent(race.id),
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode'
    };

    if (race.date) {
      data.startDate = race.start_time
        ? race.date + 'T' + race.start_time + (race.tz === 'America/Chicago' ? '-05:00' : '')
        : race.date;
    }
    if (race.description) data.description = race.description;
    if (race.official_website_url) {
      data.offers = {
        '@type': 'Offers',
        'url': race.official_website_url,
        'availability': 'https://schema.org/InStock'
      };
    }

    var place = { '@type': 'Place' };
    var hasPlace = false;
    if (race.address || race.city) {
      place.name = race.address || (race.city + (race.state ? ', ' + race.state : ''));
      hasPlace = true;
    }
    if (race.city || race.state || race.zip || race.address) {
      place.address = {
        '@type': 'PostalAddress',
        'streetAddress': race.address || undefined,
        'addressLocality': race.city || undefined,
        'addressRegion': race.state || undefined,
        'postalCode': race.zip || undefined,
        'addressCountry': 'US'
      };
      hasPlace = true;
    }
    if (typeof race.latitude === 'number' && typeof race.longitude === 'number') {
      place.geo = {
        '@type': 'GeoCoordinates',
        'latitude': race.latitude,
        'longitude': race.longitude
      };
      hasPlace = true;
    }
    if (hasPlace) data.location = place;

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'race-jsonld';
    script.textContent = JSON.stringify(data);
    var existing = document.getElementById('race-jsonld');
    if (existing) existing.remove();
    document.head.appendChild(script);
  }

  function updateMeta(race) {
    document.title = race.name + ' — Run Houston';

    var date = RH.formatDateLong(race.date);
    var dists = (race.distance || []).join(', ');
    var desc = race.name + ' — ' + date +
      (dists ? '. Distances: ' + dists + '.' : '.') +
      (race.city ? ' ' + race.city + ', TX.' : '') +
      ' Find details and register on Run Houston.';
    var url = 'https://runhouston.app/race.html?id=' + encodeURIComponent(race.id);

    var metaMap = {
      'meta[name="description"]': desc,
      'meta[property="og:title"]': race.name + ' — Run Houston',
      'meta[property="og:description"]': desc,
      'meta[property="og:url"]': url
    };
    Object.keys(metaMap).forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.setAttribute('content', metaMap[sel]);
    });

    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  function buildCalendarLinks(race) {
    if (!race.date) return '';

    // Build start/end timestamps. If no start_time, treat as all-day.
    var dateClean = race.date.replace(/-/g, '');
    var hasTime = !!race.start_time;
    var startDT, endDT;

    if (hasTime) {
      var timeClean = race.start_time.replace(':', '') + '00';
      startDT = dateClean + 'T' + timeClean;
      // Default 3-hour event duration
      var h = parseInt(race.start_time.split(':')[0], 10);
      var endH = String(h + 3).padStart(2, '0');
      endDT = dateClean + 'T' + endH + race.start_time.split(':')[1] + '00';
    } else {
      // All-day event: just the date, next day as end
      startDT = dateClean;
      var d = new Date(race.date + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      endDT = y + m + day;
    }

    var location = [race.address, race.city, race.state].filter(Boolean).join(', ');
    var details = race.official_website_url || '';

    // Google Calendar URL
    var gcalUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(race.name) +
      '&dates=' + startDT + '/' + endDT +
      (location ? '&location=' + encodeURIComponent(location) : '') +
      (details ? '&details=' + encodeURIComponent(details) : '');

    // iCal (.ics) data URI
    var icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Run Houston//runhouston.app//EN',
      'BEGIN:VEVENT',
      hasTime ? 'DTSTART:' + startDT : 'DTSTART;VALUE=DATE:' + startDT,
      hasTime ? 'DTEND:' + endDT : 'DTEND;VALUE=DATE:' + endDT,
      'SUMMARY:' + race.name.replace(/[,;\\]/g, '\\$&'),
      location ? 'LOCATION:' + location.replace(/[,;\\]/g, '\\$&') : '',
      details ? 'URL:' + details : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    var icsBlob = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsLines);

    return (
      '<div class="calendar-links">' +
      '<span class="calendar-links-label">Add to calendar:</span> ' +
      '<a href="' + RH.escapeAttr(gcalUrl) + '" target="_blank" rel="noopener noreferrer">' +
      'Google</a>' +
      ' <span class="calendar-links-sep">&middot;</span> ' +
      '<a href="' + RH.escapeAttr(icsBlob) + '" download="' +
      RH.escapeAttr(race.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-')) +
      '.ics">iCal / Outlook</a>' +
      '</div>'
    );
  }

  function buildShareButton(race) {
    var url = 'https://runhouston.app/race.html?id=' + encodeURIComponent(race.id);
    var text = race.name + ' — ' + RH.formatDateLong(race.date);
    return (
      '<button type="button" class="btn-share" ' +
      'data-url="' + RH.escapeAttr(url) + '" ' +
      'data-title="' + RH.escapeAttr(race.name + ' — Run Houston') + '" ' +
      'data-text="' + RH.escapeAttr(text) + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>' +
      '<polyline points="16 6 12 2 8 6"/>' +
      '<line x1="12" y1="2" x2="12" y2="15"/>' +
      '</svg>' +
      'Share this race</button>'
    );
  }

  function handleShare(e) {
    var btn = e.currentTarget;
    var data = {
      title: btn.dataset.title,
      text: btn.dataset.text,
      url: btn.dataset.url
    };

    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else {
      navigator.clipboard.writeText(data.url).then(function () {
        var orig = btn.innerHTML;
        btn.innerHTML = 'Link copied!';
        btn.classList.add('is-copied');
        setTimeout(function () {
          btn.innerHTML = orig;
          btn.classList.remove('is-copied');
        }, 2000);
      });
    }
  }

  function renderRace(race) {
    updateMeta(race);
    injectJsonLd(race);

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
        '<a href="' + RH.escapeAttr(RH.safeUrl(race.official_website_url)) +
        '" target="_blank" rel="noopener noreferrer" class="btn-primary">' +
        'Register for this race &rarr;</a>' +
        '</p>'
      : '';

    var calendarLinks = buildCalendarLinks(race);
    var shareButton = buildShareButton(race);

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
      '</dl>' +
      calendarLinks +
      '<div class="race-actions">' + shareButton + '</div>' +
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

    RH.loadJson(DATA_URL)
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Expected ' + DATA_URL + ' to be a JSON array');
        }
        var race = data.find(function (r) { return r.id === id; });
        if (!race) {
          articleEl.innerHTML =
            '<p class="error">Race not found: <code>' + RH.escapeHtml(id) +
            '</code>. <a href="index.html">Browse upcoming races</a>.</p>';
          return;
        }
        articleEl.innerHTML = renderRace(race);
        var shareBtn = articleEl.querySelector('.btn-share');
        if (shareBtn) shareBtn.addEventListener('click', handleShare);
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
