import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { FilterSheet } from '../FilterSheet';
import { FilterState, Race } from '../../types';

// Mock the uniqueCities utility
jest.mock('../../utils/uniqueCities', () => ({
  uniqueCities: jest.fn(() => ['Houston', 'Austin', 'Dallas'])
}));

describe('FilterSheet', () => {
  const mockRaces: Race[] = [
    {
      id: 1,
      name: 'Test Race 1',
      date: '2025-09-01',
      distance: ['5k'],
      surface: 'road',
      city: 'Houston',
      state: 'TX'
    },
    {
      id: 2,
      name: 'Test Race 2',
      date: '2025-09-02',
      distance: ['half marathon'],
      surface: 'trail',
      city: 'Austin',
      state: 'TX'
    }
  ];

  const defaultFilters: FilterState = {
    preset: 'next30',
    distances: [],
    surface: [],
    useLocation: false,
    locationRadius: null,
    city: 'all'
  };

  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render distance filter options with standardized values', () => {
    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Check that all standardized distance options are displayed
    expect(screen.getByText('5k')).toBeTruthy();
    expect(screen.getByText('10k')).toBeTruthy();
    expect(screen.getByText('half marathon')).toBeTruthy();
    expect(screen.getByText('marathon')).toBeTruthy();
    expect(screen.getByText('ultra')).toBeTruthy();
    expect(screen.getByText('other')).toBeTruthy();
  });

  it('should handle distance filter selection correctly', () => {
    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Select a distance filter
    const distanceChip = screen.getByText('5k');
    fireEvent.press(distanceChip);

    // Apply filters
    const applyButton = screen.getByText('Show Results');
    fireEvent.press(applyButton);

    // Check that onApply was called with the selected distance
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        distances: ['5k']
      })
    );
  });

  it('should handle multiple distance selections', () => {
    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Select multiple distances
    fireEvent.press(screen.getByText('5k'));
    fireEvent.press(screen.getByText('half marathon'));
    fireEvent.press(screen.getByText('marathon'));

    // Apply filters
    fireEvent.press(screen.getByText('Show Results'));

    // Check that onApply was called with all selected distances
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        distances: ['5k', 'half marathon', 'marathon']
      })
    );
  });

  it('should toggle distance filters correctly', () => {
    const filtersWithDistance: FilterState = {
      ...defaultFilters,
      distances: ['5k', 'half marathon']
    };

    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={filtersWithDistance}
        races={mockRaces}
      />
    );

    // Initially selected distances should be highlighted
    expect(screen.getByText('5k')).toHaveStyle({ backgroundColor: expect.any(String) });
    expect(screen.getByText('half marathon')).toHaveStyle({ backgroundColor: expect.any(String) });

    // Deselect a distance
    fireEvent.press(screen.getByText('5k'));

    // Apply filters
    fireEvent.press(screen.getByText('Show Results'));

    // Check that only half marathon remains selected
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        distances: ['half marathon']
      })
    );
  });

  it('should clear all filters when reset is pressed', () => {
    const filtersWithSelections: FilterState = {
      ...defaultFilters,
      distances: ['5k', 'half marathon'],
      surface: ['road'],
      city: 'Houston'
    };

    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={filtersWithSelections}
        races={mockRaces}
      />
    );

    // Press reset button
    const resetButton = screen.getByText('Reset');
    fireEvent.press(resetButton);

    // Apply filters
    fireEvent.press(screen.getByText('Show Results'));

    // Check that all filters are cleared
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        distances: [],
        surface: [],
        city: 'all'
      })
    );
  });

  it('should display surface filter options correctly', () => {
    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Check that all surface options are displayed
    expect(screen.getByText('road')).toBeTruthy();
    expect(screen.getByText('trail')).toBeTruthy();
    expect(screen.getByText('track')).toBeTruthy();
  });

  it('should handle surface filter selection', () => {
    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Select a surface filter
    fireEvent.press(screen.getByText('trail'));

    // Apply filters
    fireEvent.press(screen.getByText('Show Results'));

    // Check that onApply was called with the selected surface
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: ['trail']
      })
    );
  });

  it('should close when close button is pressed', () => {
    render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Press close button
    const closeButton = screen.getByText('✕');
    fireEvent.press(closeButton);

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should sync with current filters when props change', () => {
    const { rerender } = render(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={defaultFilters}
        races={mockRaces}
      />
    );

    // Update filters
    const newFilters: FilterState = {
      ...defaultFilters,
      distances: ['marathon'],
      surface: ['road']
    };

    rerender(
      <FilterSheet
        visible={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
        currentFilters={newFilters}
        races={mockRaces}
      />
    );

    // Check that the new filters are reflected in the UI
    expect(screen.getByText('marathon')).toHaveStyle({ backgroundColor: expect.any(String) });
    expect(screen.getByText('road')).toHaveStyle({ backgroundColor: expect.any(String) });
  });
});
