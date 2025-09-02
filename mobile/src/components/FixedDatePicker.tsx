import * as React from 'react';
import { Modal, Platform, SafeAreaView, View, Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Mode = 'date' | 'time';
type Props = {
  visible: boolean;
  mode?: Mode;                 // default 'date'
  initial?: Date | undefined;  // default new Date()
  minimumDate?: Date | undefined;
  maximumDate?: Date | undefined;
  title?: string;              // default 'Select Date'
  onConfirm: (value: Date) => void;
  onCancel: () => void;
};

export default function FixedDatePicker({
  visible,
  mode = 'date',
  initial = new Date(),
  minimumDate,
  maximumDate,
  title = 'Select Date',
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = React.useState<Date>(initial);
  React.useEffect(() => { if (visible) setValue(initial); }, [visible, initial]);

  if (Platform.OS !== 'ios') {
    // iOS fix only. Android path remains unchanged in existing code.
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 12 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={onCancel}><Text style={{ color: '#007AFF', fontSize: 16 }}>Cancel</Text></Pressable>
            <Text style={{ fontWeight: '600', fontSize: 16 }}>{title}</Text>
            <Pressable onPress={() => onConfirm(value)}><Text style={{ color: '#007AFF', fontSize: 16 }}>Confirm</Text></Pressable>
          </View>

          <DateTimePicker
            // iOS wheels are the most reliable inside modals
            value={value}
            mode={mode}
            display="spinner"
            themeVariant="light"
            onChange={(_, d) => { if (d) setValue(d); }}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            style={{ backgroundColor: '#fff', width: '100%', height: 216 }}
            // textColor works on iOS spinner and prevents low contrast
            textColor="#000"
            locale="en_US"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
