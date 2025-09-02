import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RacePopup } from '../RacePopup';
import { Linking } from 'react-native';

// Mock Linking
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Linking: {
      openURL: jest.fn(),
    },
  };
});

const mockOnClose = jest.fn();
const mockOnPressReport = jest.fn();

const mockUserLocation = { lat: 29.7604, lng: -95.3698 }; // Houston coordinates

const mockRace = {
  id: '1',
  name: 'Test Race 5K',
  dateISO: '2025-08-15T00:00:00.000Z',
  startTime: '08:00',
  city: 'Houston',
  state: 'TX',
  address: '123 Main St',
  zip: '77001',
  latitude: 29.7633,
  longitude: -95.3819,
  distances: ['5K'],
  surface: 'road',
  kidRun: true,
  url: 'https://example.com/race',
};

describe('RacePopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders race information correctly', () => {
    const { getByText } = render(
      <RacePopup race={mockRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(getByText('Test Race 5K')).toBeTruthy();
    expect(getByText(/Fri Aug 15, 2025/)).toBeTruthy();
    expect(getByText(/8:00 AM/)).toBeTruthy();
    expect(getByText('123 Main St, Houston, TX, 77001')).toBeTruthy();
    expect(getByText(/5\.2 mi away/)).toBeTruthy();
    expect(getByText('5K')).toBeTruthy();
    expect(getByText('Road')).toBeTruthy();
    expect(getByText('Kids')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(
      <RacePopup race={mockRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    const closeButton = getByText('✕');
    fireEvent.press(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders Open button when race has URL', () => {
    const { getByText } = render(
      <RacePopup race={mockRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(getByText('Open ↗')).toBeTruthy();
  });

  it('renders Race Report button when hasReport is true', () => {
    const { getByText } = render(
      <RacePopup 
        race={mockRace} 
        onClose={mockOnClose} 
        hasReport={true}
        onPressReport={mockOnPressReport}
        userLocation={mockUserLocation} 
      />
    );
    
    expect(getByText('Race Report')).toBeTruthy();
  });

  it('does not render Race Report button when hasReport is false', () => {
    const { queryByText } = render(
      <RacePopup 
        race={mockRace} 
        onClose={mockOnClose} 
        hasReport={false}
        userLocation={mockUserLocation} 
      />
    );
    
    expect(queryByText('Race Report')).toBeNull();
  });

  it('calls onPressReport when Race Report button is pressed', () => {
    const { getByText } = render(
      <RacePopup 
        race={mockRace} 
        onClose={mockOnClose} 
        hasReport={true}
        onPressReport={mockOnPressReport}
        userLocation={mockUserLocation} 
      />
    );
    
    const reportButton = getByText('Race Report');
    fireEvent.press(reportButton);
    
    expect(mockOnPressReport).toHaveBeenCalledTimes(1);
  });

  it('opens website when Open button is pressed', async () => {
    const { getByText } = render(
      <RacePopup race={mockRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    const openButton = getByText('Open ↗');
    fireEvent.press(openButton);
    
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/race');
    });
  });

  it('opens directions when Directions button is pressed', async () => {
    const { getByText } = render(
      <RacePopup race={mockRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    const directionsButton = getByText('Directions');
    fireEvent.press(directionsButton);
    
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('comgooglemaps://?daddr=29.7633,-95.3819&directionsmode=driving');
    });
  });

  it('handles missing address gracefully', () => {
    const raceWithoutAddress = { ...mockRace, address: null, zip: null };
    const { getByText, queryByText } = render(
      <RacePopup race={raceWithoutAddress} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(getByText('Test Race 5K')).toBeTruthy();
    expect(getByText(/Fri Aug 15, 2025/)).toBeTruthy();
    expect(queryByText('123 Main St, Houston, TX, 77001')).toBeNull();
  });

  it('handles missing start time gracefully', () => {
    const raceWithoutTime = { ...mockRace, startTime: null };
    const { getByText, queryByText } = render(
      <RacePopup race={raceWithoutTime} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(getByText(/Fri Aug 15, 2025/)).toBeTruthy();
    expect(queryByText(/8:00 AM/)).toBeNull();
  });

  it('handles missing user location gracefully', () => {
    const { queryByText } = render(
      <RacePopup race={mockRace} onClose={mockOnClose} userLocation={null} />
    );
    
    expect(queryByText(/mi away/)).toBeNull();
    expect(queryByText('Directions')).toBeNull();
  });

  it('renders different surface badges correctly', () => {
    const trailRace = { ...mockRace, surface: 'trail' };
    const { getByText } = render(
      <RacePopup race={trailRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(getByText('Trail')).toBeTruthy();
  });

  it('renders multiple distance badges correctly', () => {
    const multiDistanceRace = { ...mockRace, distances: ['5K', '10K', 'Half Marathon'] };
    const { getByText } = render(
      <RacePopup race={multiDistanceRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(getByText('5K')).toBeTruthy();
    expect(getByText('10K')).toBeTruthy();
    expect(getByText('Half Marathon')).toBeTruthy();
  });

  it('does not render kids badge when kidRun is false', () => {
    const adultOnlyRace = { ...mockRace, kidRun: false };
    const { queryByText } = render(
      <RacePopup race={adultOnlyRace} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(queryByText('Kids')).toBeNull();
  });

  it('does not render surface badge when surface is null', () => {
    const raceWithoutSurface = { ...mockRace, surface: null };
    const { queryByText } = render(
      <RacePopup race={raceWithoutSurface} onClose={mockOnClose} userLocation={mockUserLocation} />
    );
    
    expect(queryByText('Road')).toBeNull();
  });
});
