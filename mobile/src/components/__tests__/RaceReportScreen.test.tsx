import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RaceReportScreen from '../../screens/RaceReportScreen';

describe('RaceReportScreen', () => {
  const navigation: any = { goBack: jest.fn() };

  function renderWithReport(report: any) {
    return render(
      <RaceReportScreen navigation={navigation} route={{ params: { report } }} />
    );
  }

  it('renders title and metadata', () => {
    renderWithReport({
      id: 10,
      race_name: 'Sample Race',
      title: 'Report Title',
      author: 'Author A',
      content: 'Some content',
      content_md: 'MD content',
      created_at: '2025-02-01T00:00:00Z',
    });

    expect(screen.getByText('Report Title')).toBeTruthy();
    expect(screen.getByText('Race: Sample Race')).toBeTruthy();
    expect(screen.getByText('By: Author A')).toBeTruthy();
  });

  it('shows content, falling back to content_md when content is empty', () => {
    renderWithReport({
      id: 20,
      race_name: 'Another Race',
      title: 'Another Title',
      author: 'Author B',
      content: '   ',
      content_md: 'Markdown fallback content',
      created_at: '2025-02-02T00:00:00Z',
    });

    expect(screen.getByText('Markdown fallback content')).toBeTruthy();
  });
});


