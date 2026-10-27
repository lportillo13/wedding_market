import { Text } from 'react-native';
import { colors, fontFamilies } from '../theme/tokens';

export function BrandWordmark({ light = false }: { light?: boolean }) {
  return <Text accessibilityLabel="Wedding Market" style={{ fontFamily: fontFamilies.displayRegular, color: light ? colors.paper : colors.ink, fontSize: 24, lineHeight: 34, flexShrink: 1 }}>Wedding Market</Text>;
}
