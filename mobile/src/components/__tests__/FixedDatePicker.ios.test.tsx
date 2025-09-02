import React from 'react';
import { Platform, TouchableOpacity, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import FixedDatePicker from '../../components/FixedDatePicker';

// Mock Platform to iOS
jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');

// Mock community datetime picker since we only need change/confirm behavior
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ onChange }: any) => (
    <TouchableOpacity accessibilityLabel="RNDateTimePicker" onPress={() => onChange?.(null, new Date(2025, 0, 15))}>
      <Text>picker</Text>
    </TouchableOpacity>
  );
});

describe('FixedDatePicker (iOS)', () => {
  test('invokes onConfirm with a Date when confirmed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByLabelText, getByText } = render(
      <FixedDatePicker
        visible
        mode="date"
        initial={new Date(2025, 0, 1)}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Select Date"
      />
    );

    // simulate change via mocked picker
    fireEvent.press(getByLabelText('RNDateTimePicker'));

    // confirm
    fireEvent.press(getByText(/Confirm/i));
    expect(onConfirm).toHaveBeenCalled();
    const arg = onConfirm.mock.calls[0][0];
    expect(arg instanceof Date).toBe(true);
  });
});


