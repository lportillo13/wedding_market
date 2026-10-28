import { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontFamilies, radii } from '../theme/tokens';

export function SectionPicker<T extends string>({ value, options, label, closeLabel, disabled, onChange }: {
  value: T; options: { key: T; label: string }[]; label: string; closeLabel: string;
  disabled?: boolean; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return <View style={{ marginVertical: 18 }}>
    <Text style={{ fontFamily: fontFamilies.body, color: colors.muted, fontSize: 13, marginBottom: 8 }}>{label}</Text>
    <TouchableOpacity disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} onPress={() => setOpen(true)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, padding: 16, borderColor: colors.line, borderWidth: 1, borderRadius: radii.control, backgroundColor: colors.paper }}>
      <Text style={{ fontFamily: fontFamilies.body, color: colors.ink, fontSize: 16, lineHeight: 24, flex: 1, marginRight: 12 }}>{options.find(option => option.key === value)?.label}</Text>
      <Ionicons name="chevron-down" size={18} color={colors.ink} />
    </TouchableOpacity>
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
      <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamilies.displayRegular, color: colors.ink, fontSize: 30, lineHeight: 36, flex: 1, marginRight: 12 }}>{label}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={closeLabel} onPress={() => setOpen(false)} style={{ padding: 10, minWidth: 44, minHeight: 44 }}><Ionicons name="close" size={24} color={colors.ink} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {options.map(option => <TouchableOpacity key={option.key} accessibilityRole="radio" accessibilityState={{ checked: value === option.key }} onPress={() => { onChange(option.key); setOpen(false); }}
            style={{ paddingVertical: 19, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24, color: colors.ink, flex: 1, marginRight: 12 }}>{option.label}</Text>
            {value === option.key && <Ionicons name="checkmark" size={22} color={colors.ink} />}
          </TouchableOpacity>)}
        </ScrollView>
      </SafeAreaView></SafeAreaProvider>
    </Modal>
  </View>;
}
