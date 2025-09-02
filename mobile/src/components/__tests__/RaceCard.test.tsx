import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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
  const mockOnPressReport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render race information correctly', () => {
    const result = render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    // Basic smoke test - component renders without crashing
    expect(result).toBeDefined();
    expect(result.toJSON()).toBeTruthy();
    
    // Verify the component contains expected data
    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('Test Race');
    expect(json).toContain('123 Main St, Houston, TX, 77001');
    expect(json).toContain('Mon Sep 1, 2025');
    expect(json).toContain('8:00 AM');
  });

  it('should display distance badges with standardized values', () => {
    const result = render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    // Check that distance badges are displayed
    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('5k');
    expect(json).toContain('half marathon');
  });

  it('should handle single distance correctly', () => {
    const singleDistanceRace: RaceVM = {
      ...mockRace,
      distances: ['marathon']
    };

    const result = render(<RaceCard race={singleDistanceRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('marathon');
    // Should not show any other distance badges
    expect(json).not.toContain('5k');
    expect(json).not.toContain('half marathon');
  });

  it('should handle multiple distances correctly', () => {
    const multiDistanceRace: RaceVM = {
      ...mockRace,
      distances: ['5k', '10k', 'half marathon', 'marathon']
    };

    const result = render(<RaceCard race={multiDistanceRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('5k');
    expect(json).toContain('10k');
    expect(json).toContain('half marathon');
    expect(json).toContain('marathon');
  });

  it('should handle empty distances array', () => {
    const noDistanceRace: RaceVM = {
      ...mockRace,
      distances: []
    };

    const result = render(<RaceCard race={noDistanceRace} onPress={mockOnPress} />);

    // Should not show any distance badges
    const json = JSON.stringify(result.toJSON());
    expect(json).not.toContain('5k');
    expect(json).not.toContain('half marathon');
  });

  it('should display surface information correctly', () => {
    const result = render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    // Surface should be displayed (capitalized)
    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('Road');
  });

  it('should handle different surface types', () => {
    const trailRace: RaceVM = {
      ...mockRace,
      surface: 'trail'
    };

    const result = render(<RaceCard race={trailRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('Trail');
  });

  it('should display kid run indicator when applicable', () => {
    const kidRunRace: RaceVM = {
      ...mockRace,
      kidRun: true
    };

    const result = render(<RaceCard race={kidRunRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('Kids');
  });

  it('should not display kid run indicator when not applicable', () => {
    const result = render(<RaceCard race={mockRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).not.toContain('Kids');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalRace: RaceVM = {
      id: 2,
      name: 'Minimal Race',
      dateISO: '2025-09-02',
      distances: ['5k']
    };

    const result = render(<RaceCard race={minimalRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('Minimal Race');
    expect(json).toContain('Tue Sep 2, 2025');
    expect(json).toContain('5k');
    
    // Optional fields should not cause errors
    expect(json).not.toContain('undefined');
  });

  it('should format date correctly', () => {
    const differentDateRace: RaceVM = {
      ...mockRace,
      dateISO: '2025-12-25'
    };

    const result = render(<RaceCard race={differentDateRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('Thu Dec 25, 2025');
  });

  it('should format time correctly', () => {
    const differentTimeRace: RaceVM = {
      ...mockRace,
      startTime: '14:30'
    };

    const result = render(<RaceCard race={differentTimeRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('2:30 PM');
  });

  it('should handle 24-hour time format', () => {
    const midnightRace: RaceVM = {
      ...mockRace,
      startTime: '00:00'
    };

    const result = render(<RaceCard race={midnightRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('12:00 AM');
  });

  it('should handle noon time correctly', () => {
    const noonRace: RaceVM = {
      ...mockRace,
      startTime: '12:00'
    };

    const result = render(<RaceCard race={noonRace} onPress={mockOnPress} />);

    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('12:00 PM');
  });

  it('should display all standardized distance values correctly', () => {
    const allDistancesRace: RaceVM = {
      ...mockRace,
      distances: ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']
    };

    const result = render(<RaceCard race={allDistancesRace} onPress={mockOnPress} />);

    // All standardized distance values should be displayed
    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('5k');
    expect(json).toContain('10k');
    expect(json).toContain('half marathon');
    expect(json).toContain('marathon');
    expect(json).toContain('ultra');
    expect(json).toContain('other');
  });

  it('should handle edge case distances gracefully', () => {
    const edgeCaseRace: RaceVM = {
      ...mockRace,
      distances: ['5k', 'invalid_distance', 'marathon']
    };

    const result = render(<RaceCard race={edgeCaseRace} onPress={mockOnPress} />);

    // Valid distances should still display
    const json = JSON.stringify(result.toJSON());
    expect(json).toContain('5k');
    expect(json).toContain('marathon');
    
    // Invalid distance should still be rendered (no filtering in component)
    expect(json).toContain('invalid_distance');
  });

  describe('Race Report Button', () => {
    it('should show Race Report button when hasReport is true', () => {
      const result = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          hasReport={true}
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).toContain('Race Report');
    });

    it('should not show Race Report button when hasReport is false', () => {
      const result = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          hasReport={false}
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).not.toContain('Race Report');
    });

    it('should not show Race Report button when hasReport is undefined', () => {
      const result = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).not.toContain('Race Report');
    });

    it('should call onPressReport when Race Report button is pressed', () => {
      const { getByLabelText } = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          hasReport={true}
          onPressReport={mockOnPressReport}
        />
      );

      const reportButton = getByLabelText('Open race report');
      fireEvent.press(reportButton);

      expect(mockOnPressReport).toHaveBeenCalledTimes(1);
    });

    it('should show both Open and Race Report buttons when both are available', () => {
      const result = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          hasReport={true}
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).toContain('Open ↗');
      expect(json).toContain('Race Report');
    });

    it('should show only Open button when no report is available', () => {
      const result = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          hasReport={false}
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).toContain('Open ↗');
      expect(json).not.toContain('Race Report');
    });

    it('should show only Race Report button when no URL is available', () => {
      const raceWithoutUrl: RaceVM = {
        ...mockRace,
        url: undefined
      };

      const result = render(
        <RaceCard 
          race={raceWithoutUrl} 
          onPress={mockOnPress} 
          hasReport={true}
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).not.toContain('Open ↗');
      expect(json).toContain('Race Report');
    });

    it('should show neither button when no URL and no report', () => {
      const raceWithoutUrl: RaceVM = {
        ...mockRace,
        url: undefined
      };

      const result = render(
        <RaceCard 
          race={raceWithoutUrl} 
          onPress={mockOnPress} 
          hasReport={false}
          onPressReport={mockOnPressReport}
        />
      );

      const json = JSON.stringify(result.toJSON());
      expect(json).not.toContain('Open ↗');
      expect(json).not.toContain('Race Report');
    });

    it('should have proper accessibility label for Race Report button', () => {
      const { getByLabelText } = render(
        <RaceCard 
          race={mockRace} 
          onPress={mockOnPress} 
          hasReport={true}
          onPressReport={mockOnPressReport}
        />
      );

      expect(getByLabelText('Open race report')).toBeTruthy();
    });
  });
});
