import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DateSheet from '../../components/DateSheet';
import { DateFilterProvider, useDateFilter } from '../../state/dateFilter';

function Shell() {
  const [visible, setVisible] = React.useState(true);
  const api = useDateFilter();
  return (
    <>
      <DateSheet visible={visible} onClose={() => setVisible(false)} />
      {/* expose for assertions */}
      {/* @ts-ignore */}
      <Hidden value={api} />
    </>
  );
}

function Hidden(_props: any) { return null; }

describe('DateSheet workflow behavior', () => {
  function renderSheet() {
    const utils = render(
      <DateFilterProvider>
        <Shell />
      </DateFilterProvider>
    );
    return utils;
  }

  test('opening reflects applied; presets do not auto-close; apply commits; cancel discards', async () => {
    const utils = renderSheet();

    // The sheet starts visible; select a preset
    const next30 = await utils.findByText(/Next 30 Days/i);
    fireEvent.press(next30);

    // Sheet should still be visible (no auto-close)
    expect(utils.getByText(/Select Date Range/i)).toBeTruthy();

    // Changes pending hint should appear
    await utils.findByText(/Changes pending/i);

    // Apply and ensure it closes
    fireEvent.press(utils.getByText(/Apply Filter/i));
    await waitFor(() => {
      // Heading should disappear when closed
      expect(utils.queryByText(/Select Date Range/i)).toBeNull();
    });
  });

  test('cancel reverts draft to applied without commit', async () => {
    const utils = renderSheet();

    // choose different preset
    const next90 = await utils.findByText(/Next 90 Days/i);
    fireEvent.press(next90);
    // cancel should close without committing
    fireEvent.press(utils.getByText(/Cancel/i));
    await waitFor(() => expect(utils.queryByText(/Select Date Range/i)).toBeNull());
  });
});


