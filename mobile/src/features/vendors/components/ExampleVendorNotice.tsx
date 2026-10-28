import { Text, TouchableOpacity, View } from 'react-native';
import { exampleVendorCopy } from '../../../../../shared/vendors/examples';
import { styles } from '../../../theme/styles';

export function ExampleVendorNotice({ language, onExit }: { language: 'en' | 'es'; onExit?: () => void }) {
  const labels = exampleVendorCopy[language];
  return <View style={styles.panel}>
    <Text style={styles.kicker}>{labels.badge}</Text>
    <Text style={styles.body}>{labels.body}</Text>
    {onExit && <TouchableOpacity accessibilityRole="button" onPress={onExit} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{labels.exit}</Text></TouchableOpacity>}
  </View>;
}
