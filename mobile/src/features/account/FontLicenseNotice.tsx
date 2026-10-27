import {useState} from 'react';
import {Modal,SafeAreaView,ScrollView,Text,TouchableOpacity,View} from 'react-native';
import {fontLicense} from '../../content/font-license';
import {styles} from '../../theme/styles';
import {colors} from '../../theme/tokens';

export function FontLicenseNotice({language}:{language:'en'|'es'}) {
  const [open,setOpen]=useState(false);
  const title=language==='es'?'Licencia de tipografía':'Font license';
  return <View>
    <TouchableOpacity accessibilityRole="button" style={styles.textLinkButton} onPress={()=>setOpen(true)}><Text style={styles.textLink}>{title}</Text></TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={()=>setOpen(false)}>
      <SafeAreaView style={{flex:1,backgroundColor:colors.paper}}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.textLinkButton} onPress={()=>setOpen(false)}><Text style={styles.textLink}>{language==='es'?'Cerrar':'Close'}</Text></TouchableOpacity>
          <Text selectable style={styles.body}>{fontLicense}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}
