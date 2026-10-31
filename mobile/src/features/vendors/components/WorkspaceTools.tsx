import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { localizedText } from '../../../lib/vendorProfile';
import { styles } from '../../../theme/styles';
import { FieldLabel } from '../../../ui/forms';
import { workspaceCommand } from '../workspace-api';
export function WorkspaceTools({ vendorId, published, language, onSaved }: {
    vendorId: string;
    published: boolean;
    language: 'en' | 'es';
    onSaved: () => Promise<void>;
}) {
    const [section, setSection] = useState<'categories' | 'location' | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    const [options, setOptions] = useState<{
        id: string;
        key: string;
        label: unknown;
    }[]>([]), [keys, setKeys] = useState<string[]>([]), [loaded, setLoaded] = useState(false);
    const [location, setLocation] = useState<Record<string, string>>({ address: '', city: '', state: '', lat: '', lng: '', service_radius_km: '50' });
    useEffect(() => { let active = true; void (async () => { try {
        const db = supabase!;
        const [cats, selected, place] = await Promise.all([db.from('categories').select('id,key,label').order('key').limit(100), db.from('vendor_categories').select('category_id').eq('vendor_id', vendorId).limit(100), db.from('vendor_locations').select('address,city,state,lat,lng,service_radius_km').eq('vendor_id', vendorId).maybeSingle()]);
        if (cats.error || selected.error || place.error)
            throw Error();
        if (active) {
            setOptions(cats.data ?? []);
            setKeys((cats.data ?? []).filter(row => (selected.data ?? []).some(item => item.category_id === row.id)).map(row => row.key));
            if (place.data)
                setLocation(Object.fromEntries(Object.entries(place.data).map(([key, value]) => [key, value == null ? '' : String(value)])));
            setLoaded(true);
        }
    }
    catch {
        if (active)
            setMessage(language === 'es' ? 'No se pudieron cargar tus categorías o ubicación.' : 'Unable to load your categories or location.');
    } })(); return () => { active = false; }; }, [vendorId, language]);
    async function save(input: unknown) { if (busy)
        return; setBusy(true); setMessage(''); try {
        await workspaceCommand(input);
        await onSaved();
        setMessage(language === 'es' ? 'Cambios guardados.' : 'Changes saved.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Unable to save.');
    }
    finally {
        setBusy(false);
    } }
    return <View style={styles.formSection}>
    <Text style={styles.sectionTitle}>{language === 'es' ? 'Servicios, ubicación y publicación' : 'Services, location and publication'}</Text>
    <View style={styles.detailChips}>{(['categories', 'location'] as const).map(value => <TouchableOpacity key={value} disabled={busy || !loaded} style={styles.detailChip} onPress={() => setSection(section === value ? null : value)}><Text style={styles.detailChipText}>{value === 'categories' ? (language === 'es' ? 'Categorías' : 'Categories') : (language === 'es' ? 'Ubicación' : 'Location')}</Text></TouchableOpacity>)}</View>
    {section === 'categories' ? <>{options.map(option => <TouchableOpacity key={option.key} disabled={busy} accessibilityRole="checkbox" accessibilityState={{ checked: keys.includes(option.key) }} onPress={() => setKeys(current => current.includes(option.key) ? current.filter(key => key !== option.key) : [...current, option.key])}><Text style={styles.body}>{keys.includes(option.key) ? '☑' : '☐'} {localizedText(option.label as Parameters<typeof localizedText>[0], language) || option.key}</Text></TouchableOpacity>)}<TouchableOpacity disabled={busy} style={styles.primaryButton} onPress={() => void save({ action: 'categories', keys })}><Text style={styles.primaryButtonText}>{language === 'es' ? 'Guardar categorías' : 'Save categories'}</Text></TouchableOpacity></> : null}
    {section === 'location' ? <>{(['address', 'city', 'state', 'lat', 'lng', 'service_radius_km'] as const).map((key, index) => <View key={key}><FieldLabel text={(language === 'es' ? ['Dirección', 'Ciudad', 'Provincia', 'Latitud (opcional)', 'Longitud (opcional)', 'Radio de servicio (km)'] : ['Address', 'City', 'Province', 'Latitude (optional)', 'Longitude (optional)', 'Service radius (km)'])[index]}/><TextInput style={styles.input} value={location[key] ?? ''} onChangeText={value => setLocation(current => ({ ...current, [key]: value }))}/></View>)}<Text style={styles.body}>Costa Rica</Text><TouchableOpacity disabled={busy} style={styles.primaryButton} onPress={() => void save({ action: 'location', values: { ...location, lat: location.lat.trim() ? Number(location.lat) : null, lng: location.lng.trim() ? Number(location.lng) : null, service_radius_km: location.service_radius_km.trim() ? Number(location.service_radius_km) : 50 } })}><Text style={styles.primaryButtonText}>{language === 'es' ? 'Guardar ubicación' : 'Save location'}</Text></TouchableOpacity></> : null}
    <TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={() => Alert.alert(language === 'es' ? (published ? '¿Ocultar tu negocio?' : '¿Publicar tu negocio?') : (published ? 'Unpublish your business?' : 'Publish your business?'), language === 'es' ? 'Se usará la información guardada de tu negocio.' : 'This uses your saved business information.', [{ text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' }, { text: language === 'es' ? 'Continuar' : 'Continue', onPress: () => void save({ action: 'publication', published: !published }) }])}><Text style={styles.secondaryButtonText}>{language === 'es' ? (published ? 'Ocultar perfil público' : 'Publicar perfil') : (published ? 'Unpublish profile' : 'Publish profile')}</Text></TouchableOpacity>
    {message ? <Text accessibilityRole="alert" style={styles.body}>{message}</Text> : null}
  </View>;
}
