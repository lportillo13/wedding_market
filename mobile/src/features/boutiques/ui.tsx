import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors, fontFamilies, radii } from '../../theme/tokens';
export const boutiqueStyles = StyleSheet.create({
    root: { gap: 18, paddingBottom: 25 }, title: { fontFamily: fontFamilies.displayRegular, color: colors.ink, fontSize: 34, lineHeight: 39 }, heading: { fontFamily: fontFamilies.displayRegular, color: colors.ink, fontSize: 26, lineHeight: 31 }, script: { fontFamily: fontFamilies.script, color: colors.ink, fontSize: 27 }, body: { fontFamily: fontFamilies.body, color: colors.ink, fontSize: 16, lineHeight: 23 }, muted: { fontFamily: fontFamilies.body, color: colors.muted, fontSize: 14, lineHeight: 21 },
    button: { backgroundColor: colors.ink, borderRadius: radii.control, paddingVertical: 14, paddingHorizontal: 18, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontFamily: fontFamilies.body, color: colors.paper, fontSize: 16, lineHeight: 21, textAlign: 'center' }, secondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, secondaryText: { color: colors.ink }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
    field: { gap: 7 }, input: { fontFamily: fontFamilies.body, fontSize: 16, color: colors.ink, minHeight: 50, padding: 13, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radii.control }, area: { minHeight: 110, textAlignVertical: 'top' },
    hero: { height: 420, justifyContent: 'flex-end', backgroundColor: colors.blush, borderRadius: radii.surface, overflow: 'hidden' }, heroImage: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%' }, heroOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#211A1366' }, heroCopy: { padding: 24, gap: 12, alignItems: 'center' }, heroTitle: { fontFamily: fontFamilies.displayRegular, fontSize: 40, lineHeight: 44, color: colors.paper, textAlign: 'center' }, heroScript: { fontFamily: fontFamilies.script, fontSize: 27, color: colors.paper }, heroBody: { fontFamily: fontFamilies.body, fontSize: 15, color: colors.paper, textAlign: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { width: '48%', flexGrow: 1, flexBasis: '45%', gap: 7 }, tileImage: { width: '100%', height: 220, borderRadius: radii.surface, backgroundColor: colors.blush }, tileTitle: { fontFamily: fontFamilies.displayRegular, color: colors.ink, fontSize: 22, lineHeight: 26 }, heart: { position: 'absolute', right: 7, top: 7, width: 44, height: 44, backgroundColor: colors.paper, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, heartText: { color: colors.ink, fontSize: 25 }, gallery: { width: '100%', height: 400, borderRadius: radii.surface, backgroundColor: colors.blush },
    section: { gap: 14, paddingVertical: 22, borderTopWidth: 1, borderTopColor: colors.line }, policy: { padding: 18, gap: 10, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radii.surface }, appointment: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 8 }, status: { alignSelf: 'flex-start', backgroundColor: colors.blush, borderRadius: 5, paddingHorizontal: 9, paddingVertical: 5 }, error: { fontFamily: fontFamilies.body, color: '#853E36', fontSize: 15, lineHeight: 22 }, check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8 }, checkText: { fontFamily: fontFamilies.body, color: colors.ink, fontSize: 16, lineHeight: 23, flex: 1 },
    media: { width: 85, height: 110, borderRadius: 7 },
});
export function BoutiqueButton({ title, onPress, secondary = false, disabled = false }: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
}) { return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[boutiqueStyles.button, secondary && boutiqueStyles.secondary, disabled && { opacity: .55 }]}><Text style={[boutiqueStyles.buttonText, secondary && boutiqueStyles.secondaryText]}>{title}</Text></TouchableOpacity>; }
export function BoutiqueField({ label, ...props }: TextInputProps & {
    label: string;
}) { return <View style={boutiqueStyles.field}><Text style={boutiqueStyles.body}>{label}</Text><TextInput accessibilityLabel={label} {...props} style={[boutiqueStyles.input, props.multiline && boutiqueStyles.area, props.style]}/></View>; }
export function BoutiqueCheck({ label, value, onChange }: {
    label: string;
    value: boolean;
    onChange: () => void;
}) { return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={onChange} style={boutiqueStyles.check}><Text style={boutiqueStyles.body}>{value ? '☑' : '□'}</Text><Text style={boutiqueStyles.checkText}>{label}</Text></TouchableOpacity>; }
