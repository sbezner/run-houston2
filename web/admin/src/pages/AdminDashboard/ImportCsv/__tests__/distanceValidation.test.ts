import { validateDistance, parseDistances } from '../validation';

describe('Distance Validation', () => {
  describe('validateDistance', () => {
    it('should accept valid 5K variations', () => {
      expect(validateDistance('5K')).toBeNull();
      expect(validateDistance('5k')).toBeNull();
      expect(validateDistance('5 K')).toBeNull();
      expect(validateDistance('5 k')).toBeNull();
    });

    it('should accept valid 10K variations', () => {
      expect(validateDistance('10K')).toBeNull();
      expect(validateDistance('10k')).toBeNull();
      expect(validateDistance('10 K')).toBeNull();
      expect(validateDistance('10 k')).toBeNull();
    });

    it('should accept valid Half Marathon variations', () => {
      expect(validateDistance('Half')).toBeNull();
      expect(validateDistance('Half Marathon')).toBeNull();
      expect(validateDistance('HALF')).toBeNull();
      expect(validateDistance('half')).toBeNull();
      expect(validateDistance('half marathon')).toBeNull();
      expect(validateDistance('Half marathon')).toBeNull();
    });

    it('should accept valid Marathon variations', () => {
      expect(validateDistance('Full')).toBeNull();
      expect(validateDistance('Marathon')).toBeNull();
      expect(validateDistance('FULL')).toBeNull();
      expect(validateDistance('full')).toBeNull();
      expect(validateDistance('marathon')).toBeNull();
    });

    it('should accept valid Ultra variations', () => {
      expect(validateDistance('Ultra')).toBeNull();
      expect(validateDistance('ultra')).toBeNull();
      expect(validateDistance('ULTRA')).toBeNull();
    });

    it('should accept valid Kids/Other variations', () => {
      expect(validateDistance('Kids')).toBeNull();
      expect(validateDistance('kids')).toBeNull();
      expect(validateDistance('KIDS')).toBeNull();
      expect(validateDistance('Kid Run')).toBeNull();
      expect(validateDistance('kid run')).toBeNull();
      expect(validateDistance('Other')).toBeNull();
      expect(validateDistance('other')).toBeNull();
    });

    it('should reject invalid distance values', () => {
      expect(validateDistance('invalid')).toContain('Distance "invalid" must be one of:');
      expect(validateDistance('42K')).toContain('Distance "42K" must be one of:');
      expect(validateDistance('Sprint')).toContain('Distance "Sprint" must be one of:');
      expect(validateDistance('')).toContain('Distance "" must be one of:');
    });

    it('should handle case sensitivity correctly', () => {
      expect(validateDistance('HALF')).toBeNull();
      expect(validateDistance('half')).toBeNull();
      expect(validateDistance('Half')).toBeNull();
      expect(validateDistance('FULL')).toBeNull();
      expect(validateDistance('full')).toBeNull();
      expect(validateDistance('Full')).toBeNull();
    });

    it('should reject whitespace-only inputs', () => {
      expect(validateDistance(' 5K ')).toContain('Distance " 5K " must be one of:');
      expect(validateDistance('Half Marathon')).toBeNull(); // This one works
      expect(validateDistance('  Full  ')).toContain('Distance "  Full  " must be one of:');
    });
  });

  describe('parseDistances', () => {
    it('should return default distance for empty input', () => {
      expect(parseDistances('')).toEqual(['5k']);
      expect(parseDistances(undefined as any)).toEqual(['5k']);
    });

    it('should parse single distance correctly', () => {
      expect(parseDistances('5K')).toEqual(['5k']);
      expect(parseDistances('Half')).toEqual(['half marathon']);
      expect(parseDistances('Full')).toEqual(['marathon']);
      expect(parseDistances('Ultra')).toEqual(['ultra']);
      expect(parseDistances('Kids')).toEqual(['other']);
    });

    it('should parse multiple distances correctly', () => {
      expect(parseDistances('5K,10K')).toEqual(['5k', '10k']);
      expect(parseDistances('Half,Full')).toEqual(['half marathon', 'marathon']);
      expect(parseDistances('5k, half marathon, marathon')).toEqual(['5k', 'half marathon', 'marathon']);
    });

    it('should handle mixed case variations', () => {
      expect(parseDistances('5K, HALF, FULL')).toEqual(['5k', 'half marathon', 'marathon']);
      expect(parseDistances('ultra, KIDS')).toEqual(['ultra', 'other']);
      expect(parseDistances('Marathon, 10K')).toEqual(['marathon', '10k']);
    });

    it('should normalize all variations to standardized values', () => {
      const input = '5K, Half Marathon, Full, Ultra, Kids';
      const expected = ['5k', 'half marathon', 'marathon', 'ultra', 'other'];
      expect(parseDistances(input)).toEqual(expected);
    });

    it('should handle whitespace in comma-separated values', () => {
      expect(parseDistances(' 5K , 10K ')).toEqual(['5k', '10k']);
      expect(parseDistances('Half, Full, Ultra')).toEqual(['half marathon', 'marathon', 'ultra']);
    });

    it('should filter out empty values', () => {
      expect(parseDistances('5K,,10K')).toEqual(['5k', '10k']);
      expect(parseDistances('Half, , Full')).toEqual(['half marathon', 'marathon']);
    });

    it('should handle edge cases gracefully', () => {
      expect(parseDistances('5K,invalid,10K')).toEqual(['5k', 'invalid', '10k']);
      expect(parseDistances('')).toEqual(['5k']);
      expect(parseDistances('   ')).toEqual([]); // Whitespace-only strings are filtered out
    });
  });

  describe('Integration Tests', () => {
    it('should validate and parse consistently', () => {
      const testCases = [
        '5K', '10K', 'Half', 'Full', 'Ultra', 'Kids',
        '5k', '10k', 'half', 'full', 'ultra', 'kids',
        '5 K', '10 K', 'Half Marathon', 'Marathon', 'Kid Run'
      ];

      testCases.forEach(input => {
        // If validation passes, parsing should work
        const validationResult = validateDistance(input);
        if (validationResult === null) {
          const parsed = parseDistances(input);
          expect(parsed.length).toBeGreaterThan(0);
          expect(parsed[0]).toBeTruthy();
        }
      });
    });

    it('should handle real-world CSV scenarios', () => {
      // Simulate CSV row with mixed case distances
      const csvRow = '5K, Half Marathon, Full, Ultra';
      const parsed = parseDistances(csvRow);
      const expected = ['5k', 'half marathon', 'marathon', 'ultra'];
      
      expect(parsed).toEqual(expected);
      
      // Each parsed distance should pass validation
      parsed.forEach(distance => {
        expect(validateDistance(distance)).toBeNull();
      });
    });
  });
});
