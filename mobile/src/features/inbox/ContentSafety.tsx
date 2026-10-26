import {useEffect,useRef,useState} from 'react';
import {Alert,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {supabase} from '../../lib/supabase';
import {styles} from '../../theme/styles';
import {safetyCopy} from '../../../../shared/safety/copy';
import {withDeadline} from '../../../../shared/resources/deadline';

export function ContentSafety({kind,targetId,vendorId=null,language}:{kind:'vendor'|'conversation';targetId:string;vendorId?:string|null;language:'en'|'es'}) {
  const labels=safetyCopy[language];const [open,setOpen]=useState(false);const [blocked,setBlocked]=useState(false);const [reason,setReason]=useState<'spam'|'harassment'|'misleading'|'rights'|'other'>('harassment');const [details,setDetails]=useState('');const [busy,setBusy]=useState(false);
  const stateVersion=useRef(0);
  useEffect(()=>{const client=supabase;if(kind!=='conversation'||!client)return;let active=true;const version=++stateVersion.current;void withDeadline(signal=>client.rpc('conversation_safety_state',{p_rfq:targetId,p_vendor:vendorId}).abortSignal(signal)).then(({data})=>{if(active&&version===stateVersion.current)setBlocked(data===true);}).catch(()=>{});return()=>{active=false;};},[kind,targetId,vendorId]);
  async function save(block:boolean) {
    const client=supabase;if(!client||busy)return;if(block)stateVersion.current++;setBusy(true);
    try {
      const {error}=await withDeadline(signal=>(block?client.rpc('set_conversation_block',{p_rfq:targetId,p_vendor:vendorId,p_blocked:!blocked}):client.rpc('report_content',{p_kind:kind,p_target:targetId,p_vendor:vendorId,p_reason:reason,p_details:details})).abortSignal(signal));
      if(error)throw error;
      if(block)setBlocked(!blocked);else {setOpen(false);setDetails('');Alert.alert(labels.report,labels.sent);}
    }catch{Alert.alert(labels.report,labels.failed);}finally{setBusy(false);}
  }
  return <View style={{marginVertical:12,gap:8}}><TouchableOpacity onPress={()=>setOpen(!open)}><Text style={styles.secondaryButtonText}>{labels.report}</Text></TouchableOpacity>
    {kind==='conversation'?<TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={()=>void save(true)}><Text style={styles.secondaryButtonText}>{blocked?labels.unblock:labels.block}</Text></TouchableOpacity>:null}
    {blocked?<Text style={styles.body}>{labels.blocked}</Text>:null}
    {open?<View style={styles.formSection}><Text style={styles.label}>{labels.reason}</Text>{(['spam','harassment','misleading','rights','other'] as const).map(value=><TouchableOpacity key={value} accessibilityRole="radio" accessibilityState={{checked:value===reason}} onPress={()=>setReason(value)}><Text style={styles.body}>{value===reason?'●':'○'} {labels[value]}</Text></TouchableOpacity>)}
      <TextInput multiline maxLength={2000} value={details} onChangeText={setDetails} placeholder={labels.details} accessibilityLabel={labels.details} style={styles.input}/><TouchableOpacity disabled={busy} style={styles.secondaryButton} onPress={()=>void save(false)}><Text style={styles.secondaryButtonText}>{labels.send}</Text></TouchableOpacity></View>:null}
  </View>;
}
