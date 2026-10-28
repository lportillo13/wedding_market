import { Text } from 'react-native';
import { colors, fontFamilies } from '../theme/tokens';

export function BrandWordmark({ light = false }: { light?: boolean }) {
  return <Text accessibilityLabel="Wedding Market" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{ fontFamily: fontFamilies.displayRegular, color: light ? colors.paper : colors.ink, fontSize: 18, lineHeight: 27, letterSpacing: 1.1, textTransform: 'uppercase', flexShrink: 1 }}>Wedding Market</Text>;
}
