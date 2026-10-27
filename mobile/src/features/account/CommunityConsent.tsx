import {useState} from 'react';
import {Text,TouchableOpacity,View} from 'react-native';
import {supabase} from '../../lib/supabase';
import {styles} from '../../theme/styles';
import {openPublicWebPath} from '../../ui/links';
import {safetyCopy} from '../../../../shared/safety/copy';
import {withDeadline} from '../../../../shared/resources/deadline';

export function CommunityConsent({language,onAccepted}:{language:'en'|'es';onAccepted:()=>void|Promise<void>}) {
  const labels=safetyCopy[language];const [checked,setChecked]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function accept() {
    if(!checked||busy)return;setBusy(true);setError('');
    try {const client=supabase;if(!client)throw Error();const {error}=await withDeadline(signal=>client.rpc('accept_community_terms').abortSignal(signal));if(error)throw error;await onAccepted();}
    catch {setError(labels.failed);}finally{setBusy(false);}
  }
  return <View style={styles.formSection}><Text style={styles.body}>{labels.consent}</Text>
    {(['terms','privacy','community-guidelines'] as const).map((path,index)=><TouchableOpacity key={path} onPress={()=>void openPublicWebPath('/'+path+'?lang='+language)}><Text style={styles.secondaryButtonText}>{(language==='es'?['Términos','Privacidad','Normas de la Comunidad']:['Terms','Privacy','Community Guidelines'])[index]}</Text></TouchableOpacity>)}
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked}} onPress={()=>setChecked(!checked)}><Text style={styles.body}>{checked?'☑':'☐'} {labels.accept}</Text></TouchableOpacity>
    <TouchableOpacity disabled={!checked||busy} style={styles.secondaryButton} onPress={()=>void accept()}><Text style={styles.secondaryButtonText}>{language==='es'?'Continuar':'Continue'}</Text></TouchableOpacity>{error?<Text style={styles.errorText}>{error}</Text>:null}
  </View>;
}
