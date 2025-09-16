/**
 * Smart Directions Utilities
 * Handles intelligent address processing and Google Maps integration
 */

export interface RaceLocation {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Intelligently constructs a full address for directions
 * Handles cases where address is just the city name
 */
export const buildDirectionsAddress = (race: RaceLocation): string => {
  const { address, city, state, zip } = race;
  
  // If address exists and is not just the city name, use full address
  if (address && address.trim() && address !== city) {
    const parts = [address.trim(), city, state, zip].filter(Boolean);
    return parts.join(', ');
  }
  
  // Fallback: Use city + state + zip for city-only addresses
  if (city && state) {
    const parts = [city.trim(), state.trim(), zip].filter(Boolean);
    return parts.join(', ');
  }
  
  // Last resort: Just city if that's all we have
  return city || 'Houston, TX';
};

/**
 * Generates Google Maps directions URL with intelligent address handling
 */
export const getGoogleMapsDirectionsUrl = (race: RaceLocation): string => {
  const destination = buildDirectionsAddress(race);
  const encodedDestination = encodeURIComponent(destination);
  
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`;
};

/**
 * Checks if a race has a valid address for directions
 */
export const hasValidAddress = (race: RaceLocation): boolean => {
  // Valid if we have city and state, regardless of address quality
  return !!(race.city && race.state);
};

/**
 * Gets user-friendly address text for display
 */
export const getDisplayAddress = (race: RaceLocation): string => {
  const { address, city, state } = race;
  
  // If address exists and is not just the city, show full address
  if (address && address.trim() && address !== city) {
    return [address.trim(), city, state].filter(Boolean).join(', ');
  }
  
  // Otherwise show city, state
  return [city, state].filter(Boolean).join(', ');
};

/**
 * Determines the confidence level of the address for directions
 */
export const getAddressConfidence = (race: RaceLocation): 'high' | 'medium' | 'low' => {
  const { address, city, state } = race;
  
  // High confidence: Full street address
  if (address && address.trim() && address !== city && address.length > 10) {
    return 'high';
  }
  
  // Medium confidence: City + state
  if (city && state) {
    return 'medium';
  }
  
  // Low confidence: Missing essential info
  return 'low';
};

/**
 * Gets appropriate button text based on address confidence
 */
export const getDirectionsButtonText = (_race: RaceLocation): string => {
  return 'Directions';
};

/**
 * Gets tooltip text explaining the directions accuracy
 */
export const getDirectionsTooltip = (race: RaceLocation): string => {
  const confidence = getAddressConfidence(race);
  
  switch (confidence) {
    case 'high':
      return 'Get precise directions to the race venue';
    case 'medium':
      return 'Get directions to the general area (exact venue location may vary)';
    case 'low':
      return 'Search for the race location (address details limited)';
    default:
      return 'Get directions to the race location';
  }
};
