import { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type VendorDetail, type VendorListItem } from '../../../lib/api';
import { loadVendorEditorData } from '../../../lib/vendorProfile';
import { savedVendorPreview } from '../preview';
import { VendorDetailScreen } from './VendorDetailScreen';
import { styles } from '../../../theme/styles';
import { colors } from '../../../theme/tokens';
export function VendorPublicProfileScreen(_props: {
    savedVendorIds: string[];
    language: 'en' | 'es';
    onRequestQuote: (vendor: VendorListItem) => void;
    onToggleSaved: (vendor: VendorListItem) => void;
}) {
    const { language } = _props;
    const [vendor, setVendor] = useState<VendorDetail | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [coverVisible, setCoverVisible] = useState(true);
    async function open() { if (busy)
        return; setBusy(true); setError(''); try {
        const data = await loadVendorEditorData();
        if (!data)
            throw Error(language === 'es' ? 'No hay un negocio guardado.' : 'No saved business is available.');
        setVendor(savedVendorPreview(data, language));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load preview.');
    }
    finally {
        setBusy(false);
    } }
    return <View style={styles.formSection}><Text style={styles.body}>{language === 'es' ? 'Vista privada de tus datos guardados. Guarda los cambios antes de abrirla.' : 'Private preview of your saved details. Save changes before opening it.'}</Text>
    <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => void open()}><Text style={styles.secondaryButtonText}>{language === 'es' ? 'Vista previa privada' : 'Private saved preview'}</Text></TouchableOpacity>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
    <Modal visible={Boolean(vendor)} animationType="slide" onRequestClose={() => setVendor(null)}><SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setVendor(null)}><Text style={styles.secondaryButtonText}>{language === 'es' ? 'Cerrar vista privada' : 'Close private preview'}</Text></TouchableOpacity>
      <ScrollView scrollEventThrottle={100} onScroll={event => setCoverVisible(event.nativeEvent.contentOffset.y < 500)}>{vendor ? <VendorDetailScreen slug={vendor.slug} initialVendor={vendor} privatePreview coverVisible={coverVisible} language={language} isSaved={false} onBack={() => setVendor(null)} onRequestQuote={() => { }} onToggleSaved={() => { }} onScrollToSection={() => { }} disableSectionScroll showBack={false}/> : null}</ScrollView>
    </SafeAreaView></SafeAreaProvider></Modal>
  </View>;
}
