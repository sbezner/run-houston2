import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity, Text } from 'react-native';
import DateSheet from '../DateSheet';
import { DateFilterProvider } from '../../state/dateFilter';

// Mock the FixedDatePicker component
jest.mock('../FixedDatePicker', () => {
  return function MockFixedDatePicker({ visible, onConfirm, onCancel }: any) {
    if (!visible) return null;
    return (
      <View testID="fixed-date-picker">
        <TouchableOpacity onPress={onCancel}><Text>Cancel</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onConfirm(new Date('2024-01-15'))}><Text>Confirm</Text></TouchableOpacity>
      </View>
    );
  };
});

describe('DateSheet', () => {
  const mockOnClose = jest.fn();

  const renderWithProvider = (props: any) => {
    return render(
      <DateFilterProvider>
        <DateSheet {...props} />
      </DateFilterProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText, getByTestId } = renderWithProvider({
      visible: true,
      onClose: mockOnClose,
    });

    expect(getByText('Select Date Range')).toBeTruthy();
    expect(getByText('Quick Select')).toBeTruthy();
    expect(getByText('Custom Range')).toBeTruthy();
    expect(getByText('All Dates')).toBeTruthy();
    expect(getByText('This Weekend')).toBeTruthy();
    expect(getByText('Next 30 Days')).toBeTruthy();
    expect(getByText('Next 90 Days')).toBeTruthy();
    expect(getByText('Last 90 Days')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = renderWithProvider({
      visible: false,
      onClose: mockOnClose,
    });

    expect(queryByText('Select Date Range')).toBeNull();
  });

  it('shows pending changes hint when draft differs from applied', () => {
    const { getByText } = renderWithProvider({
      visible: true,
      onClose: mockOnClose,
    });

    // The hint should appear when there are pending changes
    // This will depend on the initial state and any user interactions
    expect(getByText('Changes pending')).toBeTruthy();
  });

  it('has correct action buttons', () => {
    const { getByText } = renderWithProvider({
      visible: true,
      onClose: mockOnClose,
    });

    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Apply Filter')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = renderWithProvider({
      visible: true,
      onClose: mockOnClose,
    });

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
