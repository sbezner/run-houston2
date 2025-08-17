import { validateAndTransform } from './validation';
import type { RaceCsvRow } from './errors';

// Test data from the requirements
const testRows: RaceCsvRow[] = [
  {
    id: '1',
    name: 'Bayou City 5k',
    date: '8/19/2025',
    start_time: '19:30:00',
    address: '600 Memorial Dr',
    city: 'Houston',
    state: 'tx',
    zip: '77007',
    surface: 'road',
    kid_run: 'FALSE',
    official_website_url: 'https://runsignup.com/Race/TX/Houston/BayouCityClassic10k',
    latitude: '29.7633',
    longitude: '-95.3819'
  },
  {
    id: '2',
    name: 'Galveston Beach 10K',
    date: '9/1/2025',
    start_time: '8:00 AM',
    address: 'Stewart Beach',
    city: 'Galveston',
    state: 'TX',
    zip: '77550',
    surface: 'road',
    kid_run: 'No',
    official_website_url: 'https://example.com/galv10k',
    latitude: '29.3',
    longitude: '-94.7667'
  },
  {
    id: '25',
    name: 'Houston Marathon',
    date: '2025-09-01',
    start_time: '7:00:00',
    address: '1001 Avenida de las Americas',
    city: 'Houston',
    state: 'TX',
    zip: '77010',
    surface: 'road',
    kid_run: 'TRUE',
    official_website_url: 'https://www.chevronhoustonmarathon.com/',
    latitude: '29.7517931',
    longitude: '-95.3581139'
  },
  {
    id: '7',
    name: 'Test Race - Database Fixed!!!!!',
    date: '8/25/2027',
    start_time: '8:00',
    address: '16123 Capri Drive',
    city: 'Jersey Village',
    state: 'TX',
    zip: '77040',
    surface: 'road',
    kid_run: '1',
    official_website_url: 'www.yahoo.com',
    latitude: '29.8902025',
    longitude: '-95.566397'
  }
];

// Test validation
console.log('Testing validation with sample data...');
const result = validateAndTransform(testRows);

console.log('Validation Results:');
console.log('Total rows:', result.stats.total);
console.log('Valid rows:', result.stats.valid);
console.log('Invalid rows:', result.stats.invalid);
console.log('Duplicates:', result.stats.duplicates);

console.log('\nValid races:');
result.valid.forEach((race, index) => {
  console.log(`${index + 1}. ${race.name} - ${race.date} ${race.start_time} - ${race.city}, ${race.state}`);
});

if (result.errors.length > 0) {
  console.log('\nValidation errors:');
  result.errors.forEach(error => {
    console.log(`Row ${error.rowIndex} - ${error.field}: ${error.message}`);
    if (error.hint) console.log(`  Hint: ${error.hint}`);
  });
}

if (result.warnings.length > 0) {
  console.log('\nValidation warnings:');
  result.warnings.forEach(warning => {
    console.log(`Row ${warning.rowIndex}: ${warning.message}`);
    if (warning.hint) console.log(`  Hint: ${warning.hint}`);
  });
}

// Test specific transformations
console.log('\nTesting specific transformations:');
const firstRace = result.valid[0];
if (firstRace) {
  console.log('Date transformation:', testRows[0].date, '->', firstRace.date);
  console.log('Time transformation:', testRows[0].start_time, '->', firstRace.start_time);
  console.log('State transformation:', testRows[0].state, '->', firstRace.state);
  console.log('Kid run transformation:', testRows[0].kid_run, '->', firstRace.kid_run);
  console.log('URL transformation:', testRows[0].official_website_url, '->', firstRace.official_website_url);
}
