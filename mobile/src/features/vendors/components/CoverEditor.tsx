import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveVendorCover, uploadVendorMedia, type VendorEditorVendor } from '../../../lib/vendorProfile';
import { styles } from '../../../theme/styles';
import { prepareVendorHeroPresentation } from '../../../../../shared/vendors/hero';
export function CoverEditor({ vendor, language, onSaved }: {
    vendor: VendorEditorVendor;
    language: 'en' | 'es';
    onSaved: () => Promise<void>;
}) {
    const [url, setUrl] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    const title = language === 'es' ? 'Portada de foto o video' : 'Photo or video cover';
    async function save(input: Parameters<typeof prepareVendorHeroPresentation>[0]) { if (busy)
        return; setBusy(true); setMessage(''); try {
        await saveVendorCover(vendor.id, input);
        await onSaved();
        setMessage(language === 'es' ? 'Portada guardada.' : 'Cover saved.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Unable to save cover.');
    }
    finally {
        setBusy(false);
    } }
    async function upload() { if (busy)
        return; setBusy(true); setMessage(''); try {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsMultipleSelection: false });
        if (result.canceled)
            return;
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024)
            throw Error(language === 'es' ? 'El video debe pesar 50 MB o menos.' : 'Videos must be 50 MB or smaller.');
        await uploadVendorMedia('vendor-video', { uri: asset.uri, name: asset.fileName ?? 'cover.mp4', type: asset.mimeType ?? 'video/mp4' });
        await onSaved();
        setMessage(language === 'es' ? 'Video subido. Selecciónalo abajo para usarlo como portada.' : 'Video uploaded. Select it below to use it as your cover.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Upload failed.');
    }
    finally {
        setBusy(false);
    } }
    return <View style={styles.editorSubCard}><Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => void save({ mode: 'image' })}><Text style={styles.secondaryButtonText}>{language === 'es' ? 'Usar foto de portada' : 'Use cover photo'}</Text></TouchableOpacity>
    <Text style={styles.body}>YouTube · Vimeo · HTTPS MP4 / WebM</Text><TextInput accessibilityLabel={title} autoCapitalize="none" autoCorrect={false} style={styles.input} value={url} onChangeText={setUrl} placeholder="https://"/>
    <TouchableOpacity disabled={busy || !url.trim()} style={styles.secondaryButton} onPress={() => void save({ mode: 'video', source: 'link', url })}><Text style={styles.secondaryButtonText}>{language === 'es' ? 'Guardar enlace de video' : 'Save video link'}</Text></TouchableOpacity>
    <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => void upload()}><Text style={styles.secondaryButtonText}>{language === 'es' ? 'Subir video (máx. 50 MB)' : 'Upload video (max. 50 MB)'}</Text></TouchableOpacity>
    {(vendor.gallery_images ?? []).filter(asset => asset.type === 'video' && asset.public_id).map((asset, index) => <TouchableOpacity key={asset.public_id} disabled={busy} style={styles.secondaryButton} onPress={() => void save({ mode: 'video', source: 'library', assetId: asset.public_id })}><Text style={styles.secondaryButtonText}>{language === 'es' ? 'Usar video guardado' : 'Use saved video'} {index + 1}</Text></TouchableOpacity>)}
    {message ? <Text accessibilityRole="alert" style={styles.body}>{message}</Text> : null}
  </View>;
}
