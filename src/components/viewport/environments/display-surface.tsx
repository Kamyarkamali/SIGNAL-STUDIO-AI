"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Color, LinearFilter, SRGBColorSpace, Texture, TextureLoader, VideoTexture } from "three";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { displayFit } from "@/lib/environments/display-fit";
import { laptopVisualSpec } from "@/lib/environments/studio-visual-spec";

type Assignment = ProjectDocument["displayAssignments"][string];

export function DisplaySurface({ assignment, url, playing }: { assignment?: Assignment; url?: string; playing: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const surface = laptopVisualSpec.screenSurfaceSize;
  const [content, setContent] = useState<{ texture: Texture; width: number; height: number } | null>(null);
  const textureRef = useRef<Texture | null>(null);
  const displayState = assignment?.state;
  useEffect(() => {
    if (!displayState || displayState === "off" || !url) return;
    let alive = true;
    if (displayState === "image") {
      const loader = new TextureLoader();
      const texture = loader.load(url, (loaded) => {
        if (!alive) { loaded.dispose(); return; }
        loaded.colorSpace = SRGBColorSpace;
        loaded.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        const image = loaded.image as HTMLImageElement;
        textureRef.current = loaded;
        setContent({ texture: loaded, width: image.naturalWidth, height: image.naturalHeight });
        invalidate();
      });
      return () => { alive = false; texture.dispose(); textureRef.current = null; setContent(null); };
    }
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "same-origin";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    const texture = new VideoTexture(video);
    textureRef.current = texture;
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    const ready = () => { if (alive) { setContent({ texture, width: video.videoWidth, height: video.videoHeight }); invalidate(); } };
    video.addEventListener("loadedmetadata", ready);
    video.load();
    return () => { alive = false; video.pause(); video.removeAttribute("src"); video.load(); texture.dispose(); textureRef.current = null; setContent(null); };
  }, [displayState, url, gl, invalidate]);

  useEffect(() => {
    if (!content) return;
    const fit = displayFit(surface[0], surface[1], content.width, content.height, assignment?.fit ?? "contain");
    const texture = textureRef.current;
    if (!texture) return;
    texture.repeat.set(fit.repeatX, fit.repeatY);
    texture.offset.set(fit.offsetX, fit.offsetY);
    texture.needsUpdate = true;
    invalidate();
  }, [content, assignment?.fit, invalidate, surface]);

  useEffect(() => {
    const texture = content?.texture;
    const video = texture instanceof VideoTexture ? texture.image as HTMLVideoElement : null;
    if (!video) return;
    if (!playing) { video.pause(); return; }
    let frame = 0;
    const frameVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    let videoFrame = 0;
    const tick = () => {
      invalidate();
      if (frameVideo.requestVideoFrameCallback) videoFrame = frameVideo.requestVideoFrameCallback(tick);
      else frame = requestAnimationFrame(tick);
    };
    void video.play().then(() => {
      if (frameVideo.requestVideoFrameCallback) videoFrame = frameVideo.requestVideoFrameCallback(tick);
      else frame = requestAnimationFrame(tick);
    }).catch(() => undefined);
    return () => {
      cancelAnimationFrame(frame);
      if (videoFrame) frameVideo.cancelVideoFrameCallback?.(videoFrame);
      video.pause();
    };
  }, [content, playing, invalidate]);

  if (!content || !assignment || assignment.state === "off") return null;
  const fit = displayFit(surface[0], surface[1], content.width, content.height, assignment.fit);
  return <group>
    <mesh name="display-media" position={[laptopVisualSpec.screenCenter[0], laptopVisualSpec.screenCenter[1], laptopVisualSpec.screenCenter[2] + 0.002]}>
      <planeGeometry args={[fit.width, fit.height]} />
      <meshBasicMaterial map={content.texture} color={new Color(assignment.brightness, assignment.brightness, assignment.brightness)} toneMapped={false} />
    </mesh>
    <mesh position={[-0.3, laptopVisualSpec.screenCenter[1], laptopVisualSpec.screenCenter[2] + 0.004]} rotation={[0, 0, -0.32]} raycast={() => null}>
      <planeGeometry args={[0.075, laptopVisualSpec.screenSurfaceSize[1] * 0.9]} />
      <meshBasicMaterial color="#e4f4ef" transparent opacity={0.035} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
}
