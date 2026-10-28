import { useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { boutiqueCopy } from '../../../../shared/boutiques/copy';
import { boutiqueText, type Outfit } from '../../../../shared/boutiques/types';
import { colors, radii } from '../../theme/tokens';
import { boutiqueStyles as s } from './ui';
export function OutfitGallery({ outfit, language }: {
    outfit: Outfit;
    language: 'en' | 'es';
}) {
    const [selected, setSelected] = useState(0), t = boutiqueCopy[language], title = boutiqueText(outfit.name, language);
    const media = [...outfit.images.map((url, i) => ({ url, video: false, label: `${t.photo} ${i + 1}` })), ...outfit.videos.map((url, i) => ({ url, video: true, label: `${t.video} ${i + 1}` }))], active = media[selected] ?? media[0];
    if (!active)
        return null;
    return <View style={s.root}>{active.video ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.watchVideo} style={local.stage} onPress={() => void Linking.openURL(active.url)}><Image source={{ uri: outfit.images[0] }} style={s.gallery} resizeMode="contain"/><View style={local.play}><Ionicons name="play" size={26} color={colors.ink}/><Text style={s.body}>{t.watchVideo}</Text></View></TouchableOpacity> : <Image source={{ uri: active.url }} style={s.gallery} resizeMode="contain" accessibilityLabel={`${title} · ${active.label}`}/>}
 {media.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.thumbs}>{media.map((asset, i) => <TouchableOpacity key={asset.url} accessibilityRole="button" accessibilityLabel={asset.label} accessibilityState={{ selected: selected === i }} onPress={() => setSelected(i)} style={[local.thumb, selected === i && local.selected]}><View><Image source={{ uri: asset.video ? outfit.images[0] : asset.url }} style={local.image}/>{asset.video ? <View style={local.icon}><Ionicons name="play" size={23} color={colors.ink}/></View> : null}</View><Text style={s.muted}>{asset.label}</Text></TouchableOpacity>)}</ScrollView> : null}
 <Text style={s.muted} accessibilityLiveRegion="polite">{active.label} · {selected + 1} / {media.length}</Text></View>;
}
const local = StyleSheet.create({ stage: { position: 'relative' }, play: { position: 'absolute', alignSelf: 'center', top: '42%', backgroundColor: colors.paper, padding: 14, borderRadius: radii.control, alignItems: 'center', gap: 5 }, thumbs: { gap: 10, padding: 3 }, thumb: { width: 76, padding: 4, borderWidth: 1, borderColor: colors.line, borderRadius: 7 }, selected: { borderColor: colors.ink, borderWidth: 2, padding: 3 }, image: { width: '100%', height: 84, borderRadius: 4 }, icon: { position: 'absolute', alignSelf: 'center', top: 27, backgroundColor: colors.paper, borderRadius: 20, padding: 4 } });
