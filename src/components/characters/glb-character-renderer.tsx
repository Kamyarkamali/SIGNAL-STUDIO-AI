"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import type {
  CharacterCustomization,
  CharacterModelDefinition,
} from "@/lib/characters/character-registry";
import {
  createCharacterGlbInstance,
  loadCharacterGlb,
  releaseCharacterGlb,
} from "@/lib/characters/character-glb";

type Loaded = Awaited<ReturnType<typeof loadCharacterGlb>>;

export function GlbCharacterRenderer({
  model,
  appearance,
  fallback,
}: {
  model: CharacterModelDefinition;
  appearance: CharacterCustomization;
  fallback: ReactNode;
}) {
  const [loaded, setLoaded] = useState<{ url: string; asset: Loaded } | null>(
    null,
  );
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = model.glb?.url;
  useEffect(() => {
    if (!url) return;
    let mounted = true;
    loadCharacterGlb(model)
      .then((asset) => {
        if (mounted) {
          setLoaded({ url, asset });
          setFailedUrl(null);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoaded(null);
          setFailedUrl(url);
        }
      });
    return () => {
      mounted = false;
      releaseCharacterGlb(model);
    };
  }, [model, url]);
  const active = loaded && loaded.url === url ? loaded.asset : null;
  const instance = useMemo(
    () =>
      active
        ? createCharacterGlbInstance(active.gltf, model, appearance)
        : null,
    [active, model, appearance],
  );
  useEffect(() => () => instance?.dispose(), [instance]);
  return (
    <group name="glb-character-adapter">
      {instance ? (
        <primitive object={instance.scene} dispose={null} />
      ) : (
        fallback
      )}
      {!instance && (
        <Html
          position={[0, 2.05, 0]}
          center
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <span
            role="status"
            className="rounded-md border border-[#536276] bg-[#101722] px-2 py-1 text-[11px] text-[#dce8f0]"
          >
            {failedUrl === url
              ? "مدل سه‌بعدی در دسترس نیست؛ نمایش جایگزین فعال است."
              : "در حال بارگذاری مدل سه‌بعدی…"}
          </span>
        </Html>
      )}
    </group>
  );
}
