/* Run Houston — shared helpers used by every page.
 *
 * Loaded BEFORE the per-page script. Exposes a single global `RH`
 * with utilities and registers AlaSQL custom functions.
 */
(function () {
  'use strict';

  // ---------- AlaSQL helpers ----------
  // Registered once, available to every page that loads alasql.

  if (typeof alasql !== 'undefined') {
    // Returns true if `arr` shares any element with `picks`,
    // OR `picks` is empty (no filter selected).
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

    // Case-insensitive substring match. Empty needle => true.
    // Named HASTEXT (not ILIKE) because AlaSQL's parser greedily matches
    // the LIKE keyword inside any function name that contains it.
    alasql.fn.HASTEXT = function (haystack, needle) {
      if (!needle) return true;
      if (haystack == null) return false;
      return String(haystack).toLowerCase().indexOf(String(needle).toLowerCase()) !== -1;
    };
  }

  // ---------- Date helpers ----------

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function isoPlusDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDateLong(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(t) {
    if (!t) return '';
    var parts = String(t).split(':').map(Number);
    var h = parts[0];
    var m = parts[1];
    var period = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return h12 + ':' + pad(m) + ' ' + period;
  }

  // ---------- HTML helpers ----------

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  // Convert "https://example.com/path" -> "example.com"
  function prettyHost(url) {
    if (!url) return '';
    try {
      var u = new URL(url);
      return u.host.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  }

  // Defense-in-depth: scrub URLs that come from data files before we stick
  // them into an href. Returns '#' for anything that isn't http(s), mailto,
  // tel, or a fragment, so a compromised data file can't plant a
  // `javascript:` URL that executes on click.
  var SAFE_URL_RE = /^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;
  function safeUrl(url) {
    if (url == null) return '#';
    var s = String(url).trim();
    if (s === '') return '#';
    return SAFE_URL_RE.test(s) ? s : '#';
  }

  // ---------- Fetch helper with friendly error ----------

  function loadJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ' loading ' + url);
      }
      return res.json();
    });
  }

  // ---------- Query string helper ----------

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  window.RH = {
    isoToday: isoToday,
    isoPlusDays: isoPlusDays,
    formatDate: formatDate,
    formatDateLong: formatDateLong,
    formatTime: formatTime,
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    prettyHost: prettyHost,
    safeUrl: safeUrl,
    loadJson: loadJson,
    getQueryParam: getQueryParam
  };
})();
