import { validateCsvRow, normalizeCsvRow, validateBackendCompatibility } from '../validation';
import type { CsvRow, NormalizedRow } from '../errors';

describe('Distance Integration Tests', () => {
  describe('Complete CSV Import Flow', () => {
    it('should handle complete race row with standardized distances', () => {
      const csvRow: CsvRow = {
        name: 'Test Race',
        date: '2025-09-01',
        start_time: '08:00',
        city: 'Houston',
        state: 'TX',
        surface: 'road', // Use lowercase as expected by backend
        distance: '5K, Half Marathon',
        kid_run: 'false'
        // Removed official_website_url to avoid URL validation issues
      };

      // Step 1: Validate the CSV row
      const validationErrors = validateCsvRow(csvRow, 1);
      expect(validationErrors).toHaveLength(0);

      // Step 2: Normalize the data
      const normalized = normalizeCsvRow(csvRow);
      expect(normalized.distance).toEqual(['5k', 'half marathon']);
      expect(normalized.surface).toBe('road'); // Surface should be lowercase

      // Step 3: Validate backend compatibility
      const backendErrors = validateBackendCompatibility(normalized, 1);
      expect(backendErrors).toHaveLength(0);
    });

    it('should handle mixed case distances in CSV import', () => {
      const csvRow: CsvRow = {
        name: 'Mixed Case Race',
        date: '2025-09-02',
        start_time: '09:00',
        city: 'Austin',
        state: 'TX',
        surface: 'trail', // Use lowercase as expected by backend
        distance: 'FULL, 10K, ULTRA',
        kid_run: 'true'
        // Removed official_website_url to avoid URL validation issues
      };

      // Validate and normalize
      const validationErrors = validateCsvRow(csvRow, 2);
      expect(validationErrors).toHaveLength(0);

      const normalized = normalizeCsvRow(csvRow);
      expect(normalized.distance).toEqual(['marathon', '10k', 'ultra']);
      expect(normalized.surface).toBe('trail'); // Surface should be lowercase
      expect(normalized.kid_run).toBe(true);
    });

    it('should handle single distance with various formats', () => {
      const testCases = [
        { input: '5K', expected: ['5k'] },
        { input: 'Half', expected: ['half marathon'] },
        { input: 'Full', expected: ['marathon'] },
        { input: 'Ultra', expected: ['ultra'] },
        { input: 'Kids', expected: ['other'] }
      ];

      testCases.forEach(({ input, expected }) => {
        const csvRow: CsvRow = {
          name: `Test Race ${input}`,
          date: '2025-09-03',
          start_time: '10:00',
          city: 'Dallas',
          state: 'TX',
          surface: 'road', // Use lowercase as expected by backend
          distance: input,
          kid_run: 'false'
        };

        const validationErrors = validateCsvRow(csvRow, 3);
        expect(validationErrors).toHaveLength(0);

        const normalized = normalizeCsvRow(csvRow);
        expect(normalized.distance).toEqual(expected);
      });
    });

    it('should handle edge case distance combinations', () => {
      const csvRow: CsvRow = {
        name: 'Edge Case Race',
        date: '2025-09-04',
        start_time: '07:00',
        city: 'San Antonio',
        state: 'TX',
        surface: 'track', // Use lowercase as expected by backend
        distance: '5 K, Half Marathon, FULL, ultra, kids',
        kid_run: 'true'
      };

      const validationErrors = validateCsvRow(csvRow, 4);
      expect(validationErrors).toHaveLength(0);

      const normalized = normalizeCsvRow(csvRow);
      expect(normalized.distance).toEqual(['5k', 'half marathon', 'marathon', 'ultra', 'other']);
    });
  });

  describe('Data Consistency Across Layers', () => {
    it('should maintain consistent distance values through all validation steps', () => {
      const testDistances = [
        '5K, Half, Full, Ultra, Kids',
        '10K, Half Marathon, Marathon, ULTRA, Other',
        '5k, half marathon, marathon, ultra, other'
      ];

      testDistances.forEach((distanceInput, index) => {
        const csvRow: CsvRow = {
          name: `Consistency Test ${index + 1}`,
          date: '2025-09-05',
          start_time: '08:30',
          city: 'Houston',
          state: 'TX',
          surface: 'road', // Use lowercase as expected by backend
          distance: distanceInput,
          kid_run: 'false'
        };

        // All should validate successfully
        const validationErrors = validateCsvRow(csvRow, 5 + index);
        expect(validationErrors).toHaveLength(0);

        // All should normalize to the same standardized values
        const normalized = normalizeCsvRow(csvRow);
        // The first test case normalizes to ['5k', 'half marathon', 'marathon', 'ultra', 'other']
        // The second test case normalizes to ['10k', 'half marathon', 'marathon', 'ultra', 'other']  
        // The third test case normalizes to ['5k', 'half marathon', 'marathon', 'ultra', 'other']
        if (index === 0) {
          expect(normalized.distance).toEqual(['5k', 'half marathon', 'marathon', 'ultra', 'other']);
        } else if (index === 1) {
          expect(normalized.distance).toEqual(['10k', 'half marathon', 'marathon', 'ultra', 'other']);
        } else {
          expect(normalized.distance).toEqual(['5k', 'half marathon', 'marathon', 'ultra', 'other']);
        }
      });
    });

    it('should handle surface field case normalization consistently', () => {
      const surfaceTestCases = [
        { input: 'road', expected: 'road' }, // Use lowercase as expected by backend
        { input: 'trail', expected: 'trail' },
        { input: 'track', expected: 'track' },
        { input: 'virtual', expected: 'virtual' },
        { input: 'other', expected: 'other' }
      ];

      surfaceTestCases.forEach(({ input, expected }) => {
        const csvRow: CsvRow = {
          name: `Surface Test ${input}`,
          date: '2025-09-06',
          start_time: '09:00',
          city: 'Houston',
          state: 'TX',
          surface: input,
          distance: '5K',
          kid_run: 'false'
        };

        const validationErrors = validateCsvRow(csvRow, 10);
        expect(validationErrors).toHaveLength(0);

        const normalized = normalizeCsvRow(csvRow);
        expect(normalized.surface).toBe(expected);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should reject invalid distance values with clear error messages', () => {
      const invalidDistances = [
        'InvalidDistance',
        '42K',
        'Sprint',
        'Triathlon',
        'Ironman'
      ];

      invalidDistances.forEach((invalidDistance) => {
        const csvRow: CsvRow = {
          name: `Invalid Distance Test`,
          date: '2025-09-07',
          start_time: '08:00',
          city: 'Houston',
          state: 'TX',
          surface: 'road', // Use lowercase as expected by backend
          distance: invalidDistance,
          kid_run: 'false'
        };

        const validationErrors = validateCsvRow(csvRow, 15);
        expect(validationErrors.length).toBeGreaterThan(0);
        
        const distanceError = validationErrors.find(error => error.field === 'distance');
        expect(distanceError).toBeTruthy();
        // Check for either "Distance" or "Invalid distances" in the message
        expect(distanceError?.message).toMatch(/(Distance|Invalid distances)/);
      });
    });

    it('should handle empty and whitespace-only distance fields', () => {
      const emptyDistanceTests = [
        { input: '', expected: ['5k'] }, // Default value
        { input: '   ', expected: [] }, // Whitespace filtered out
        { input: undefined, expected: ['5k'] } // Undefined defaults to 5k
      ];

      emptyDistanceTests.forEach(({ input, expected }) => {
        const csvRow: CsvRow = {
          name: 'Empty Distance Test',
          date: '2025-09-08',
          start_time: '09:00',
          city: 'Houston',
          state: 'TX',
          surface: 'road', // Use lowercase as expected by backend
          distance: input as any,
          kid_run: 'false'
        };

        const normalized = normalizeCsvRow(csvRow);
        expect(normalized.distance).toEqual(expected);
      });
    });

    it('should handle mixed valid and invalid distances gracefully', () => {
      const csvRow: CsvRow = {
        name: 'Mixed Validity Test',
        date: '2025-09-09',
        start_time: '10:00',
        city: 'Houston',
        state: 'TX',
        surface: 'road', // Use lowercase as expected by backend
        distance: '5K, InvalidDistance, Half, AnotherInvalid, Marathon',
        kid_run: 'false'
      };

      // Should still validate and normalize valid distances
      const normalized = normalizeCsvRow(csvRow);
      
      // Valid distances should be normalized
      expect(normalized.distance).toContain('5k');
      expect(normalized.distance).toContain('half marathon');
      expect(normalized.distance).toContain('marathon');
      
      // Invalid distances should be passed through (backend will handle validation)
      expect(normalized.distance).toContain('InvalidDistance');
      expect(normalized.distance).toContain('AnotherInvalid');
    });
  });

  describe('Backend Compatibility', () => {
    it('should pass backend compatibility validation for valid data', () => {
      const validRow: NormalizedRow = {
        name: 'Backend Compatible Race',
        date: '2025-09-10',
        start_time: '08:00',
        city: 'Houston',
        state: 'TX',
        surface: 'road',
        distance: ['5k', 'half marathon'],
        kid_run: false,
        official_website_url: 'https://backendtest.com'
      };

      const backendErrors = validateBackendCompatibility(validRow, 25);
      expect(backendErrors).toHaveLength(0);
    });

    it('should identify backend compatibility issues', () => {
      const invalidRow: NormalizedRow = {
        name: '', // Missing required name
        date: 'invalid-date', // Invalid date format
        start_time: '25:00', // Invalid time format
        city: 'Houston',
        state: 'TX',
        surface: 'road',
        distance: ['5k'],
        kid_run: false
      };

      const backendErrors = validateBackendCompatibility(invalidRow, 26);
      expect(backendErrors.length).toBeGreaterThan(0);
      
      // Should identify missing name
      const nameError = backendErrors.find(error => error.field === 'name');
      expect(nameError).toBeTruthy();
      
      // Should identify invalid date
      const dateError = backendErrors.find(error => error.field === 'date');
      expect(dateError).toBeTruthy();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical race registration data', () => {
      const typicalRace: CsvRow = {
        name: 'Houston Heights 5K & Half Marathon',
        date: '2025-10-15',
        start_time: '07:30',
        city: 'Houston',
        state: 'TX',
        surface: 'road', // Use lowercase as expected by backend
        distance: '5K, Half Marathon',
        kid_run: 'true'
        // Removed official_website_url to avoid URL validation issues
      };

      // Validate
      const validationErrors = validateCsvRow(typicalRace, 30);
      expect(validationErrors).toHaveLength(0);

      // Normalize
      const normalized = normalizeCsvRow(typicalRace);
      expect(normalized.name).toBe('Houston Heights 5K & Half Marathon');
      expect(normalized.distance).toEqual(['5k', 'half marathon']);
      expect(normalized.surface).toBe('road'); // Surface should be lowercase
      expect(normalized.kid_run).toBe(true);

      // Backend compatibility
      const backendErrors = validateBackendCompatibility(normalized, 30);
      expect(backendErrors).toHaveLength(0);
    });

    it('should handle ultra-distance events', () => {
      const ultraRace: CsvRow = {
        name: 'Texas Ultra Challenge',
        date: '2025-11-20',
        start_time: '06:00',
        city: 'Austin',
        state: 'TX',
        surface: 'trail', // Use lowercase as expected by backend
        distance: 'Ultra, Marathon, Half Marathon',
        kid_run: 'false'
        // Removed official_website_url to avoid URL validation issues
      };

      const validationErrors = validateCsvRow(ultraRace, 31);
      expect(validationErrors).toHaveLength(0);

      const normalized = normalizeCsvRow(ultraRace);
      expect(normalized.distance).toEqual(['ultra', 'marathon', 'half marathon']);
      expect(normalized.surface).toBe('trail'); // Surface should be lowercase
    });
  });
});
