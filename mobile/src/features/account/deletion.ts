import {Alert} from 'react-native';
import {supabase} from '../../lib/supabase';
import {deletionCopy,type DeletionReceipt} from '../../../../shared/accounts/deletion';

let submitting=false;
export function confirmAccountDeletion(language:'en'|'es') {
  const labels=deletionCopy[language];
  Alert.alert(labels.title,labels.body,[{text:language==='es'?'Cancelar':'Cancel',style:'cancel'},
    {text:labels.button,style:'destructive',onPress:()=>{void submit();}}]);
  async function submit() {
    if (submitting) return;submitting=true;
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15_000);
    try {
      if (!supabase) throw new Error(labels.failed);
      const {data,error}=await supabase.rpc('request_account_deletion',{p_language:language}).abortSignal(controller.signal);
      if (error || !data) throw new Error(labels.failed);
      const receipt=data as DeletionReceipt;
      Alert.alert(labels.title,`${labels.pending}\n\n${labels.deadline}: ${new Date(receipt.dueAt).toLocaleDateString(language==='es'?'es-CR':'en-US')}\n${labels.reference}: ${receipt.id}`);
    } catch {Alert.alert(labels.title,labels.failed);} finally {clearTimeout(timeout);submitting=false;}
  }
}
