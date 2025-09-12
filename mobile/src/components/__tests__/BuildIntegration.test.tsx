import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BuildIntegration } from '../BuildIntegration';

describe('BuildIntegration', () => {
  it('should render without crashing', () => {
    render(<BuildIntegration />);
    expect(screen.getByTestId('build-integration')).toBeTruthy();
  });

  it('should display integration status', () => {
    render(<BuildIntegration />);
    expect(screen.getByText('Build Integration')).toBeTruthy();
  });

  it('should handle integration steps', () => {
    const { rerender } = render(<BuildIntegration status="pending" />);
    expect(screen.getByText('Integration pending...')).toBeTruthy();

    rerender(<BuildIntegration status="in_progress" />);
    expect(screen.getByText('Integration in progress...')).toBeTruthy();

    rerender(<BuildIntegration status="completed" />);
    expect(screen.getByText('Integration completed')).toBeTruthy();
  });

  it('should handle integration errors', () => {
    render(<BuildIntegration status="error" error="Integration failed" />);
    expect(screen.getByText('Integration failed')).toBeTruthy();
  });
});
