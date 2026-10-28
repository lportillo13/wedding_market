import {useState} from 'react';
import {Modal,ScrollView,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {fontLicense} from '../../content/font-license';
import {styles} from '../../theme/styles';
import {colors} from '../../theme/tokens';

export function FontLicenseNotice({language}:{language:'en'|'es'}) {
  const [open,setOpen]=useState(false);
  const title=language==='es'?'Licencias de tipografía':'Font licenses';
  return <View>
    <TouchableOpacity accessibilityRole="button" style={styles.textLinkButton} onPress={()=>setOpen(true)}><Text style={styles.textLink}>{title}</Text></TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={()=>setOpen(false)}>
      <SafeAreaProvider>
      <SafeAreaView style={{flex:1,backgroundColor:colors.paper}}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.textLinkButton} onPress={()=>setOpen(false)}><Text style={styles.textLink}>{language==='es'?'Cerrar':'Close'}</Text></TouchableOpacity>
          <Text selectable style={styles.body}>{fontLicense}</Text>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  </View>;
}
