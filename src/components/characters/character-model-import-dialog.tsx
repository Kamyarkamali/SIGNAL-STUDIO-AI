"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Box3,
  Box3Helper,
  Mesh,
  Texture,
  Vector3,
  type Material,
  type Object3D,
} from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  inspectCharacterGlb,
  validateGlbContainer,
  type CharacterGlbMetadata,
} from "@/lib/characters/character-glb";
import type { ProjectDocument } from "@/lib/projects/project-schema";

type Candidate = { gltf: GLTF; inspection: CharacterGlbMetadata };
type View = "front" | "side" | "back" | "reset";
const button =
  "min-h-8 rounded-md border border-[#536276] px-2.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";

function disposePreview(root: Object3D) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      for (const value of Object.values(material))
        if (value instanceof Texture) value.dispose();
      (material as Material).dispose();
    }
  });
}

function PreviewCamera({ view, height }: { view: View; height: number }) {
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    const distance = Math.max(2.6, height * 1.8);
    const positions: Record<View, [number, number, number]> = {
      front: [0, height * 0.52, distance],
      side: [distance, height * 0.52, 0],
      back: [0, height * 0.52, -distance],
      reset: [distance * 0.65, height * 0.8, distance],
    };
    camera.position.set(...positions[view]);
    camera.lookAt(0, height * 0.48, 0);
    const orbit = controls as
      | (typeof controls & { target?: Vector3; update?: () => void })
      | null;
    if (orbit?.target) {
      orbit.target.set(0, height * 0.48, 0);
      orbit.update?.();
    }
    invalidate();
  }, [view, height, camera, controls, invalidate]);
  return null;
}

function PreviewModel({
  candidate,
  scale,
  orientation,
  showBounds,
}: {
  candidate: Candidate;
  scale: number;
  orientation: number;
  showBounds: boolean;
}) {
  const bounds = useMemo(
    () => new Box3().setFromObject(candidate.gltf.scene),
    [candidate],
  );
  const helper = useMemo(() => new Box3Helper(bounds, "#5ee0ce"), [bounds]);
  const root = useMemo(() => candidate.gltf.scene, [candidate]);
  useEffect(
    () => () => {
      helper.geometry.dispose();
      for (const material of Array.isArray(helper.material)
        ? helper.material
        : [helper.material])
        material.dispose();
    },
    [helper],
  );
  return (
    <group scale={scale} rotation-y={orientation}>
      <group position-y={-bounds.min.y}>
        <primitive object={root} />
        {showBounds && <primitive object={helper} />}
      </group>
    </group>
  );
}

export function CharacterModelImportDialog({
  projectId,
  onBeforeImport,
  onImported,
}: {
  projectId: string;
  onBeforeImport: () => Promise<boolean>;
  onImported: (project: ProjectDocument) => void;
}) {
  const [open, setOpen] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [targetHeight, setTargetHeight] = useState(1.5);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [seatOffset, setSeatOffset] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);
  const [view, setView] = useState<View>("reset");
  const [showBounds, setShowBounds] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(
    () => () => {
      if (candidate) disposePreview(candidate.gltf.scene);
    },
    [candidate],
  );
  const dismiss = () => {
    if (busy) return;
    dialog.current?.close();
    setOpen(false);
    setCandidate(null);
    setError("");
    setStage("");
    setProgress(null);
    if (input.current) input.current.value = "";
  };

  const chooseFile = async (file?: File) => {
    setCandidate(null);
    setError("");
    setStage("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError("پسوند فایل باید ‎.glb باشد.");
      if (input.current) input.current.value = "";
      return;
    }
    if (file.size <= 0 || file.size > 64 * 1024 * 1024) {
      setError("حجم فایل باید بیشتر از صفر و حداکثر ۶۴ مگابایت باشد.");
      if (input.current) input.current.value = "";
      return;
    }
    try {
      setStage("در حال بررسی و آماده‌سازی پیش‌نمایش مدل…");
      const bytes = await file.arrayBuffer();
      validateGlbContainer(bytes);
      const gltf = await new GLTFLoader().parseAsync(bytes, "");
      const inspection = inspectCharacterGlb(gltf);
      setCandidate({ gltf, inspection });
      setName(file.name.replace(/\.glb$/i, "").slice(0, 120));
      setTargetHeight(
        Math.min(
          3,
          Math.max(0.25, Number(inspection.bounds.size[1].toFixed(2))),
        ),
      );
      setStage("");
      setOpen(true);
    } catch (cause) {
      setStage("");
      setError(
        cause instanceof Error ? cause.message : "خواندن فایل GLB ممکن نشد.",
      );
      if (input.current) input.current.value = "";
    }
  };

  const upload = async () => {
    const file = input.current?.files?.[0];
    if (!candidate || !file || !name.trim() || busy) return;
    setBusy(true);
    setError("");
    setStage("در حال ذخیره در دارایی‌های همین پروژه…");
    setProgress(null);
    try {
      if (!(await onBeforeImport()))
        throw new Error(
          "ابتدا تغییرات پروژه را ذخیره کنید و دوباره تلاش کنید.",
        );
      const form = new FormData();
      form.set("file", file);
      form.set("name", name.trim());
      form.set("inspection", JSON.stringify(candidate.inspection));
      form.set("heightMeters", String(targetHeight));
      form.set("rotationRadians", String((rotationDegrees * Math.PI) / 180));
      form.set("seatingOffsetY", String(seatOffset));
      const project = await new Promise<ProjectDocument>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(
          "POST",
          `/api/projects/${encodeURIComponent(projectId)}/character-assets`,
        );
        request.upload.onprogress = (event) => {
          if (event.lengthComputable)
            setProgress(Math.round((event.loaded / event.total) * 100));
        };
        request.onerror = () =>
          reject(new Error("ذخیرهٔ مدل به پروژه انجام نشد."));
        request.onload = () => {
          let body: { error?: { message?: string } } & Partial<ProjectDocument>;
          try {
            body = JSON.parse(request.responseText);
          } catch {
            reject(new Error("پاسخ ذخیره‌سازی مدل قابل خواندن نیست."));
            return;
          }
          if (request.status < 200 || request.status >= 300)
            reject(new Error(body.error?.message ?? "ذخیرهٔ مدل انجام نشد."));
          else resolve(body as ProjectDocument);
        };
        request.send(form);
      });
      onImported(project);
      dismiss();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "وارد کردن مدل انجام نشد.",
      );
    } finally {
      setBusy(false);
      setStage("");
      setProgress(null);
    }
  };

  return (
    <>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept=".glb,model/gltf-binary"
        aria-label="انتخاب فایل GLB"
        onChange={(event) => void chooseFile(event.currentTarget.files?.[0])}
      />
      <button
        type="button"
        className={button}
        disabled={!projectId || busy}
        onClick={() => {
          setError("");
          input.current?.click();
        }}
      >
        وارد کردن مدل سه‌بعدی
      </button>
      {(error || stage) && !open && (
        <p
          role={error ? "alert" : "status"}
          className={`mt-2 text-xs ${error ? "text-red-200" : "text-muted"}`}
        >
          {error || stage}
        </p>
      )}
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else dismiss();
        }}
        aria-labelledby="glb-import-title"
        className="m-auto w-[min(94vw,760px)] max-h-[90dvh] overflow-y-auto rounded-xl border border-line bg-surface p-4 text-foreground shadow-2xl backdrop:bg-black/35"
        onClose={() => {
          if (!busy) {
            setOpen(false);
            setCandidate(null);
            if (input.current) input.current.value = "";
          }
        }}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="glb-import-title" className="text-base font-bold">
              پیش‌نمایش و تنظیم مدل
            </h2>
            <p className="mt-1 text-xs text-muted">
              فایل هنوز به پروژه اضافه نشده است.
            </p>
          </div>
          <button className={button} disabled={busy} onClick={dismiss}>
            انصراف
          </button>
        </header>
        {candidate && (
          <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
            <div className="min-w-0">
              <div className="h-[250px] overflow-hidden rounded-lg border border-line bg-[#14212c]">
                <Canvas
                  frameloop="demand"
                  dpr={[1, 1.25]}
                  camera={{ position: [2.8, 1.5, 3.4], fov: 42 }}
                  gl={{
                    antialias: false,
                    alpha: false,
                    powerPreference: "low-power",
                  }}
                >
                  <color attach="background" args={["#14212c"]} />
                  <ambientLight intensity={1.25} />
                  <directionalLight position={[3, 5, 4]} intensity={2} />
                  <PreviewCamera view={view} height={targetHeight} />
                  <PreviewModel
                    candidate={candidate}
                    scale={
                      (previewScale * targetHeight) /
                      candidate.inspection.bounds.size[1]
                    }
                    orientation={(rotationDegrees * Math.PI) / 180}
                    showBounds={showBounds}
                  />
                  <OrbitControls
                    makeDefault
                    enableDamping={false}
                    minDistance={0.4}
                    maxDistance={15}
                  />
                </Canvas>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button className={button} onClick={() => setView("front")}>
                  جلو
                </button>
                <button className={button} onClick={() => setView("side")}>
                  پهلو
                </button>
                <button className={button} onClick={() => setView("back")}>
                  پشت
                </button>
                <button className={button} onClick={() => setView("reset")}>
                  بازنشانی دوربین
                </button>
                <button
                  className={button}
                  aria-pressed={showBounds}
                  onClick={() => setShowBounds((value) => !value)}
                >
                  کادر ابعاد
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted" dir="ltr">
                Bounds:{" "}
                {candidate.inspection.bounds.size
                  .map((value) => value.toFixed(2))
                  .join(" × ")}{" "}
                m · {candidate.inspection.meshNames.length} meshes
              </p>
            </div>
            <div className="grid content-start gap-2.5 text-xs">
              <label className="grid gap-1">
                نام مدل
                <input
                  className="min-h-9 rounded-md border border-[#536276] bg-[#101722] px-2"
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="grid gap-1">
                ارتفاع مدل (متر)
                <input
                  className="min-h-9 rounded-md border border-[#536276] bg-[#101722] px-2"
                  type="number"
                  min="0.25"
                  max="3"
                  step="0.05"
                  value={targetHeight}
                  onChange={(event) =>
                    setTargetHeight(Number(event.target.value))
                  }
                />
              </label>
              <label className="grid gap-1">
                جهت روبه‌رو (درجه)
                <input
                  className="min-h-9 rounded-md border border-[#536276] bg-[#101722] px-2"
                  type="number"
                  min="-180"
                  max="180"
                  step="15"
                  value={rotationDegrees}
                  onChange={(event) =>
                    setRotationDegrees(Number(event.target.value))
                  }
                />
              </label>
              <label className="grid gap-1">
                پیش‌نمایش اندازه
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={previewScale}
                  onChange={(event) =>
                    setPreviewScale(Number(event.target.value))
                  }
                />
              </label>
              <label className="grid gap-1">
                اصلاح نشستن (متر)
                <input
                  className="min-h-9 rounded-md border border-[#536276] bg-[#101722] px-2"
                  type="number"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={seatOffset}
                  onChange={(event) =>
                    setSeatOffset(Number(event.target.value))
                  }
                />
              </label>
              <details className="border-t border-line pt-2">
                <summary className="cursor-pointer font-semibold">
                  اطلاعات فنی مدل
                </summary>
                <div className="mt-2 grid gap-1 text-muted">
                  <span>
                    استخوان‌بندی شناسایی‌شده:{" "}
                    {candidate.inspection.skeletonCount}
                  </span>
                  <span>
                    هدف‌های تغییرشکل:{" "}
                    {candidate.inspection.morphTargetNames.length}
                  </span>
                  <span>
                    کلیپ‌های انیمیشن:{" "}
                    {candidate.inspection.animationNames.length}
                  </span>
                  <span>
                    جنس‌ها:{" "}
                    {candidate.inspection.materialNames
                      .slice(0, 8)
                      .join("، ") || "ندارد"}
                  </span>
                  <span>
                    مش‌ها:{" "}
                    {candidate.inspection.meshNames.slice(0, 8).join("، ") ||
                      "ندارد"}
                  </span>
                  <span>
                    این داده‌ها شناسایی ساختار هستند؛ به معنی پشتیبانی اجرایی
                    انیمیشن نیستند.
                  </span>
                </div>
              </details>
            </div>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-red-500/50 bg-red-950/30 p-2 text-xs leading-6 text-red-100"
          >
            {error}
          </p>
        )}
        {busy && (
          <div className="mt-3">
            <p role="status" className="text-xs">
              {stage}
              {progress !== null ? ` ${progress}%` : ""}
            </p>
            <progress
              className="mt-1 h-1.5 w-full accent-[#5ee0ce]"
              max="100"
              value={progress ?? undefined}
            />
          </div>
        )}
        <footer className="mt-4 flex justify-end gap-2">
          <button className={button} disabled={busy} onClick={dismiss}>
            انصراف
          </button>
          <button
            className={`${button} border-accent bg-[#19433f]`}
            disabled={
              busy ||
              !candidate ||
              !name.trim() ||
              !Number.isFinite(targetHeight) ||
              targetHeight < 0.25 ||
              targetHeight > 3 ||
              !Number.isFinite(rotationDegrees) ||
              Math.abs(rotationDegrees) > 180 ||
              !Number.isFinite(seatOffset) ||
              Math.abs(seatOffset) > 0.5
            }
            onClick={() => void upload()}
          >
            {busy ? "در حال وارد کردن…" : "تأیید و افزودن به کتابخانه"}
          </button>
        </footer>
      </dialog>
    </>
  );
}
