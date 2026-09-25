(function() {
  'use strict';

  const statsContainer = document.getElementById('about-stats');
  if (!statsContainer) return;

  const timezone = 'America/Chicago';

  const cityAliases = {
    'sugarland': 'Sugar Land',
    'sugar land': 'Sugar Land'
  };

  function getTodayInTimezone(tz) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  }

  function formatDateInTimezone(isoDateStr, tz) {
    if (!isoDateStr) return null;
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function normalizeCity(city) {
    if (!city || typeof city !== 'string') return null;
    const normalized = city.trim().toLowerCase();
    return cityAliases[normalized] || city.trim();
  }

  function isRealTexasCity(race) {
    if (!race.state || race.state !== 'TX') return false;
    if (!race.city || typeof race.city !== 'string') return false;
    if (race.city.includes('Your Town')) return false;
    return true;
  }

  function renderStats(stats) {
    statsContainer.innerHTML = '';
    stats.forEach(stat => {
      const statDiv = document.createElement('div');
      statDiv.className = 'about-stat';
      
      const valueDiv = document.createElement('div');
      valueDiv.className = 'about-stat__value';
      valueDiv.textContent = stat.value;
      
      const labelDiv = document.createElement('div');
      labelDiv.className = 'about-stat__label';
      labelDiv.textContent = stat.label;
      
      statDiv.appendChild(valueDiv);
      statDiv.appendChild(labelDiv);
      statsContainer.appendChild(statDiv);
    });
    statsContainer.style.display = 'grid';
  }

  Promise.all([
    fetch('data/races-upcoming.json').then(r => r.ok ? r.json() : Promise.reject('races fetch failed')),
    fetch('data/news.json').then(r => r.ok ? r.json() : Promise.reject('news fetch failed'))
  ])
    .then(([racesData, newsData]) => {
      const today = getTodayInTimezone(timezone);
      const races = Array.isArray(racesData) ? racesData : (racesData.races || []);
      
      const upcomingRaces = races.filter(race => race.date && race.date >= today);
      
      const cities = new Set();
      upcomingRaces.forEach(race => {
        if (isRealTexasCity(race)) {
          const normalized = normalizeCity(race.city);
          if (normalized) {
            cities.add(normalized);
          }
        }
      });
      
      const newsItems = Array.isArray(newsData) ? newsData : (newsData.items || []);
      
      const stats = [
        { label: 'Upcoming races', value: String(upcomingRaces.length) },
        { label: 'News stories', value: String(newsItems.length) },
        { label: 'Areas covered', value: String(cities.size) }
      ];
      
      renderStats(stats);
      
      fetch('https://api.github.com/repos/sbezner/run-houston2/commits?path=data/races-upcoming.json&sha=master&per_page=1')
        .then(r => r.ok ? r.json() : Promise.reject('github api failed'))
        .then(commits => {
          if (commits && commits.length > 0 && commits[0].commit && commits[0].commit.committer) {
            const commitDate = commits[0].commit.committer.date;
            const formattedDate = formatDateInTimezone(commitDate, timezone);
            if (formattedDate) {
              stats.push({
                label: 'Race list updated',
                value: formattedDate
              });
              renderStats(stats);
            }
          }
        })
        .catch(err => {
          console.warn('Failed to fetch last update date:', err);
        });
    })
    .catch(err => {
      console.warn('Failed to load stats:', err);
      statsContainer.style.display = 'none';
    });
})();
