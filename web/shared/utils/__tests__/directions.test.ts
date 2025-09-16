/**
 * Tests for directions utilities
 */

import {
  buildDirectionsAddress,
  getGoogleMapsDirectionsUrl,
  hasValidAddress,
  getDisplayAddress,
  getAddressConfidence,
  getDirectionsButtonText,
  getDirectionsTooltip,
  type RaceLocation
} from '../directions';

describe('Directions Utilities', () => {
  const mockRaceWithFullAddress: RaceLocation = {
    address: '500 Collins St',
    city: 'Conroe',
    state: 'TX',
    zip: '77301'
  };

  const mockRaceWithCityOnly: RaceLocation = {
    address: 'Conroe',
    city: 'Conroe',
    state: 'TX',
    zip: '77301'
  };

  const mockRaceMinimal: RaceLocation = {
    city: 'Houston',
    state: 'TX'
  };

  describe('buildDirectionsAddress', () => {
    it('should build full address when address is different from city', () => {
      const result = buildDirectionsAddress(mockRaceWithFullAddress);
      expect(result).toBe('500 Collins St, Conroe, TX, 77301');
    });

    it('should use city+state when address equals city', () => {
      const result = buildDirectionsAddress(mockRaceWithCityOnly);
      expect(result).toBe('Conroe, TX, 77301');
    });

    it('should handle minimal address info', () => {
      const result = buildDirectionsAddress(mockRaceMinimal);
      expect(result).toBe('Houston, TX');
    });
  });

  describe('getGoogleMapsDirectionsUrl', () => {
    it('should generate correct Google Maps URL', () => {
      const result = getGoogleMapsDirectionsUrl(mockRaceWithFullAddress);
      expect(result).toContain('https://www.google.com/maps/dir/?api=1&destination=');
      expect(result).toContain('500%20Collins%20St%2C%20Conroe%2C%20TX%2C%2077301');
    });
  });

  describe('hasValidAddress', () => {
    it('should return true for races with city and state', () => {
      expect(hasValidAddress(mockRaceWithFullAddress)).toBe(true);
      expect(hasValidAddress(mockRaceWithCityOnly)).toBe(true);
      expect(hasValidAddress(mockRaceMinimal)).toBe(true);
    });

    it('should return false for races without city or state', () => {
      const invalidRace: RaceLocation = { city: 'Houston' };
      expect(hasValidAddress(invalidRace)).toBe(false);
    });
  });

  describe('getDisplayAddress', () => {
    it('should show full address when available', () => {
      const result = getDisplayAddress(mockRaceWithFullAddress);
      expect(result).toBe('500 Collins St, Conroe, TX');
    });

    it('should show city, state when address equals city', () => {
      const result = getDisplayAddress(mockRaceWithCityOnly);
      expect(result).toBe('Conroe, TX');
    });
  });

  describe('getAddressConfidence', () => {
    it('should return high confidence for full street addresses', () => {
      expect(getAddressConfidence(mockRaceWithFullAddress)).toBe('high');
    });

    it('should return medium confidence for city-only addresses', () => {
      expect(getAddressConfidence(mockRaceWithCityOnly)).toBe('medium');
    });

    it('should return medium confidence for minimal addresses', () => {
      expect(getAddressConfidence(mockRaceMinimal)).toBe('medium');
    });
  });

  describe('getDirectionsButtonText', () => {
    it('should return appropriate button text based on confidence', () => {
      expect(getDirectionsButtonText(mockRaceWithFullAddress)).toBe('Get Directions');
      expect(getDirectionsButtonText(mockRaceWithCityOnly)).toBe('Directions to Area');
      expect(getDirectionsButtonText(mockRaceMinimal)).toBe('Directions to Area');
    });
  });

  describe('getDirectionsTooltip', () => {
    it('should return appropriate tooltip based on confidence', () => {
      expect(getDirectionsTooltip(mockRaceWithFullAddress)).toContain('precise directions');
      expect(getDirectionsTooltip(mockRaceWithCityOnly)).toContain('general area');
      expect(getDirectionsTooltip(mockRaceMinimal)).toContain('general area');
    });
  });
});
