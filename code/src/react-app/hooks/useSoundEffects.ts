import { useCallback, useRef, useEffect } from 'react';

// Free sound URLs from freesound.org (creative commons)
const SOUND_URLS = {
  chainsawStart: 'https://cdn.freesound.org/previews/352/352651_5121236-lq.mp3',
  chainsawLoop: 'https://cdn.freesound.org/previews/352/352652_5121236-lq.mp3',
  chainsawAttack: 'https://cdn.freesound.org/previews/369/369981_3162766-lq.mp3',
  slash: 'https://cdn.freesound.org/previews/573/573659_3162766-lq.mp3',
  hit: 'https://cdn.freesound.org/previews/512/512772_9497060-lq.mp3',
  block: 'https://cdn.freesound.org/previews/351/351518_5121236-lq.mp3',
  transform: 'https://cdn.freesound.org/previews/518/518308_11243133-lq.mp3',
};

type SoundName = keyof typeof SOUND_URLS;

export function useSoundEffects() {
  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const loopingAudio = useRef<HTMLAudioElement | null>(null);

  // Preload sounds
  useEffect(() => {
    Object.entries(SOUND_URLS).forEach(([name, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.4;
      audioCache.current.set(name as SoundName, audio);
    });

    return () => {
      // Cleanup
      if (loopingAudio.current) {
        loopingAudio.current.pause();
      }
      audioCache.current.clear();
    };
  }, []);

  const playSound = useCallback((name: SoundName, volume = 0.4) => {
    const cached = audioCache.current.get(name);
    if (cached) {
      // Clone the audio to allow overlapping plays
      const audio = cached.cloneNode() as HTMLAudioElement;
      audio.volume = volume;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, []);

  const startChainsawLoop = useCallback(() => {
    const audio = audioCache.current.get('chainsawLoop');
    if (audio && !loopingAudio.current) {
      const loopAudio = audio.cloneNode() as HTMLAudioElement;
      loopAudio.loop = true;
      loopAudio.volume = 0.25;
      loopAudio.play().catch(() => {});
      loopingAudio.current = loopAudio;
    }
  }, []);

  const stopChainsawLoop = useCallback(() => {
    if (loopingAudio.current) {
      loopingAudio.current.pause();
      loopingAudio.current.currentTime = 0;
      loopingAudio.current = null;
    }
  }, []);

  return {
    playSound,
    startChainsawLoop,
    stopChainsawLoop,
  };
}
