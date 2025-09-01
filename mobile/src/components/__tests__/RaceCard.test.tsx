import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RaceCard } from '../RaceCard';
import { RaceVM } from '../../types';

describe('RaceCard', () => {
  const mockRace: RaceVM = {
    id: 1,
    name: 'Test Race',
    dateISO: '2025-09-01',
    startTime: '08:00',
    city: 'Houston',
    state: 'TX',
    surface: 'road',
    distances: ['5k', 'half marathon'],
    url: 'https://testrace.com',
    latitude: 29.7604,
    longitude: -95.3698,
    kidRun: false
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render race information correctly', () => {
    render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    expect(screen.getByText('Test Race')).toBeTruthy();
    expect(screen.getByText('Houston, TX')).toBeTruthy();
    expect(screen.getByText('Mon Sep 1, 2025')).toBeTruthy();
    expect(screen.getByText('8:00 AM')).toBeTruthy();
  });

  it('should display distance badges with standardized values', () => {
    render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    // Check that distance badges are displayed
    expect(screen.getByText('5k')).toBeTruthy();
    expect(screen.getByText('half marathon')).toBeTruthy();
  });

  it('should handle single distance correctly', () => {
    const singleDistanceRace: RaceVM = {
      ...mockRace,
      distances: ['marathon']
    };

    render(<RaceCard race={singleDistanceRace} onPress={mockOnPress} />);

    expect(screen.getByText('marathon')).toBeTruthy();
    // Should not show any other distance badges
    expect(screen.queryByText('5k')).toBeFalsy();
    expect(screen.queryByText('half marathon')).toBeFalsy();
  });

  it('should handle multiple distances correctly', () => {
    const multiDistanceRace: RaceVM = {
      ...mockRace,
      distances: ['5k', '10k', 'half marathon', 'marathon']
    };

    render(<RaceCard race={multiDistanceRace} onPress={mockOnPress} />);

    expect(screen.getByText('5k')).toBeTruthy();
    expect(screen.getByText('10k')).toBeTruthy();
    expect(screen.getByText('half marathon')).toBeTruthy();
    expect(screen.getByText('marathon')).toBeTruthy();
  });

  it('should handle empty distances array', () => {
    const noDistanceRace: RaceVM = {
      ...mockRace,
      distances: []
    };

    render(<RaceCard race={noDistanceRace} onPress={mockOnPress} />);

    // Should not show any distance badges
    expect(screen.queryByText('5k')).toBeFalsy();
    expect(screen.queryByText('half marathon')).toBeFalsy();
  });

  it('should display surface information correctly', () => {
    render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    // Surface should be displayed (capitalized)
    expect(screen.getByText('Road')).toBeTruthy();
  });

  it('should handle different surface types', () => {
    const trailRace: RaceVM = {
      ...mockRace,
      surface: 'trail'
    };

    render(<RaceCard race={trailRace} onPress={mockOnPress} />);

    expect(screen.getByText('Trail')).toBeTruthy();
  });

  it('should display kid run indicator when applicable', () => {
    const kidRunRace: RaceVM = {
      ...mockRace,
      kidRun: true
    };

    render(<RaceCard race={kidRunRace} onPress={mockOnPress} />);

    expect(screen.getByText('Kids')).toBeTruthy();
  });

  it('should not display kid run indicator when not applicable', () => {
    render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    expect(screen.queryByText('Kids')).toBeFalsy();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalRace: RaceVM = {
      id: 2,
      name: 'Minimal Race',
      dateISO: '2025-09-02',
      distances: ['5k']
    };

    render(<RaceCard race={minimalRace} onPress={mockOnPress} />);

    expect(screen.getByText('Minimal Race')).toBeTruthy();
    expect(screen.getByText('Tue Sep 2, 2025')).toBeTruthy();
    expect(screen.getByText('5k')).toBeTruthy();
    
    // Optional fields should not cause errors
    expect(screen.queryByText('undefined')).toBeFalsy();
  });

  it('should format date correctly', () => {
    const differentDateRace: RaceVM = {
      ...mockRace,
      dateISO: '2025-12-25'
    };

    render(<RaceCard race={differentDateRace} onPress={mockOnPress} />);

    expect(screen.getByText('Thu Dec 25, 2025')).toBeTruthy();
  });

  it('should format time correctly', () => {
    const differentTimeRace: RaceVM = {
      ...mockRace,
      startTime: '14:30'
    };

    render(<RaceCard race={differentTimeRace} onPress={mockOnPress} />);

    expect(screen.getByText('2:30 PM')).toBeTruthy();
  });

  it('should handle 24-hour time format', () => {
    const midnightRace: RaceVM = {
      ...mockRace,
      startTime: '00:00'
    };

    render(<RaceCard race={midnightRace} onPress={mockOnPress} />);

    expect(screen.getByText('12:00 AM')).toBeTruthy();
  });

  it('should handle noon time correctly', () => {
    const noonRace: RaceVM = {
      ...mockRace,
      startTime: '12:00'
    };

    render(<RaceCard race={noonRace} onPress={mockOnPress} />);

    expect(screen.getByText('12:00 PM')).toBeTruthy();
  });

  it('should display all standardized distance values correctly', () => {
    const allDistancesRace: RaceVM = {
      ...mockRace,
      distances: ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']
    };

    render(<RaceCard race={allDistancesRace} onPress={mockOnPress} />);

    // All standardized distance values should be displayed
    expect(screen.getByText('5k')).toBeTruthy();
    expect(screen.getByText('10k')).toBeTruthy();
    expect(screen.getByText('half marathon')).toBeTruthy();
    expect(screen.getByText('marathon')).toBeTruthy();
    expect(screen.getByText('ultra')).toBeTruthy();
    expect(screen.getByText('other')).toBeTruthy();
  });

  it('should handle edge case distances gracefully', () => {
    const edgeCaseRace: RaceVM = {
      ...mockRace,
      distances: ['5k', 'invalid_distance', 'marathon']
    };

    render(<RaceCard race={edgeCaseRace} onPress={mockOnPress} />);

    // Valid distances should still display
    expect(screen.getByText('5k')).toBeTruthy();
    expect(screen.getByText('marathon')).toBeTruthy();
    
    // Invalid distance should not cause errors
    expect(screen.queryByText('invalid_distance')).toBeFalsy();
  });
});
