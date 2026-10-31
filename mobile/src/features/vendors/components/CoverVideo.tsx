import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { styles } from '../../../theme/styles';
export function CoverVideo({ url, visible, language }: {
    url: string;
    visible: boolean;
    language: 'en' | 'es';
}) {
    const [active, setActive] = useState(AppState.currentState === 'active');
    const [reduced, setReduced] = useState(true), [requested, setRequested] = useState(false), [paused, setPaused] = useState(false);
    const player = useVideoPlayer(url, instance => { instance.muted = true; instance.loop = true; instance.staysActiveInBackground = false; });
    const { status } = useEvent(player, 'statusChange', { status: player.status });
    useEffect(() => { let mounted = true; void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted)
        setReduced(value); }); const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced); const app = AppState.addEventListener('change', state => setActive(state === 'active')); return () => { mounted = false; motion.remove(); app.remove(); }; }, []);
    useEffect(() => { if (visible && active && !paused && (!reduced || requested))
        player.play();
    else
        player.pause(); }, [visible, active, paused, reduced, requested, player]);
    if (status === 'error')
        return null;
    const playing = visible && active && !paused && (!reduced || requested);
    return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    {(!reduced || requested) && status === 'readyToPlay' ? <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" surfaceType="textureView" nativeControls={false} allowsPictureInPicture={false}/> : null}
    <TouchableOpacity style={[styles.detailIconButton, { position: 'absolute', bottom: 16, left: 16, zIndex: 5 }]} accessibilityRole="button" accessibilityLabel={language === 'es' ? (playing ? 'Pausar video' : 'Reproducir video') : (playing ? 'Pause video' : 'Play video')} onPress={() => { setRequested(true); setPaused(playing); }}><Text>{playing ? 'Ⅱ' : '▶'}</Text></TouchableOpacity>
  </View>;
}
