import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BuildProcess } from '../BuildProcess';

describe('BuildProcess', () => {
  it('should render without crashing', () => {
    render(<BuildProcess />);
    expect(screen.getByTestId('build-process')).toBeTruthy();
  });

  it('should display build information', () => {
    render(<BuildProcess />);
    expect(screen.getByText('Build Process')).toBeTruthy();
  });

  it('should handle build status updates', () => {
    const { rerender } = render(<BuildProcess status="building" />);
    expect(screen.getByText('Building...')).toBeTruthy();

    rerender(<BuildProcess status="completed" />);
    expect(screen.getByText('Build completed')).toBeTruthy();
  });
});
