import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { categoryLabel } from '../../../content/catalog';
import { copy } from '../../../i18n/copy';
import { type VendorListItem } from '../../../lib/api';
import { styles } from '../../../theme/styles';
import { colors, fontFamilies } from '../../../theme/tokens';
import { exampleVendorCopy } from '../../../../../shared/vendors/examples';
export function VendorCard({ vendor, isSaved, language, onPress, onRequestQuote, onToggleSaved }: {
    vendor: VendorListItem;
    isSaved: boolean;
    language: 'en' | 'es';
    onPress: (vendor: VendorListItem) => void;
    onRequestQuote: (vendor: VendorListItem) => void;
    onToggleSaved: (vendor: VendorListItem) => void;
}) {
    const labels = copy[language];
    const image = vendor.thumbnail_image?.url ?? vendor.hero_image?.url;
    return <View style={card.root}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={vendor.business_name} onPress={() => onPress(vendor)} activeOpacity={.9} style={card.photo}>
      {image ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill}/> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.soft }]}/>}
      <View pointerEvents="none" style={card.shade}/>
      <View style={card.caption} pointerEvents="none">
        {vendor.is_example ? <Text style={card.meta}>{exampleVendorCopy[language].badge}</Text> : null}
        <Text style={card.category}>{(vendor.categories ?? []).slice(0, 2).map(value => categoryLabel(value, language)).join(' · ')}</Text>
        <Text style={card.name}>{vendor.business_name}</Text>
        <Text style={card.meta}>{[vendor.city, vendor.region].filter(Boolean).join(', ')}{Number(vendor.rating_count) > 0 ? ` · ★ ${Number(vendor.rating_avg ?? 0).toFixed(1)} (${vendor.rating_count})` : ''}</Text>
      </View>
    </TouchableOpacity>
    {!vendor.is_example ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={isSaved ? labels.favorites : labels.shortlist} accessibilityState={{ selected: isSaved }} onPress={() => onToggleSaved(vendor)} style={card.favorite}><Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={21} color={colors.ink}/></TouchableOpacity> : null}
    <TouchableOpacity accessibilityRole="button" onPress={() => vendor.is_example ? onPress(vendor) : onRequestQuote(vendor)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{vendor.is_example ? labels.vendorProfile : labels.requestQuote} →</Text></TouchableOpacity>
  </View>;
}
const card = StyleSheet.create({ root: { gap: 8, marginBottom: 18 }, photo: { aspectRatio: 1, overflow: 'hidden', backgroundColor: colors.soft }, shade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, experimental_backgroundImage: 'linear-gradient(180deg, rgba(20,15,12,0) 30%, rgba(20,15,12,0.8) 100%)' }, caption: { position: 'absolute', bottom: 24, left: 20, right: 20, gap: 6 }, category: { fontFamily: fontFamilies.script, color: '#FFFDF9', fontSize: 32, lineHeight: 35 }, name: { fontFamily: fontFamilies.displayRegular, color: '#FFFDF9', fontSize: 31, lineHeight: 36 }, meta: { fontFamily: fontFamilies.body, color: '#FFFDF9', fontSize: 13, lineHeight: 20 }, favorite: { position: 'absolute', top: 12, right: 12, padding: 12, backgroundColor: colors.paper, borderRadius: 7 } });
