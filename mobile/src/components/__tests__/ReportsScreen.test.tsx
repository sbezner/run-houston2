import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ReportsScreen } from '../../screens/ReportsScreen';

jest.mock('../../api', () => ({
  fetchRaceReports: jest.fn(),
}));

describe('ReportsScreen', () => {
  const { fetchRaceReports } = require('../../api');

  const navigation: any = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeReport(overrides: Partial<any> = {}) {
    return {
      id: 1,
      race_id: 10,
      race_name: 'Sample Race',
      title: 'My Report',
      author: 'Author A',
      content: 'Plain content',
      content_md: 'Markdown content',
      url: undefined,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      ...overrides,
    };
  }

  it('navigates to RaceReport with the tapped report', async () => {
    (fetchRaceReports as jest.Mock).mockResolvedValue({
      items: [makeReport({ id: 123 })],
      total: 1,
      limit: 20,
      offset: 0,
    });

    render(<ReportsScreen navigation={navigation} />);

    const item = await screen.findByTestId('report-item-123');
    fireEvent.press(item);

    expect(navigation.navigate).toHaveBeenCalledWith('RaceReport', {
      report: expect.objectContaining({ id: 123 }),
    });
  });

  it('shows content preview with fallback to content_md', async () => {
    (fetchRaceReports as jest.Mock).mockResolvedValue({
      items: [
        makeReport({ id: 1, content: 'Primary content', content_md: 'MD A' }),
        makeReport({ id: 2, content: '   ', content_md: 'Fallback MD content' }),
      ],
      total: 2,
      limit: 20,
      offset: 0,
    });

    render(<ReportsScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByTestId('report-item-1')).toBeTruthy();
      expect(screen.getByTestId('report-item-2')).toBeTruthy();
    });

    expect(screen.getByText('Primary content')).toBeTruthy();
    expect(screen.getByText('Fallback MD content')).toBeTruthy();
  });

  describe('Race Filtering', () => {
    it('should show race name header when race_id is provided', async () => {
      (fetchRaceReports as jest.Mock).mockResolvedValue({
        items: [makeReport({ race_id: 7, race_name: 'Montgomery County 5K' })],
        total: 1,
        limit: 20,
        offset: 0,
      });

      const route = {
        params: {
          race_id: 7,
          race_name: 'Montgomery County 5K'
        }
      };

      render(<ReportsScreen navigation={navigation} route={route} />);

      await waitFor(() => {
        expect(screen.getByText('Reports for: Montgomery County 5K')).toBeTruthy();
      });
    });

    it('should not show race name header when no race_id is provided', async () => {
      (fetchRaceReports as jest.Mock).mockResolvedValue({
        items: [makeReport()],
        total: 1,
        limit: 20,
        offset: 0,
      });

      render(<ReportsScreen navigation={navigation} />);

      await waitFor(() => {
        expect(screen.getByTestId('report-item-1')).toBeTruthy();
      });

      expect(screen.queryByText(/Reports for:/)).toBeFalsy();
    });

    it('should fetch reports filtered by race_id when provided', async () => {
      (fetchRaceReports as jest.Mock).mockResolvedValue({
        items: [makeReport({ race_id: 7 })],
        total: 1,
        limit: 20,
        offset: 0,
      });

      const route = {
        params: {
          race_id: 7,
          race_name: 'Test Race'
        }
      };

      render(<ReportsScreen navigation={navigation} route={route} />);

      await waitFor(() => {
        expect(fetchRaceReports).toHaveBeenCalledWith({
          limit: 20,
          offset: 0,
          race_id: 7,
        });
      });
    });

    it('should fetch all reports when no race_id is provided', async () => {
      (fetchRaceReports as jest.Mock).mockResolvedValue({
        items: [makeReport()],
        total: 1,
        limit: 20,
        offset: 0,
      });

      render(<ReportsScreen navigation={navigation} />);

      await waitFor(() => {
        expect(fetchRaceReports).toHaveBeenCalledWith({
          limit: 20,
          offset: 0,
          race_id: undefined,
        });
      });
    });

    it('should reload reports when race_id changes', async () => {
      (fetchRaceReports as jest.Mock).mockResolvedValue({
        items: [makeReport()],
        total: 1,
        limit: 20,
        offset: 0,
      });

      const { rerender } = render(<ReportsScreen navigation={navigation} />);

      await waitFor(() => {
        expect(fetchRaceReports).toHaveBeenCalledTimes(1);
      });

      const newRoute = {
        params: {
          race_id: 8,
          race_name: 'New Race'
        }
      };

      rerender(<ReportsScreen navigation={navigation} route={newRoute} />);

      await waitFor(() => {
        expect(fetchRaceReports).toHaveBeenCalledTimes(2);
        expect(fetchRaceReports).toHaveBeenLastCalledWith({
          limit: 20,
          offset: 0,
          race_id: 8,
        });
      });
    });
  });
});


