import { ContentSafety } from "./ContentSafety";
import { type IconName } from "../../application/types";
import { themeOptions } from "../../content/catalog";
import { copy } from "../../i18n/copy";
import { type AppRole } from "../../lib/auth";
import { createSubmissionId, isQuoteThreadClosed } from "../../lib/quoteUtils";
import { acceptMobileQuote, loadMobileInbox, loadMobileInboxThread, sendQuoteThreadReply, sendVendorQuote, type MobileInboxThread, type MobileThreadAddress } from "../../lib/rfqs";
import type {NotificationThreadTarget} from '../../../../shared/notifications/push';
import { styles } from "../../theme/styles";
import { colors } from "../../theme/tokens";
import { parseDateValue } from "../../ui/calendars";
import { formatCategory, formatMoney } from "../../ui/format";
import { FieldLabel } from "../../ui/forms";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Linking, Text, TextInput, TouchableOpacity, View } from "react-native";
import { INBOX_LIST_REFRESH_MS, INBOX_THREAD_REFRESH_MS } from "../../../../shared/resources/refresh-gate";

export function InboxScreen({ role, language,openRequest=null,onOpenConsumed,revision=0 }: { role: AppRole; language: "en" | "es";openRequest?:NotificationThreadTarget|null;onOpenConsumed?:(id:string)=>void;revision?:number }) {
  const replySubmission = useRef<{id:string;body:string;thread:string} | null>(null);
  const labels = copy[language];
  const [threads, setThreads] = useState<MobileInboxThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MobileInboxThread | null>(null);
  const selectedThreadRef = useRef<MobileInboxThread | null>(null);
  const refreshVersion = useRef(0);
  const refreshInFlight = useRef(0);
  const lastRefreshAt = useRef(0);
  const openVersion=useRef(0);
  const mounted=useRef(true);
  const handledOpen=useRef('');
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;openVersion.current++;refreshVersion.current++;};},[]);
  const [inboxPage,setInboxPage] = useState(1);
  const [totalThreads,setTotalThreads] = useState(0);
  useEffect(()=>{selectedThreadRef.current=selectedThread;},[selectedThread]);
  const [replyBody, setReplyBody] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [revealEmail, setRevealEmail] = useState(true);
  const [revealPhone, setRevealPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [isAcceptingQuote, setIsAcceptingQuote] = useState(false);
  const [message, setMessage] = useState("");
  const isVendorViewer = role === "vendor" || role === "admin";

  const refreshInbox = useCallback(async (shouldApply: () => boolean = () => true, foreground = true, forceDetail = true) => {
    const version = ++refreshVersion.current;
    const mayApply = () => shouldApply() && version === refreshVersion.current;
    refreshInFlight.current++; lastRefreshAt.current = Date.now();
    if (foreground) {setIsLoading(true);setMessage("");}
    try {
      const {threads:nextThreads,total} = await loadMobileInbox(role, language,inboxPage);
      if (!mayApply()) return;
      setThreads(nextThreads); setTotalThreads(total);
      if (selectedThreadRef.current) {
        const current=selectedThreadRef.current;
        const summary=nextThreads.find(thread=>thread.id === current.id);
        if (forceDetail || !summary?.refreshKey || summary.refreshKey !== current.refreshKey) {
          const detail=await loadMobileInboxThread(role,language,summary ?? current);
          if (mayApply() && selectedThreadRef.current?.id === current.id) setSelectedThread(detail);
        }
      }
    } catch (error) {
      if (mayApply() && foreground) setMessage(error instanceof Error ? error.message : "Unable to load inbox.");
    } finally {
      refreshInFlight.current--;
      if (mayApply() && foreground) setIsLoading(false);
    }
  }, [language, role,inboxPage]);

  useEffect(() => {
    let isMounted = true;
    void refreshInbox(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [refreshInbox]);

  useEffect(() => {
    let mounted = true;
    const refresh = (resumed = false) => {
      const interval = resumed ? 5_000 : selectedThreadRef.current ? INBOX_THREAD_REFRESH_MS : INBOX_LIST_REFRESH_MS;
      if (AppState.currentState !== "active" || refreshInFlight.current || Date.now()-lastRefreshAt.current < interval || isSending || isSendingQuote || isAcceptingQuote) return;
      void refreshInbox(() => mounted,false,false);
    };
    const timer = setInterval(() => refresh(),INBOX_THREAD_REFRESH_MS);
    const subscription = AppState.addEventListener("change",state => {if (state === "active") refresh(true);});
    return () => {mounted = false;clearInterval(timer);subscription.remove();};
  },[refreshInbox,isSending,isSendingQuote,isAcceptingQuote]);

  const openThread = useCallback(async (thread: MobileThreadAddress) => {
    const version=++openVersion.current;refreshVersion.current++;
    setIsLoading(true); setMessage("");
    try {
      const detail = await loadMobileInboxThread(role,language,thread);
      if(!mounted.current||version!==openVersion.current)return;
      setSelectedThread(detail);
      selectedThreadRef.current=detail;
      if (detail) {setQuoteAmount(typeof detail.latestQuote?.amountCents === "number" ? (detail.latestQuote.amountCents/100).toFixed(2) : ""); setQuoteMessage(detail.latestQuote?.message ?? "");setReplyBody("");}
      else setMessage(language==='es'?'Esta conversación ya no está disponible.':'This conversation is no longer available.');
    }
    catch(error) { if(mounted.current&&version===openVersion.current)setMessage(error instanceof Error ? error.message : "Unable to open conversation."); }
    finally { if(mounted.current&&version===openVersion.current)setIsLoading(false); }
  },[role,language]);

  useEffect(()=>{
    if(!openRequest||handledOpen.current===openRequest.notificationId||isSending||isSendingQuote||isAcceptingQuote)return;
    handledOpen.current=openRequest.notificationId;
    const consume=()=>onOpenConsumed?.(openRequest.notificationId);
    const current=selectedThreadRef.current;
    const address={id:`${openRequest.rfqId}__${openRequest.vendorId}`,rfqId:openRequest.rfqId,vendorId:openRequest.vendorId};
    if(current?.id===address.id){consume();if(!refreshInFlight.current)void refreshInbox(()=>mounted.current,false,true);return;}
    const hasDraft=Boolean(current&&(replyBody.trim()||quoteMessage!==(current.latestQuote?.message??'')||quoteAmount!==(typeof current.latestQuote?.amountCents==='number'?(current.latestQuote.amountCents/100).toFixed(2):'')));
    const open=()=>{consume();if(mounted.current)void openThread(address);};
    if(hasDraft)Alert.alert(language==='es'?'¿Abrir otra conversación?':'Open another conversation?',language==='es'?'Tienes cambios sin enviar en esta conversación.':'You have unsent changes in this conversation.',[
      {text:language==='es'?'Seguir aquí':'Stay here',style:'cancel',onPress:consume},
      {text:language==='es'?'Descartar y abrir':'Discard and open',style:'destructive',onPress:open},
    ],{cancelable:false});else open();
  },[openRequest,onOpenConsumed,isSending,isSendingQuote,isAcceptingQuote,replyBody,quoteMessage,quoteAmount,language,openThread,refreshInbox]);

  useEffect(()=>{
    if(revision&&AppState.currentState==='active'&&!refreshInFlight.current&&!isSending&&!isSendingQuote&&!isAcceptingQuote)void refreshInbox(()=>mounted.current,false,true);
  },[revision,refreshInbox,isSending,isSendingQuote,isAcceptingQuote]);

  async function submitReply() {
    if (!selectedThread) return;
    setIsSending(true);
    setMessage("");
    try {
      const body=replyBody.trim();
      if (replySubmission.current?.body !== body || replySubmission.current.thread !== selectedThread.id)
        replySubmission.current={id:createSubmissionId(),body,thread:selectedThread.id};
      await sendQuoteThreadReply(selectedThread, body, role,replySubmission.current.id);
      replySubmission.current=null;
      setReplyBody("");
      await refreshInbox(() => true,false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reply.");
    } finally {
      setIsSending(false);
    }
  }

  async function submitQuote() {
    if (!selectedThread) return;
    setIsSendingQuote(true);
    setMessage("");
    try {
      await sendVendorQuote(selectedThread, quoteAmount, quoteMessage);
      await refreshInbox(() => true,false);
      setMessage(labels.quoteSent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send quote.");
    } finally {
      setIsSendingQuote(false);
    }
  }

  async function acceptQuote() {
    if (!selectedThread?.latestQuote) return;
    setIsAcceptingQuote(true);
    setMessage("");
    try {
      await acceptMobileQuote(selectedThread, { revealEmail, revealPhone });
      await refreshInbox(() => true,false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept quote.");
    } finally {
      setIsAcceptingQuote(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{labels.inboxTitle}</Text>
      </View>
    );
  }

  if (selectedThread) {
    const isAcceptedHere = Boolean(
      selectedThread.acceptedQuoteId &&
      selectedThread.quotes.some((quote) => quote.id === selectedThread.acceptedQuoteId)
    );
    const conversationClosed = isQuoteThreadClosed(
      selectedThread.status,
      selectedThread.expiresAt,
      selectedThread.acceptedQuoteId,
      selectedThread.quotes.map((quote) => quote.id),
      Date.now(), selectedThread.closedAt,
    );
    const activity = [
      ...selectedThread.quotes.map((quote) => ({ kind: "quote" as const, createdAt: quote.createdAt, quote })),
      ...selectedThread.messages.map((inboxMessage) => ({
        kind: "message" as const,
        createdAt: inboxMessage.createdAt,
        inboxMessage,
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const request = selectedThread.request;
    const requestLocation = [request.city, request.state, request.country].filter(Boolean).join(", ");
    const requestedGuests = typeof request.guestCount === "number"
      ? String(request.guestCount)
      : request.guestCountRange;
    const formatRequestBudget = (value: number) => new Intl.NumberFormat(language === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
    const requestedBudget = request.budgetMin != null && request.budgetMax != null && request.budgetMin === request.budgetMax
      ? formatRequestBudget(request.budgetMin)
      : request.budgetMin != null || request.budgetMax != null
        ? `${request.budgetMin != null ? formatRequestBudget(request.budgetMin) : "?"} – ${request.budgetMax != null ? formatRequestBudget(request.budgetMax) : "?"}`
        : null;
    const requestedDate = request.eventDate
      ? `${parseDateValue(request.eventDate).toLocaleDateString(language === "es" ? "es-US" : "en-US")} · ${request.flexibleDate ? labels.flexible : labels.fixedDate}`
      : request.flexibleDate
        ? labels.flexible
        : null;
    const requestedTheme = request.theme
      ? themeOptions(language).find((option) => option.value === request.theme)?.label ?? formatCategory(request.theme)
      : null;
    const requestedLanguage = request.language
      ? request.language.toLowerCase().startsWith("es") ? labels.spanish : labels.english
      : null;
    const requestRows = [
      { label: labels.eventDate, value: requestedDate, icon: "calendar-outline" as IconName },
      { label: labels.location, value: requestLocation || null, icon: "location-outline" as IconName },
      { label: labels.guests, value: requestedGuests, icon: "people-outline" as IconName },
      { label: labels.budget, value: requestedBudget, icon: "wallet-outline" as IconName },
      { label: labels.weddingTheme, value: requestedTheme, icon: "sparkles-outline" as IconName },
      { label: labels.preferredLanguage, value: requestedLanguage, icon: "language-outline" as IconName },
    ];

    return (
      <View>
        <View style={styles.quoteSummaryHeader}>
          <TouchableOpacity onPress={() => setSelectedThread(null)} style={styles.backButtonInline}>
            <Ionicons name="chevron-back" size={18} color={colors.tealDark} />
            <Text style={styles.backButtonText}>{labels.inbox}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={isLoading} onPress={() => void refreshInbox()} style={styles.backButtonInline}>
            <Ionicons name="refresh-outline" size={18} color={colors.tealDark} />
            <Text style={styles.backButtonText}>{labels.refresh}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dashboardHero}>
          <Text style={styles.kicker}>{selectedThread.status}</Text>
          <Text style={styles.title}>{selectedThread.title}</Text>
          <ContentSafety key={selectedThread.id} kind="conversation" targetId={selectedThread.rfqId} vendorId={selectedThread.vendorId} language={language} />
          <Text style={styles.body}>{selectedThread.subtitle}</Text>
        </View>
        {message ? (
          <Text style={message === labels.quoteSent ? styles.successText : styles.errorText}>{message}</Text>
        ) : null}

        <View style={styles.requestDetailsCard}>
          <Text style={styles.sectionTitle}>{labels.requestDetails}</Text>
          <View style={styles.requestDetailsList}>
            {requestRows.map((item) => (
              <View key={item.label} style={styles.requestDetailRow}>
                <Ionicons name={item.icon} size={17} color={colors.teal} />
                <View style={styles.requestDetailText}>
                  <Text style={styles.requestDetailLabel}>{item.label}</Text>
                  <Text style={styles.requestDetailValue}>{item.value ?? labels.notProvided}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.requestMessageBox}>
            <Text style={styles.requestDetailLabel}>{labels.requestMessage}</Text>
            <Text style={styles.requestMessageText}>{request.notes ?? labels.notProvided}</Text>
          </View>
        </View>

        {selectedThread.latestQuote ? (
          <View style={styles.quoteSummaryCard}>
            <View style={styles.quoteSummaryHeader}>
              <Text style={styles.kicker}>{labels.quotes}</Text>
              {isAcceptedHere ? <Text style={styles.acceptedBadge}>{labels.quoteAccepted}</Text> : null}
            </View>
            <Text style={styles.quoteSummaryAmount}>
              {formatMoney(selectedThread.latestQuote.amountCents, selectedThread.latestQuote.currency, language)}
            </Text>
            {selectedThread.latestQuote.message ? (
              <Text style={styles.quoteSummaryBody}>{selectedThread.latestQuote.message}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.body}>
              {isVendorViewer
                ? language === "en"
                  ? "No quote yet. Send a proposal when you are ready."
                  : "Aún no hay cotización. Envía una propuesta cuando estés listo."
                : labels.noQuoteYet}
            </Text>
          </View>
        )}

        {isVendorViewer && isAcceptedHere ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>{labels.contactDetails}</Text>
            {selectedThread.contactEmail ? (
              <Text onPress={() => void Linking.openURL(`mailto:${selectedThread.contactEmail}`)} style={styles.contactLink}>
                {selectedThread.contactEmail}
              </Text>
            ) : null}
            {selectedThread.contactPhone ? (
              <Text onPress={() => void Linking.openURL(`tel:${selectedThread.contactPhone}`)} style={styles.contactLink}>
                {selectedThread.contactPhone}
              </Text>
            ) : null}
            {!selectedThread.contactEmail && !selectedThread.contactPhone ? (
              <Text style={styles.body}>{labels.noContactShared}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.inboxList}>
          {activity.length ? activity.map((item) => {
            if (item.kind === "quote") {
              return (
                <View key={`quote-${item.quote.id}`} style={styles.proposalActivityCard}>
                  <View style={styles.quoteSummaryHeader}>
                    <Text style={styles.messageSender}>
                      {item.quote.version > 1 ? labels.proposalUpdated : labels.proposalSent}
                    </Text>
                    <Text style={styles.inboxAmount}>
                      {formatMoney(item.quote.amountCents, item.quote.currency, language)}
                    </Text>
                  </View>
                  {item.quote.message ? <Text style={styles.messageBody}>{item.quote.message}</Text> : null}
                  <Text style={styles.inboxMeta}>{new Date(item.quote.createdAt).toLocaleString()}</Text>
                </View>
              );
            }

            const ownMessage = item.inboxMessage.senderRole === (isVendorViewer ? "vendor" : "client");
            return (
              <View
                key={`message-${item.inboxMessage.id}`}
                style={[styles.messageBubble, ownMessage ? styles.messageBubbleOwn : styles.messageBubbleOther]}
              >
                <Text style={styles.messageSender}>
                  {ownMessage
                    ? labels.you
                    : item.inboxMessage.senderRole === "client"
                      ? labels.client
                      : labels.vendor}
                </Text>
                <Text style={styles.messageBody}>{item.inboxMessage.body}</Text>
                <Text style={styles.inboxMeta}>{new Date(item.inboxMessage.createdAt).toLocaleString()}</Text>
              </View>
            );
          }) : <Text style={styles.body}>{labels.noConversation}</Text>}
        </View>

        {conversationClosed ? (
          <View style={styles.panel}>
            <Text style={styles.body}>{labels.conversationClosed}</Text>
          </View>
        ) : null}

        {isVendorViewer && !selectedThread.acceptedQuoteId && !conversationClosed ? (
          <View style={styles.replyComposer}>
            <Text style={styles.sectionTitle}>
              {selectedThread.latestQuote ? labels.updateQuote : labels.sendQuote}
            </Text>
            <FieldLabel text={labels.quoteAmount} />
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.input}
              value={quoteAmount}
              onChangeText={setQuoteAmount}
            />
            <FieldLabel text={labels.quoteDetails} />
            <TextInput
              maxLength={2000}
              multiline
              placeholder={language === "en" ? "Describe what is included" : "Describe lo que está incluido"}
              style={[styles.input, styles.textArea]}
              value={quoteMessage}
              onChangeText={setQuoteMessage}
            />
            <Text style={styles.characterCount}>{quoteMessage.length}/2000</Text>
            <TouchableOpacity
              disabled={isSendingQuote}
              onPress={submitQuote}
              style={[styles.primaryButton, isSendingQuote && styles.primaryButtonDisabled]}
            >
              <Ionicons name="cash-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isSendingQuote ? labels.sending : selectedThread.latestQuote ? labels.updateQuote : labels.sendQuote}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isVendorViewer && selectedThread.latestQuote && !selectedThread.acceptedQuoteId && !conversationClosed ? (
          <View style={styles.replyComposer}>
            <Text style={styles.sectionTitle}>{labels.acceptQuote}</Text>
            <TouchableOpacity onPress={() => setRevealEmail((current) => !current)} style={styles.checkboxRow}>
              <Ionicons name={revealEmail ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
              <Text style={styles.checkboxText}>{labels.shareEmail}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRevealPhone((current) => !current)} style={styles.checkboxRow}>
              <Ionicons name={revealPhone ? "checkbox" : "square-outline"} size={20} color={colors.tealDark} />
              <Text style={styles.checkboxText}>{labels.sharePhone}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isAcceptingQuote}
              onPress={() => {
                Alert.alert(
                  labels.acceptQuote,
                  language === "en"
                    ? "Accept this vendor’s proposal? Your other vendor conversations will stay open."
                    : "¿Aceptar la propuesta de este proveedor? Las otras conversaciones seguirán abiertas.",
                  [
                    { text: language === "en" ? "Cancel" : "Cancelar", style: "cancel" },
                    { text: labels.acceptQuote, onPress: () => void acceptQuote() },
                  ]
                );
              }}
              style={[styles.primaryButton, isAcceptingQuote && styles.primaryButtonDisabled]}
            >
              <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isAcceptingQuote ? labels.acceptingQuote : labels.acceptQuote}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!conversationClosed ? (
          <View style={styles.replyComposer}>
            <FieldLabel text={labels.reply} />
            <TextInput
              maxLength={2000}
              multiline
              placeholder={language === "en" ? "Write your message" : "Escribe tu mensaje"}
              style={[styles.input, styles.textArea]}
              value={replyBody}
              onChangeText={setReplyBody}
              editable={!isSending}
            />
            <Text style={styles.characterCount}>{replyBody.length}/2000</Text>
            <TouchableOpacity disabled={isSending} onPress={submitReply} style={[styles.primaryButton, isSending && styles.primaryButtonDisabled]}>
              <Ionicons name="chatbubble-ellipses-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{isSending ? labels.sending : labels.sendReply}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity disabled={isLoading} onPress={() => void refreshInbox()} style={styles.backButtonInline}>
        <Ionicons name="refresh-outline" size={18} color={colors.tealDark} />
        <Text style={styles.backButtonText}>{labels.refresh}</Text>
      </TouchableOpacity>
      <View style={styles.dashboardHero}>
        <Text style={styles.kicker}>{labels.inbox}</Text>
        <Text style={styles.title}>{labels.inboxTitle}</Text>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>
      {(inboxPage>1 || inboxPage*50<totalThreads) && <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:16}}>
        <TouchableOpacity disabled={inboxPage<=1} onPress={()=>setInboxPage(value=>value-1)}><Text>{language === "es" ? "Anterior" : "Previous"}</Text></TouchableOpacity>
        <Text>{inboxPage} / {Math.max(inboxPage,Math.ceil(totalThreads/50))}</Text>
        <TouchableOpacity disabled={inboxPage*50>=totalThreads} onPress={()=>setInboxPage(value=>value+1)}><Text>{language === "es" ? "Siguiente" : "Next"}</Text></TouchableOpacity>
      </View>}
      {threads.length ? (
        <View style={styles.inboxList}>
          {threads.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => void openThread(item)} style={styles.inboxCard}>
              <View style={styles.inboxIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inboxTitle}>{item.title}</Text>
                <Text style={styles.inboxSubtitle}>{item.subtitle}</Text>
                <Text style={styles.inboxMeta}>{item.meta}</Text>
              </View>
              {item.latestQuote ? (
                <Text style={styles.inboxAmount}>{formatMoney(item.latestQuote.amountCents, item.latestQuote.currency, language)}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.title}>{labels.noInbox}</Text>
        </View>
      )}
    </View>
  );
}
