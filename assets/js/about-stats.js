(function() {
  'use strict';

  const statsContainer = document.getElementById('about-stats');
  if (!statsContainer) return;

  const timezone = 'America/Chicago';

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

  function formatDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  let racesResponse;
  
  Promise.all([
    fetch('data/races-upcoming.json').then(r => {
      racesResponse = r;
      return r.ok ? r.json() : Promise.reject('races fetch failed');
    }),
    fetch('data/news.json').then(r => r.ok ? r.json() : Promise.reject('news fetch failed'))
  ])
    .then(([racesData, newsData]) => {
      const today = getTodayInTimezone(timezone);
      const races = Array.isArray(racesData) ? racesData : (racesData.races || []);
      
      const upcomingRaces = races.filter(race => race.date && race.date >= today);
      
      const cities = new Set();
      upcomingRaces.forEach(race => {
        if (race.city && race.city.trim()) {
          cities.add(race.city.trim());
        }
      });
      
      const newsItems = Array.isArray(newsData) ? newsData : (newsData.items || []);
      
      let lastUpdated = null;
      
      if (typeof racesData === 'object' && !Array.isArray(racesData)) {
        if (racesData.updated) {
          lastUpdated = racesData.updated;
        } else if (racesData.last_updated) {
          lastUpdated = racesData.last_updated;
        }
      }
      
      if (!lastUpdated && racesResponse.headers.has('Last-Modified')) {
        const lastModified = racesResponse.headers.get('Last-Modified');
        const date = new Date(lastModified);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          lastUpdated = `${year}-${month}-${day}`;
        }
      }
      
      const stats = [
        { label: 'Upcoming races', value: upcomingRaces.length },
        { label: 'News stories', value: newsItems.length },
        { label: 'Areas covered', value: cities.size }
      ];
      
      if (lastUpdated) {
        stats.push({
          label: 'Race list updated',
          value: formatDate(lastUpdated)
        });
      }
      
      const html = stats.map(stat => 
        `<div class="about-stat">
          <div class="about-stat__value">${stat.value}</div>
          <div class="about-stat__label">${stat.label}</div>
        </div>`
      ).join('');
      
      statsContainer.innerHTML = html;
      statsContainer.style.display = 'grid';
    })
    .catch(err => {
      console.warn('Failed to load stats:', err);
      statsContainer.style.display = 'none';
    });
})();
