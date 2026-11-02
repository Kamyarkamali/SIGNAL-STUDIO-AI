"use client";

import { useEffect, useRef } from "react";
import type { AudioClip } from "@/lib/audio/audio-schema";
import { audioSourceTimeAtProjectFrame } from "@/lib/scenes/timeline-projection";
import { audioAssetUrl } from "@/lib/audio/audio-urls";

/** Plays saved audio clips against the project's integer-frame transport. */
export function AudioTimelinePlayback({ projectId, clips, fps, frame, playing }: {
  projectId: string | null; clips: readonly AudioClip[]; fps: number; frame: number; playing: boolean;
}) {
  const players = useRef(new Map<string, { element: HTMLAudioElement; gain: GainNode | null }>());
  const audioContext = useRef<AudioContext | null>(null);
  useEffect(() => {
    const active = new Set<string>();
    if (projectId && playing && Number.isFinite(fps) && fps > 0) {
      for (const clip of clips) {
        const sourceTime = audioSourceTimeAtProjectFrame(clip, frame, fps);
        if (sourceTime === null) continue;
        active.add(clip.id);
        let player = players.current.get(clip.id);
        if (!player) {
          const element = new Audio(audioAssetUrl(projectId, clip.assetId));
          element.preload = "auto";
          let gain: GainNode | null = null;
          const AudioContextConstructor = window.AudioContext;
          if (AudioContextConstructor) {
            try {
              const context = audioContext.current ?? (audioContext.current = new AudioContextConstructor());
              const source = context.createMediaElementSource(element);
              gain = context.createGain();
              source.connect(gain);
              gain.connect(context.destination);
            } catch {
              // Fall back to the browser's 0–1 media volume when Web Audio is unavailable.
            }
          }
          player = { element, gain };
          players.current.set(clip.id, player);
        }
        if (player.gain) player.gain.gain.value = clip.muted ? 0 : clip.gain;
        else player.element.volume = clip.muted ? 0 : Math.max(0, Math.min(1, clip.gain));
        if (audioContext.current?.state === "suspended") void audioContext.current.resume().catch(() => undefined);
        if (player.element.paused || Math.abs(player.element.currentTime - sourceTime) > 0.3) player.element.currentTime = Math.max(0, sourceTime);
        if (player.element.paused) void player.element.play().catch(() => undefined);
      }
    }
    for (const [id, player] of players.current) if (!active.has(id)) player.element.pause();
  }, [projectId, clips, fps, frame, playing]);

  useEffect(() => () => {
    for (const player of players.current.values()) { player.element.pause(); player.element.removeAttribute("src"); player.element.load(); }
    players.current.clear();
    void audioContext.current?.close().catch(() => undefined);
    audioContext.current = null;
  }, []);
  return null;
}
