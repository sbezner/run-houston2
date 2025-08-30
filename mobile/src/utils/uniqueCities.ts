export function uniqueCities(races: Array<{ city?: string | null }>): string[] {
  const cities = races
    .map(race => race.city)
    .filter((city): city is string => Boolean(city))
    .map(city => city.trim())
    .filter(city => city.length > 0);
  
  return [...new Set(cities)].sort();
}
