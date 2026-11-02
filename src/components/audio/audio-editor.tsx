"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { audioAssetUrl } from "@/lib/audio/audio-urls";
import { sourceDraftValues } from "@/lib/audio/audio-source-draft";
import { validateAudioCollections, type AudioProjectCollections, type AudioClip, type SpeakerRegion } from "@/lib/audio/audio-schema";
import { clipSceneRelation, clipSourceDurationFrames, createSceneAudioClip, sceneLocalPlacementToGlobalFrame } from "@/lib/audio/audio-placement";
import { mergeAdjacentSpeakerRegions, splitSpeakerRegion } from "@/lib/audio/audio-operations";
import { audioClipFrameRange } from "@/lib/scenes/timeline-projection";
import type { ProjectDocument } from "@/lib/projects/project-schema";

const control = "min-h-9 rounded-md border border-line bg-[#111a26] px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";
const uuid = () => crypto.randomUUID();

async function decodeWaveform(source: Blob | ArrayBuffer): Promise<{ duration: number; peaks: number[] }> {
  const context = new AudioContext();
  try {
    const bytes = source instanceof Blob ? await source.arrayBuffer() : source;
    const buffer = await context.decodeAudioData(bytes.slice(0));
    const count = 180;
    const channel = buffer.getChannelData(0);
    const peaks = Array.from({ length: count }, (_, index) => {
      const from = Math.floor(index * channel.length / count);
      const to = Math.max(from + 1, Math.floor((index + 1) * channel.length / count));
      let peak = 0;
      for (let sample = from; sample < Math.min(to, channel.length); sample++) peak = Math.max(peak, Math.abs(channel[sample] ?? 0));
      return peak;
    });
    return { duration: buffer.duration, peaks };
  } finally { await context.close(); }
}

function time(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toFixed(2).padStart(5, "0")}`; }

export function AudioEditor({ project, audio, fps, busy, projectEndFrame, onHelp, onUpload, onDelete, onReplace, onEdit, onSelectClip, scene, initialSelection }: {
  project: ProjectDocument | null; audio: AudioProjectCollections; fps: number; busy: boolean;
  projectEndFrame: number;
  scene: { id: string; name: string; startFrame: number; durationFrames: number; localFrame: number } | null;
  onHelp: (topic: ContextHelpId) => void; onUpload: (file: File, durationSeconds: number) => Promise<{ assetId: string; durationSeconds: number } | null>;
  onDelete: (assetId: string) => Promise<boolean>; onReplace: (assetId: string, file: File, durationSeconds: number) => Promise<boolean>;
  onEdit: (update: (current: AudioProjectCollections) => AudioProjectCollections) => void;
  onSelectClip: (assetId: string | null, clipId: string | null, regionId?: string) => void;
  initialSelection?: { assetId: string; clipId: string; regionId?: string } | null;
}) {
  const assets = useMemo(() => Object.values(project?.assetManifest ?? {}).filter((asset) => asset.kind === "audio"), [project?.assetManifest]);
  const identities = project?.characterIdentities ?? {};
  const clips = Object.values(audio.audioClips).sort((a, b) => a.startFrame - b.startFrame || a.id.localeCompare(b.id));
  const [localSelection, setLocalSelection] = useState<{ assetId: string; clipId: string | null; regionId: string }>({ assetId: "", clipId: null, regionId: "" });
  const [waveform, setWaveform] = useState<number[]>([]);
  const [waveError, setWaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [speakerKind, setSpeakerKind] = useState<"character" | "audio-only">("character");
  const [characterId, setCharacterId] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [regionDraft, setRegionDraft] = useState<{ clipId: string; start: string; end: string } | null>(null);
  const [regionSpeaker, setRegionSpeaker] = useState("");
  const audioElement = useRef<HTMLAudioElement>(null);
  const [previewEndSeconds, setPreviewEndSeconds] = useState<number | null>(null);
  const [sourceDraft, setSourceDraft] = useState<{ assetId: string; start: string; end: string } | null>(null);
  const [placementDraft, setPlacementDraft] = useState<{ sceneId: string; offset: string; allowSpan: boolean } | null>(null);

  const initialClipSelection = initialSelection && audio.audioClips[initialSelection.clipId] ? initialSelection : null;
  const selection = initialClipSelection ?? localSelection;
  const selectedClip = selection.clipId ? audio.audioClips[selection.clipId] : selection.clipId === null ? clips[0] : undefined;
  const selectedAssetId = selection.assetId || selectedClip?.assetId || "";
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];
  const handleSelectAsset = (assetId: string) => {
    setLocalSelection({ assetId, clipId: "", regionId: "" });
    onSelectClip(null, null);
  };
  const waveformProjectId = project?.id;
  const waveformAssetId = selectedAsset?.id;
  const waveformAssetHash = selectedAsset?.sha256;
  const clip = selectedClip;
  const selectedClipId = clip?.id ?? "";
  const selectedRegionId = selection.regionId;
  const regions = Object.values(audio.speakerRegions).filter((region) => region.audioClipId === clip?.id)
    .sort((a, b) => a.startSeconds - b.startSeconds || a.id.localeCompare(b.id));
  const { start: sourceStartDraft, end: sourceEndDraft } = sourceDraftValues(sourceDraft, selectedAsset);
  const sceneOffsetDraft = placementDraft && scene && placementDraft.sceneId === scene.id ? placementDraft.offset : String(scene?.localFrame ?? 0);
  const allowSceneSpan = placementDraft && scene && placementDraft.sceneId === scene.id ? placementDraft.allowSpan : false;
  const regionStart = regionDraft && clip && regionDraft.clipId === clip.id ? regionDraft.start : String(clip?.sourceStartSeconds ?? 0);
  const regionEnd = regionDraft && clip && regionDraft.clipId === clip.id ? regionDraft.end : clip ? String(Math.min(clip.sourceEndSeconds, clip.sourceStartSeconds + 2)) : "2";

  const playSourceRange = async (assetId: string, clipId: string, startSeconds: number, endSeconds: number, regionId?: string) => {
    const player = audioElement.current;
    if (!player || !project) return;
    const source = audioAssetUrl(project.id, assetId);
    setLocalSelection({ assetId, clipId, regionId: regionId ?? "" });
    onSelectClip(assetId, clipId, regionId);
    if (player.getAttribute("src") !== source) {
      player.src = source; player.load();
      await new Promise<void>((resolve, reject) => {
        player.addEventListener("loadedmetadata", () => resolve(), { once: true });
        player.addEventListener("error", () => reject(new Error("media")), { once: true });
      });
    }
    player.currentTime = startSeconds; setPreviewEndSeconds(endSeconds); await player.play();
  };

  useEffect(() => {
    if (!waveformAssetId || !waveformProjectId) return;
    let cancelled = false;
    fetch(audioAssetUrl(waveformProjectId, waveformAssetId), { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("دریافت فایل صوتی ممکن نشد.");
      return response.arrayBuffer();
    }).then((bytes) => decodeWaveform(bytes)).then((result) => {
      if (!cancelled) { setWaveform(result.peaks); setWaveError(""); }
    }).catch((cause: unknown) => { if (!cancelled) { setWaveform([]); setWaveError(cause instanceof Error ? cause.message : "ساخت موج‌نما ممکن نشد."); } });
    return () => { cancelled = true; };
  }, [waveformProjectId, waveformAssetId, waveformAssetHash]);

  const applyUpdate = (update: (current: AudioProjectCollections) => AudioProjectCollections, newlyImported?: { assetId: string; durationSeconds: number }) => {
    if (!project) return false;
    const next = update(audio);
    const audioAssets = Object.fromEntries([...assets.map((asset) => [asset.id, { audioDurationSeconds: asset.audioDurationSeconds }] as const), ...(newlyImported ? [[newlyImported.assetId, { audioDurationSeconds: newlyImported.durationSeconds }] as const] : [])]);
    const problems = validateAudioCollections(next, audioAssets, new Set(Object.keys(identities)));
    if (problems.length) { setError(problems[0]!); return false; }
    setError(""); setNotice(""); onEdit(() => next); return true;
  };

  const submitAudio = async (file?: File, attachToScene = false) => {
    if (!file) return;
    setError(""); setNotice("");
    if (!/\.mp3$/i.test(file.name) && !/\.wav$/i.test(file.name)) { setError("فقط فایل‌های WAV و MP3 پشتیبانی می‌شوند."); return; }
    try {
      const metadata = await decodeWaveform(file);
      const uploaded = await onUpload(file, metadata.duration);
      if (uploaded) {
        if (attachToScene) {
          if (!scene) { setError("برای افزودن مستقیم، ابتدا یک سکانس را انتخاب کنید."); return; }
          const nextClip = createSceneAudioClip({ id: uuid(), assetId: uploaded.assetId, sceneStartFrame: scene.startFrame,
            sceneDurationFrames: scene.durationFrames, localFrame: scene.localFrame, sourceDurationSeconds: uploaded.durationSeconds });
          if (!nextClip) { setError("جایگاه فعلی برای افزودن صدا به این سکانس معتبر نیست."); return; }
          const initialRegion: SpeakerRegion = { id: uuid(), audioClipId: nextClip.id, startSeconds: nextClip.sourceStartSeconds,
            endSeconds: nextClip.sourceEndSeconds, speakerId: null, status: "unknown" };
          if (!applyUpdate((current) => ({ ...current, audioClips: { ...current.audioClips, [nextClip.id]: nextClip },
            speakerRegions: { ...current.speakerRegions, [initialRegion.id]: initialRegion } }), uploaded)) return;
          setLocalSelection({ assetId: uploaded.assetId, clipId: nextClip.id, regionId: initialRegion.id }); onSelectClip(uploaded.assetId, nextClip.id, initialRegion.id);
          setNotice(`«${file.name}» به سکانس «${scene.name}» در فریم ${nextClip.startFrame} اضافه شد.`);
        } else { setLocalSelection({ assetId: uploaded.assetId, clipId: "", regionId: "" }); onSelectClip(null, null); setNotice("فایل صوتی به کتابخانهٔ پروژه اضافه شد."); }
      }
    } catch { setError("خواندن فایل ممکن نشد. یک فایل WAV یا MP3 سالم و قابل‌پخش انتخاب کنید."); }
  };

  const submitReplacement = async (file?: File) => {
    if (!file || !selectedAsset) return;
    try {
      const metadata = await decodeWaveform(file);
      const replaced = await onReplace(selectedAsset.id, file, metadata.duration);
      if (replaced) setNotice("فایل جایگزین شد؛ ارجاع‌های کلیپ حفظ شدند.");
    } catch { setError("خواندن فایل جایگزین ممکن نشد؛ یک فایل WAV یا MP3 سالم انتخاب کنید."); }
  };

  const sourceStart = sourceStartDraft.trim() ? Number(sourceStartDraft) : Number.NaN;
  const sourceEnd = sourceEndDraft.trim() ? Number(sourceEndDraft) : Number.NaN;
  const localOffset = sceneOffsetDraft.trim() ? Number(sceneOffsetDraft) : Number.NaN;
  const placementFrame = scene ? sceneLocalPlacementToGlobalFrame(scene.startFrame, scene.durationFrames, localOffset) : null;
  const sourceFrames = clipSourceDurationFrames(sourceStart, sourceEnd, fps);
  const crossesScene = Boolean(scene && placementFrame !== null && placementFrame + sourceFrames > scene.startFrame + scene.durationFrames);
  const extendsPastProject = Boolean(placementFrame !== null && placementFrame + sourceFrames > projectEndFrame);

  const updateSourceRange = (start: string, end: string) => {
    if (!selectedAsset) return;
    setSourceDraft({ assetId: selectedAsset.id, start, end });
    if (scene) setPlacementDraft({ sceneId: scene.id, offset: sceneOffsetDraft, allowSpan: false });
  };

  const addClipToScene = () => {
    if (!selectedAsset || selectedAsset.audioDurationSeconds === undefined) { setError("فایل انتخاب‌شده مدت معتبر ندارد."); return; }
    if (!scene || placementFrame === null) { setError("برای افزودن صدا، ابتدا یک سکانس و جایگاه معتبر درون آن انتخاب کنید."); return; }
    if (!Number.isFinite(sourceStart) || !Number.isFinite(sourceEnd) || sourceStart < 0 || sourceEnd <= sourceStart || sourceEnd > selectedAsset.audioDurationSeconds) { setError("بازهٔ فایل باید مثبت و داخل مدت صدای اصلی باشد."); return; }
    if (!Number.isSafeInteger(localOffset) || localOffset < 0 || localOffset >= scene.durationFrames) { setError("جایگاه سکانس باید یک فریم صحیح در محدودهٔ همان سکانس باشد."); return; }
    if (crossesScene && !allowSceneSpan) { setError("این صدا از پایان سکانس عبور می‌کند؛ ادامه در سکانس‌های بعدی را صریحاً فعال کنید."); return; }
    const next: AudioClip = { id: uuid(), assetId: selectedAsset.id, startFrame: placementFrame, sourceStartSeconds: sourceStart,
      sourceEndSeconds: sourceEnd, gain: 1, muted: false };
    if (!applyUpdate((current) => ({ ...current, audioClips: { ...current.audioClips, [next.id]: next } }))) return;
    setLocalSelection({ assetId: next.assetId, clipId: next.id, regionId: "" });
    onSelectClip(next.assetId, next.id);
    setNotice(crossesScene ? "کلیپ در زمان سکانس قرار گرفت و بدون برش به سکانس‌های بعدی ادامه دارد." : "کلیپ صدا به سکانس انتخاب‌شده اضافه شد.");
  };

  const addSpeaker = () => {
    if (speakerKind === "character" && !characterId || speakerKind === "audio-only" && !speakerName.trim()) { setError("هویت شخصیت یا نام گوینده را مشخص کنید."); return; }
    const name = speakerKind === "character" ? identities[characterId]?.name : speakerName.trim();
    if (!name) { setError("هویت انتخاب‌شده در پروژه پیدا نشد."); return; }
    const speaker = speakerKind === "character" ? { id: uuid(), kind: "character" as const, characterId, name } : { id: uuid(), kind: "audio-only" as const, name };
    applyUpdate((current) => ({ ...current, speakers: { ...current.speakers, [speaker.id]: speaker } }));
    setRegionSpeaker(speaker.id); setSpeakerName(""); setNotice("گوینده به فهرست پروژه افزوده شد.");
  };

  const addRegion = () => {
    if (!clip) { setError("ابتدا فایل صوتی را به خط زمان اضافه کنید."); return; }
    const start = Number(regionStart), end = Number(regionEnd);
    const speakerId = regionSpeaker && regionSpeaker !== "__silence" ? regionSpeaker : null;
    const region: SpeakerRegion = { id: uuid(), audioClipId: clip.id, startSeconds: start, endSeconds: end,
      speakerId, status: regionSpeaker === "__silence" ? "silence" : speakerId ? "assigned" : "unknown" };
    if (!applyUpdate((current) => ({ ...current, speakerRegions: { ...current.speakerRegions, [region.id]: region } }))) return;
    setLocalSelection({ assetId: clip.assetId, clipId: clip.id, regionId: region.id });
    if (clip) onSelectClip(clip.assetId, clip.id, region.id);
    setNotice("بازهٔ گوینده ثبت شد.");
  };

  if (!project) return <section className="rounded-lg border border-line bg-[#111a25] p-4 text-sm text-muted">برای مدیریت صدا، ابتدا یک پروژه باز کنید.</section>;

  return <section dir="rtl" className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto rounded-lg border border-line bg-[#111a25] p-3 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-bold">فایل‌ها و گویندگان <ContextHelpTrigger topic="audio" onOpen={onHelp} /></h2><p className="mt-1 text-[11px] text-muted">فایل‌ها محلی می‌مانند؛ هیچ صدای نمونه‌ای خودکار اضافه نمی‌شود.</p></div>
      <div className="flex flex-wrap gap-2">
        {scene && <label className={`${control} inline-flex min-h-10 cursor-pointer items-center border-accent/60 bg-[#123b3b] px-4 font-bold`} title={`فایل WAV یا MP3 را وارد می‌کند و در فریم ${scene.startFrame + scene.localFrame} سکانس «${scene.name}» یک کلیپ قابل ویرایش می‌سازد.`}>
          افزودن صدا<input className="sr-only" type="file" accept="audio/wav,audio/x-wav,audio/mpeg,.wav,.mp3" disabled={busy} aria-label={`افزودن و اتصال فایل صوتی به سکانس ${scene.name}`} onChange={(event) => { void submitAudio(event.target.files?.[0], true); event.currentTarget.value = ""; }} />
        </label>}
        <label className={`${control} inline-flex cursor-pointer items-center`} title="یک فایل WAV یا MP3 را فقط به کتابخانهٔ محلی پروژه وارد می‌کند؛ سپس می‌توانید آن را به یک یا چند جایگاه اضافه کنید.">
          افزودن به کتابخانه<input className="sr-only" type="file" accept="audio/wav,audio/x-wav,audio/mpeg,.wav,.mp3" disabled={busy} aria-label="افزودن فایل صوتی WAV یا MP3 به کتابخانهٔ پروژه" onChange={(event) => { void submitAudio(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
      </div>
    </header>
    {!assets.length ? <div className="rounded-md border border-dashed border-line p-5 text-center text-xs leading-6 text-muted">هنوز فایلی وارد نشده است. برای شروع یک فایل گفت‌وگوی ضبط‌شده یا صدای جداگانه انتخاب کنید.</div> : <>
      <div className="grid min-w-0 gap-2 rounded-md border border-line bg-[#0c141e] p-3">
        <div className="flex flex-wrap items-center gap-2"><label htmlFor="audio-asset" className="text-xs font-semibold">فایل صوتی</label><select id="audio-asset" className={`${control} min-w-0 flex-1`} value={selectedAsset?.id ?? ""} onChange={(event) => handleSelectAsset(event.target.value)} title="فایل محلی را برای پخش و قرار دادن در سکانس انتخاب می‌کند.">
          {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName} · {time(asset.audioDurationSeconds ?? 0)}</option>)}
        </select><button className={control} type="button" disabled={!selectedAsset} title="کلیپ این فایل را از پروژه حذف می‌کند؛ اگر در خط زمان باشد ابتدا باید آن کلیپ را حذف کنید." onClick={() => selectedAsset && void onDelete(selectedAsset.id).then((ok) => ok && setNotice("فایل صوتی حذف شد."))}>حذف فایل</button></div>
        <details className="rounded border border-line/70 px-2 py-1.5"><summary className="cursor-pointer text-[11px] text-muted" title="فایل‌های ذخیره‌شده را می‌توانید از اینجا روی سکانس تایم‌لاین بکشید.">کتابخانهٔ صدا · کشیدن به سکانس</summary><div className="mt-2 grid gap-1">{assets.map((asset) => <button key={asset.id} type="button" draggable onClick={() => handleSelectAsset(asset.id)} onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("application/x-signal-audio-asset", asset.id); }} className="min-h-9 rounded border border-line px-2 text-right text-xs focus-visible:outline-2 focus-visible:outline-accent" title={`برای افزودن «${asset.displayName}» به یک سکانس، این ردیف را به سکانس تایم‌لاین بکشید.`}>{asset.displayName} · {time(asset.audioDurationSeconds ?? 0)}</button>)}</div></details>        {selectedAsset && <audio key={selectedAsset.sha256} ref={audioElement} className="w-full" controls preload="metadata" src={audioAssetUrl(project.id, selectedAsset.id)} aria-label={`پخش فایل ${selectedAsset.displayName}`} onTimeUpdate={(event) => { if (previewEndSeconds !== null && event.currentTarget.currentTime >= previewEndSeconds) { event.currentTarget.pause(); setPreviewEndSeconds(null); } }} />}
        {selectedAsset && <label className={`${control} inline-flex w-fit cursor-pointer items-center`} title="محتوای فایل را با فایلی هم‌قالب جایگزین می‌کند و شناسهٔ دارایی و ارجاع‌های کلیپ را حفظ می‌کند.">جایگزینی فایل<input className="sr-only" type="file" accept={selectedAsset.mediaType} disabled={busy} aria-label="جایگزینی فایل صوتی انتخاب‌شده" onChange={(event) => { void submitReplacement(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>}
        <div className="flex h-14 items-center gap-px overflow-hidden rounded border border-line bg-[#081018] px-2" role="img" aria-label={waveError || "موج‌نمای واقعی فایل صوتی"}>
          {waveform.length ? waveform.map((peak, index) => <span key={index} className="min-w-px flex-1 rounded-sm bg-accent/80" style={{ height: `${Math.max(3, peak * 88)}%` }} />) : <span className="w-full text-center text-[10px] text-muted">{waveError || "در حال ساخت موج‌نمای فایل…"}</span>}
        </div>
        {selectedAsset && <div className="grid gap-2 rounded-md border border-accent/30 bg-[#101c28] p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1"><div><h3 className="text-xs font-bold">افزودن صدا به سکانس</h3><p className="mt-1 text-[10px] text-muted">فایل را انتخاب کنید، محدودهٔ منبع و جایگاه درون سکانس را تعیین کنید.</p></div><ContextHelpTrigger topic="audio" onOpen={onHelp} /></div>
          {scene ? <div className="rounded border border-line bg-[#0b141e] px-2 py-1.5 text-[10px] leading-5">
            <strong>سکانس فعال: {scene.name}</strong><span className="mx-2 text-muted">·</span><span>شروع پروژه {time(scene.startFrame / fps)} ({scene.startFrame} فریم)</span><span className="mx-2 text-muted">·</span><span>مدت سکانس {time(scene.durationFrames / fps)}</span>
          </div> : <div className="rounded border border-dashed border-amber-500/50 p-2 text-[10px] text-amber-200">ابتدا یک سکانس بسازید یا از تایم‌لاین انتخاب کنید تا جایگاه صدا مشخص شود.</div>}
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-[10px]">برش از فایل (ثانیه)<input className={`${control} w-28`} type="number" min={0} max={selectedAsset.audioDurationSeconds ?? undefined} step="0.01" value={sourceStartDraft} onChange={(event) => updateSourceRange(event.target.value, sourceEndDraft)} title="ثانیهٔ شروع در فایل اصلی را مشخص می‌کند؛ این مقدار جایگاه سکانس نیست." /></label>
            <label className="grid gap-1 text-[10px]">برش تا فایل (ثانیه)<input className={`${control} w-28`} type="number" min={0} max={selectedAsset.audioDurationSeconds ?? undefined} step="0.01" value={sourceEndDraft} onChange={(event) => updateSourceRange(sourceStartDraft, event.target.value)} title="ثانیهٔ پایان در فایل اصلی را مشخص می‌کند؛ مدت این بازه روی خط زمان استفاده می‌شود." /></label>
            <label className="grid gap-1 text-[10px]">جایگاه در سکانس (فریم)<input className={`${control} w-28`} type="number" min={0} max={Math.max(0, (scene?.durationFrames ?? 1) - 1)} step={1} value={sceneOffsetDraft} disabled={!scene} onChange={(event) => scene && setPlacementDraft({ sceneId: scene.id, offset: event.target.value, allowSpan: allowSceneSpan })} title="آغاز کلیپ را نسبت به ابتدای سکانس و با فریم صحیح می‌گذارد؛ برنامه آن را به فریم سراسری تبدیل می‌کند." /></label>
          </div>
          {scene && selectedAsset.audioDurationSeconds !== undefined && <p className="text-[10px] text-muted">جایگاه پروژه: {placementFrame === null ? "نامعتبر" : `${time(placementFrame / fps)} · فریم ${placementFrame}`} · مدت منبع انتخابی: {time(sourceFrames / fps)}</p>}
          {crossesScene && <label className="flex items-start gap-2 rounded border border-amber-500/50 p-2 text-[10px] leading-5 text-amber-100" title="اجازه می‌دهد کلیپ کامل بدون برش یا تکثیر از مرز سکانس عبور کند."><input className="mt-1 accent-[#40d7c5]" type="checkbox" checked={allowSceneSpan} onChange={(event) => scene && setPlacementDraft({ sceneId: scene.id, offset: sceneOffsetDraft, allowSpan: event.target.checked })} /><span>{extendsPastProject ? "کلیپ کامل بعد از پایان پروژه نیز ذخیره شود؛ بخش بیرون از بازهٔ پروژه در تایم‌لاین دیده نمی‌شود." : "ادامهٔ کلیپ کامل در سکانس‌های بعدی را مجاز می‌کنم؛ صدا بریده یا تکثیر نمی‌شود."}</span></label>}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted"><span>{selectedAsset.fileSizeBytes.toLocaleString("fa-IR")} بایت · کل فایل {time(selectedAsset.audioDurationSeconds ?? 0)}</span><button className={`${control} min-h-8 border-accent/60`} type="button" disabled={!scene || placementFrame === null || !Number.isSafeInteger(localOffset) || localOffset < 0 || !sourceFrames || crossesScene && !allowSceneSpan || busy} onClick={addClipToScene} title={!scene ? "ابتدا یک سکانس انتخاب کنید تا مبنای جایگذاری مشخص باشد." : crossesScene && !allowSceneSpan ? "برای ثبت کلیپ عبوری، گزینهٔ ادامه پس از مرز سکانس را فعال کنید." : "بازهٔ انتخابی را در جایگاه سکانس ثبت می‌کند؛ زمان در پروژه با فریم سراسری ذخیره می‌شود."}>افزودن صدا به سکانس</button></div>
        </div>}
      </div>
      <div className="grid min-w-0 gap-2 rounded-md border border-line bg-[#0c141e] p-3">
        <div><h3 className="text-xs font-bold">کلیپ‌های پروژه</h3><p className="mt-1 text-[10px] text-muted">هر کلیپ یک ترک نمایشی دارد؛ زمان ذخیره‌شده سراسری و فریم‌محور است. پیش‌نمایش با نشانگر زمان پروژه همگام نیست.</p></div>
        {!clips.length ? <p className="text-xs text-muted">هنوز کلیپی در پروژه نیست. از «افزودن صدا به سکانس» استفاده کنید.</p> : clips.map((item, index) => {
          const range = audioClipFrameRange(item, fps);
          const relation = scene ? clipSceneRelation(item, scene.startFrame, scene.durationFrames, fps) : null;
          const sceneLocal = scene ? item.startFrame - scene.startFrame : null;
          const relationLabel = relation === "inside" ? "کاملاً درون این سکانس" : relation === "spans" ? "از مرز سکانس عبور می‌کند" : relation === "before" ? "پیش از این سکانس" : relation === "after" ? "پس از این سکانس" : "سکانس انتخاب نشده";
          return <div key={`${item.id}:${item.startFrame}:${item.sourceStartSeconds}:${item.sourceEndSeconds}:${item.gain}`} className={`rounded-md border p-2 ${clip?.id === item.id ? "border-accent bg-[#112827]/70" : "border-line bg-[#0b141e]"}`}>
            <ClipRow clip={item} assetName={project.assetManifest[item.assetId]?.displayName ?? "فایل ناموجود"} speakerName={Object.values(audio.speakerRegions).filter((region) => region.audioClipId === item.id && region.speakerId).map((region) => audio.speakers[region.speakerId!]?.name).filter(Boolean).join("، ")} selected={clip?.id === item.id} fps={fps}
              onPreview={() => { void playSourceRange(item.assetId, item.id, item.sourceStartSeconds, item.sourceEndSeconds).catch(() => setError("پخش کلیپ ممکن نشد؛ فایل صوتی را دوباره انتخاب کنید.")); }}
              onSelect={() => { setLocalSelection({ assetId: item.assetId, clipId: item.id, regionId: "" }); onSelectClip(item.assetId, item.id); }} onChange={(change) => applyUpdate((current) => ({ ...current, audioClips: { ...current.audioClips, [item.id]: { ...item, ...change } } }))}
              onDelete={() => { const removed = applyUpdate((current) => { const audioClips = { ...current.audioClips }; delete audioClips[item.id]; const speakerRegions = Object.fromEntries(Object.entries(current.speakerRegions).filter(([, region]) => region.audioClipId !== item.id)); return { ...current, audioClips, speakerRegions }; }); if (removed && selectedClipId === item.id) { const next = clips.find((candidate) => candidate.id !== item.id); setLocalSelection(next ? { assetId: next.assetId, clipId: next.id, regionId: "" } : { assetId: selectedAssetId, clipId: "", regionId: "" }); onSelectClip(next?.assetId ?? null, next?.id ?? null); } }} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted"><span>ترک صدا {String(index + 1).padStart(2, "0")}</span><span>پروژه: {time(range.startFrame / fps)}–{time(range.endFrame / fps)} ({range.startFrame}–{range.endFrame} فریم)</span><span>برش منبع: {time(item.sourceStartSeconds)}–{time(item.sourceEndSeconds)}</span><span>سکانس «{scene?.name ?? "—"}»: {sceneLocal === null ? "—" : `${sceneLocal} فریم`}</span><strong className={relation === "spans" ? "text-amber-200" : relation === "inside" ? "text-emerald-200" : "text-muted"}>{relationLabel}</strong></div>
          </div>;
        })}
      </div>
      <div className="grid min-w-0 gap-2 rounded-md border border-line bg-[#0c141e] p-3">
        <div><h3 className="text-xs font-bold">هویت‌های گوینده</h3><p className="mt-1 text-[10px] text-muted">انتخاب گوینده دستی است؛ شدت صدا نام گوینده را تشخیص نمی‌دهد.</p></div>
        <div className="flex flex-wrap items-center gap-2"><select className={control} value={speakerKind} onChange={(event) => setSpeakerKind(event.target.value as "character" | "audio-only")} aria-label="نوع هویت گوینده" title="گوینده را به شخصیت پروژه پیوند می‌دهد یا به‌صورت فرد صوتی مستقل نگه می‌دارد."><option value="character">شخصیت پروژه</option><option value="audio-only">گویندهٔ صوتی</option></select>
          {speakerKind === "character" ? <select className={`${control} min-w-32 flex-1`} value={characterId} onChange={(event) => setCharacterId(event.target.value)} aria-label="انتخاب هویت شخصیت برای گوینده" title="هویت ذخیره‌شدهٔ شخصیت را به‌عنوان گوینده انتخاب می‌کند."><option value="">انتخاب شخصیت</option>{Object.values(identities).map((identity) => <option key={identity.id} value={identity.id}>{identity.name}</option>)}</select> : <input className={`${control} min-w-28 flex-1`} value={speakerName} onChange={(event) => setSpeakerName(event.target.value)} placeholder="نام گوینده" aria-label="نام گویندهٔ صوتی" title="نامی برای گوینده‌ای ثبت می‌کند که شخصیت سه‌بعدی ندارد." />}
          <button className={control} type="button" onClick={addSpeaker} title="گویندهٔ انتخاب‌شده را با شناسهٔ پایدار به پروژه اضافه می‌کند.">افزودن گوینده</button></div>
        <ul className="flex flex-wrap gap-1.5">{Object.values(audio.speakers).map((speaker) => <li key={speaker.id} className="rounded border border-line px-2 py-1 text-[10px]">{speaker.name}{speaker.kind === "audio-only" ? " · فقط صدا" : ""}</li>)}</ul>
      </div>
      {clip && <div className="grid min-w-0 gap-2 rounded-md border border-line bg-[#0c141e] p-3">
        <div><h3 className="text-xs font-bold">بازه‌های گوینده · {project.assetManifest[clip.assetId]?.displayName}</h3><p className="mt-1 text-[10px] text-muted">زمان‌ها از ابتدای فایل صوتی و بر حسب ثانیه هستند؛ بازه‌ها نیمه‌بازند و در یک فایل ترکیبی نباید هم‌پوشانی کنند.</p></div>
        <div className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-[10px] text-muted">شروع (ثانیه)<input className={`${control} w-24`} type="number" min={clip.sourceStartSeconds} max={clip.sourceEndSeconds} step="0.01" value={regionStart} onChange={(event) => setRegionDraft({ clipId: clip.id, start: event.target.value, end: regionEnd })} title="ابتدای بازهٔ گوینده را برحسب ثانیهٔ فایل اصلی تعیین می‌کند؛ به‌صورت خودکار به زمان پروژه نگاشت می‌شود." /></label><label className="grid gap-1 text-[10px] text-muted">پایان (ثانیه)<input className={`${control} w-24`} type="number" min={clip.sourceStartSeconds} max={clip.sourceEndSeconds} step="0.01" value={regionEnd} onChange={(event) => setRegionDraft({ clipId: clip.id, start: regionStart, end: event.target.value })} title="پایان بازه را برحسب ثانیهٔ فایل اصلی تعیین می‌کند؛ به‌صورت خودکار به زمان پروژه نگاشت می‌شود." /></label><select className={control} value={regionSpeaker} onChange={(event) => setRegionSpeaker(event.target.value)} aria-label="گویندهٔ این بازه" title="شخصیت حاضر در این بازه را دستی انتخاب می‌کند؛ این انتساب حرکت خودکار ایجاد نمی‌کند."><option value="">نامشخص</option><option value="__silence">سکوت</option>{Object.values(audio.speakers).map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}</option>)}</select><button className={control} type="button" onClick={addRegion} title="بازه را با گویندهٔ انتخاب‌شده، وضعیت نامشخص یا سکوت ثبت می‌کند.">ثبت بازه</button></div>
        {!regions.length ? <p className="text-xs text-muted">برای این کلیپ هنوز بازهٔ گوینده ثبت نشده است. زمان شروع و پایان را نسبت به فایل وارد و شخصیت را دستی انتخاب کنید.</p> : regions.map((region, index) => <RegionRow key={`${region.id}:${region.startSeconds}:${region.endSeconds}`} region={region} clip={clip} audio={audio} selected={selectedRegionId === region.id}
          onPreview={() => { void playSourceRange(clip.assetId, clip.id, region.startSeconds, region.endSeconds, region.id).catch(() => setError("پخش بازه ممکن نشد؛ ابتدا فایل را برای پخش در مرورگر آماده کنید.")); }}
          onChange={(change) => applyUpdate((current) => {
            const identity = change.speakerId ? identities[change.speakerId] : undefined;
            const speaker = identity ? { id: uuid(), kind: "character" as const, characterId: identity.id, name: identity.name } : undefined;
            const speakerId = speaker?.id ?? change.speakerId ?? null;
            return { ...current,
              speakers: speaker ? { ...current.speakers, [speaker.id]: speaker } : current.speakers,
              speakerRegions: { ...current.speakerRegions, [region.id]: { ...region, ...change, speakerId } } };
          })}
          onSplit={() => { const split = splitSpeakerRegion(region, uuid()); if (!split) { setError("بازه برای تقسیم کوتاه است."); return; } applyUpdate((current) => ({ ...current, speakerRegions: { ...current.speakerRegions, [split.first.id]: split.first, [split.second.id]: split.second } })); }}
          onMerge={() => { const previous = regions[index - 1]; const merged = previous && mergeAdjacentSpeakerRegions(previous, region); if (!previous || !merged) { setError("برای ادغام، بازهٔ قبلی باید مجاور و دارای گویندهٔ یکسان باشد."); return; } applyUpdate((current) => { const speakerRegions = { ...current.speakerRegions, [previous.id]: merged }; delete speakerRegions[region.id]; return { ...current, speakerRegions }; }); }}
          onDelete={() => applyUpdate((current) => { const speakerRegions = { ...current.speakerRegions }; delete speakerRegions[region.id]; return { ...current, speakerRegions }; })} identities={identities} />)}
      </div>}
    </>}
    {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}{error && <p role="alert" className="text-xs text-red-300">{error}</p>}
  </section>;
}

function ClipRow({ clip, assetName, speakerName, selected, fps, onSelect, onChange, onDelete, onPreview }: { clip: AudioClip; assetName: string; speakerName: string; selected: boolean; fps: number; onSelect: () => void; onChange: (change: Partial<AudioClip>) => void; onDelete: () => void; onPreview: () => void }) {
  const [startFrame, setStartFrame] = useState(String(clip.startFrame));
  const [sourceStart, setSourceStart] = useState(String(clip.sourceStartSeconds));
  const [sourceEnd, setSourceEnd] = useState(String(clip.sourceEndSeconds));
  const [gain, setGain] = useState(String(clip.gain));
  return <div className={`grid min-w-0 gap-2 rounded border p-2 ${selected ? "border-accent bg-[#17343a]" : "border-line"}`}>
    <div className="flex min-w-0 items-center gap-2"><button className="min-w-0 flex-1 truncate text-right text-xs" type="button" onClick={onSelect} title="این کلیپ را برای تغییر گوینده یا تنظیمات پیشرفته انتخاب می‌کند.">{assetName} · شروع {time(clip.startFrame / fps)} · مدت {time(clip.sourceEndSeconds - clip.sourceStartSeconds)}{speakerName ? ` · گوینده: ${speakerName}` : " · گوینده نامشخص"}</button><button className={`${control} min-h-8`} type="button" onClick={onPreview} title="از نقطهٔ برش آغاز کلیپ پخش می‌کند و در پایان برش متوقف می‌شود.">پیش‌شنوی</button><button className={`${control} min-h-8`} type="button" onClick={onDelete} title="کلیپ را حذف می‌کند و بازه‌های گویندهٔ وابسته را نیز حذف خواهد کرد.">حذف کلیپ</button></div>
    <details className="rounded border border-line/70 px-2 py-1.5"><summary className="cursor-pointer text-[11px] text-muted" title="تنظیمات تخصصی جایگاه پروژه و برش فایل را نمایش می‌دهد.">تنظیمات پیشرفتهٔ کلیپ</summary><div className="mt-2 flex flex-wrap items-end gap-2"><label className="grid gap-1 text-[10px] text-muted">فریم شروع<input className={`${control} min-h-8 w-24`} type="number" min={0} step={1} value={startFrame} onChange={(event) => setStartFrame(event.target.value)} title="جایگاه کلیپ را روی خط زمان سراسری با فریم مشخص می‌کند." /></label><label className="grid gap-1 text-[10px] text-muted">برش از ثانیه<input className={`${control} min-h-8 w-24`} type="number" min={0} step="0.01" value={sourceStart} onChange={(event) => setSourceStart(event.target.value)} title="نقطهٔ شروع خواندن فایل اصلی را برحسب ثانیه تعیین می‌کند." /></label><label className="grid gap-1 text-[10px] text-muted">برش تا ثانیه<input className={`${control} min-h-8 w-24`} type="number" min={0} step="0.01" value={sourceEnd} onChange={(event) => setSourceEnd(event.target.value)} title="نقطهٔ پایان خواندن فایل اصلی را برحسب ثانیه تعیین می‌کند." /></label><label className="grid gap-1 text-[10px] text-muted">بهرهٔ صدا (۰ تا ۲)<input className={`${control} min-h-8 w-24`} type="number" min={0} max={2} step="0.05" value={gain} onChange={(event) => setGain(event.target.value)} title="بهرهٔ کلیپ را برای اجرای زمان‌بندی‌شده تنظیم می‌کند." /></label><label className="flex min-h-9 items-center gap-1 text-xs" title="پخش آیندهٔ این کلیپ را بی‌صدا علامت‌گذاری می‌کند."><input type="checkbox" checked={clip.muted} onChange={(event) => onChange({ muted: event.target.checked })} aria-label="بی‌صداکردن کلیپ صوتی" />بی‌صدا</label><button className={`${control} min-h-8`} type="button" onClick={() => { const frame = Number(startFrame), from = Number(sourceStart), to = Number(sourceEnd), level = Number(gain); if (!Number.isSafeInteger(frame) || frame < 0 || !Number.isFinite(from) || !Number.isFinite(to) || to <= from || !Number.isFinite(level) || level < 0 || level > 2) return; onChange({ startFrame: frame, sourceStartSeconds: from, sourceEndSeconds: to, gain: level }); }} title="جایگاه، برش و بهرهٔ واردشده را اعتبارسنجی و ذخیره می‌کند.">اعمال تنظیمات کلیپ</button></div></details>
  </div>;
}

function RegionRow({ region, clip, audio, selected, onChange, onDelete, onPreview, onSplit, onMerge, identities = {} }: { region: SpeakerRegion; clip: AudioClip; audio: AudioProjectCollections; selected: boolean; onChange: (change: Partial<SpeakerRegion>) => void; onDelete: () => void; onPreview: () => void; onSplit: () => void; onMerge: () => void; identities?: Record<string, { id: string; name: string }> }) {
  const [start, setStart] = useState(String(region.startSeconds));
  const [end, setEnd] = useState(String(region.endSeconds));
  return <div id={`audio-speaker-region-${region.id}`} aria-current={selected ? "true" : undefined} className={`grid grid-cols-[72px_72px_minmax(90px,1fr)_minmax(90px,1fr)_auto] items-center gap-1.5 rounded border px-2 py-1.5 ${selected ? "border-accent bg-[#112827]/70" : "border-line"}`}>
    <input className={`${control} min-h-8 w-[70px] px-1`} aria-label="شروع بازهٔ گوینده بر حسب ثانیه" type="number" min={clip.sourceStartSeconds} max={clip.sourceEndSeconds} step="0.01" value={start} onChange={(event) => setStart(event.target.value)} title="زمان شروع این بازه را در فایل صوتی ویرایش می‌کند." />
    <input className={`${control} min-h-8 w-[70px] px-1`} aria-label="پایان بازهٔ گوینده بر حسب ثانیه" type="number" min={clip.sourceStartSeconds} max={clip.sourceEndSeconds} step="0.01" value={end} onChange={(event) => setEnd(event.target.value)} title="زمان پایان این بازه را در فایل صوتی ویرایش می‌کند." />
    <select className={`${control} min-h-8 min-w-0 px-1`} aria-label="هویت گویندهٔ بازه" value={region.status === "silence" ? "__silence" : region.speakerId ?? ""} onChange={(event) => onChange({ speakerId: event.target.value && event.target.value !== "__silence" ? event.target.value : null, status: event.target.value === "__silence" ? "silence" : event.target.value ? "assigned" : "unknown" })} title="شخصیت پروژه یا گویندهٔ صوتی را برای این بازه انتخاب می‌کند."><option value="">نامشخص</option><option value="__silence">سکوت</option>{Object.values(identities).map((identity) => { const speaker = Object.values(audio.speakers).find((item) => item.kind === "character" && item.characterId === identity.id); return <option key={`character:${identity.id}`} value={speaker?.id ?? identity.id}>{identity.name}</option>; })}{Object.values(audio.speakers).filter((speaker) => speaker.kind === "audio-only").map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name} · فقط صدا</option>)}</select>
    <button className={`${control} min-h-8 truncate px-1`} type="button" onClick={() => onChange({ startSeconds: Number(start), endSeconds: Number(end) })} title="زمان‌های واردشده را بررسی و ذخیره می‌کند.">ثبت {time(region.startSeconds)}–{time(region.endSeconds)}</button>
    <div className="col-span-full flex flex-wrap gap-1"><button className={`${control} min-h-8`} type="button" onClick={onPreview} title="فقط همین بازه را پخش می‌کند و در پایان آن متوقف می‌شود.">پخش بازه</button><button className={`${control} min-h-8`} type="button" onClick={onSplit} title="بازه را در نقطهٔ میانی به دو بخش با گویندهٔ یکسان تقسیم می‌کند.">تقسیم</button><button className={`${control} min-h-8`} type="button" onClick={onMerge} title="این بازه را با بازهٔ قبلیِ مجاور و هم‌گوینده یکی می‌کند.">ادغام با قبلی</button></div>
    <button className={`${control} min-h-8 px-2`} type="button" onClick={onDelete} title="این بازهٔ گوینده را حذف می‌کند.">×</button>
  </div>;
}
