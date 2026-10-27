import {Linking,Text,TouchableOpacity,View} from 'react-native';
import {styles} from '../../theme/styles';
import type {useMessageNotifications} from './native';

const copy={
 en:{title:'Message and quote alerts',hint:'Get an alert for new messages, quotes and wedding requests. Alerts keep names and private details off your lock screen.',enable:'Enable notifications',disable:'Turn off notifications',retryDisable:'Retry turning off',settings:'Phone settings',on:'Notifications are enabled for this account on this device.',off:'Notifications are off. You can still use your inbox.',denied:'Notifications are blocked in your phone settings.',unsupported:'Notifications need the installed Android or iOS app; Expo Go does not support them.',error:'Unable to update notifications. Check your connection and try again.'},
 es:{title:'Avisos de mensajes y cotizaciones',hint:'Recibe avisos de mensajes, cotizaciones y solicitudes. Los avisos no muestran nombres ni detalles privados en la pantalla bloqueada.',enable:'Activar notificaciones',disable:'Desactivar notificaciones',retryDisable:'Reintentar desactivación',settings:'Ajustes del teléfono',on:'Las notificaciones están activadas para esta cuenta en este dispositivo.',off:'Las notificaciones están desactivadas. Tu bandeja sigue disponible.',denied:'Las notificaciones están bloqueadas en los ajustes del teléfono.',unsupported:'Se necesita la aplicación instalada de Android o iOS; Expo Go no admite estos avisos.',error:'No se pudieron actualizar las notificaciones. Revisa tu conexión e inténtalo de nuevo.'},
};
export function NotificationSettings({notifications}:{notifications:ReturnType<typeof useMessageNotifications>}){
 if(!notifications.visible)return null;const text=copy[notifications.language];
 return <View style={styles.panel}><Text style={styles.sectionTitle}>{text.title}</Text><Text style={styles.body}>{text.hint}</Text>
  <Text accessibilityLiveRegion="polite" style={styles.body}>{text[notifications.status]}</Text>
  <TouchableOpacity accessibilityRole="button" disabled={notifications.busy} onPress={notifications.enabled||notifications.retryDisable?notifications.disable:notifications.enable} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{notifications.retryDisable?text.retryDisable:notifications.enabled?text.disable:text.enable}</Text></TouchableOpacity>
  {notifications.status==='denied'?<TouchableOpacity accessibilityRole="button" onPress={()=>{void Linking.openSettings();}} style={styles.textLinkButton}><Text style={styles.textLink}>{text.settings}</Text></TouchableOpacity>:null}
 </View>;
}
