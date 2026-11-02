"use client";

import { useEffect, useMemo, useState } from "react";
import { SRGBColorSpace, Texture, TextureLoader } from "three";
import { displayFit } from "@/lib/environments/display-fit";

export function ArtworkSurface({ url, size, fit = "contain", z = 0 }: {
  url?: string; size: [number, number]; fit?: "contain" | "cover"; z?: number;
}) {
  const [loaded, setLoaded] = useState<{ url: string; texture: Texture; width: number; height: number } | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    const texture = new TextureLoader().load(url, (result) => {
      if (!alive) { result.dispose(); return; }
      result.colorSpace = SRGBColorSpace;
      setLoaded({ url, texture: result, width: (result.image as HTMLImageElement).naturalWidth, height: (result.image as HTMLImageElement).naturalHeight });
    }, undefined, () => undefined);
    return () => { alive = false; texture.dispose(); };
  }, [url]);
  if (!url || !loaded || loaded.url !== url) return null;
  return <FittedArtworkSurface loaded={loaded} size={size} fit={fit} z={z} />;
}

function FittedArtworkSurface({ loaded, size, fit, z }: {
  loaded: { url: string; texture: Texture; width: number; height: number }; size: [number, number]; fit: "contain" | "cover"; z: number;
}) {
  const fitResult = displayFit(size[0], size[1], loaded.width, loaded.height, fit);
  const fittedTexture = useMemo(() => {
    const texture: Texture = loaded.texture.clone();
    texture.repeat.set(fitResult.repeatX, fitResult.repeatY);
    texture.offset.set(fitResult.offsetX, fitResult.offsetY);
    texture.needsUpdate = true;
    return texture;
  }, [loaded.texture, fitResult.repeatX, fitResult.repeatY, fitResult.offsetX, fitResult.offsetY]);
  useEffect(() => () => fittedTexture.dispose(), [fittedTexture]);
  return <mesh position={[0, 0, z]}>
    <planeGeometry args={[fitResult.width, fitResult.height]} />
    <meshBasicMaterial map={fittedTexture} toneMapped={false} />
  </mesh>;
}
