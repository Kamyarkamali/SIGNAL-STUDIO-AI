"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { navigationItems, helpItem, type SectionId } from "@/config/navigation";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceResizeHandle } from "./workspace-resize-handle";
import {
  ContextHelpDrawer,
  ContextHelpTrigger,
} from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { SectionContent } from "./section-content";
import { AudioEditor } from "@/components/audio/audio-editor";
import { AudioTimelinePlayback } from "@/components/audio/audio-timeline-playback";
import type {
  AudioProjectCollections,
  SpeakerRegion,
} from "@/lib/audio/audio-schema";
import {
  createSceneAudioClip,
  isAudioAssetAvailable,
} from "@/lib/audio/audio-placement";
import { StudioViewport } from "@/components/viewport/studio-viewport";
import { PropertiesPanel, type TransformMode } from "./properties-panel";
import { EnvironmentEditor } from "@/components/viewport/environment-editor";
import { propDisplayLabel, updateProp } from "@/lib/environments/arrangement";
import type { TransformConfig } from "@/lib/environments/environment-registry";
import { SceneAuthoring } from "@/components/scenes/scene-authoring";
import { SceneManagementPanel } from "@/components/scenes/scene-management-panel";
import { SceneConfigurationPanel } from "@/components/scenes/scene-configuration-panel";
import { SceneActionEditor } from "@/components/scenes/scene-action-editor";
import { SceneActionInspector } from "@/components/scenes/scene-action-inspector";
import { ProjectManager } from "@/components/projects/project-manager";
import { useProjects } from "@/components/projects/use-projects";
import {
  CharacterEditor,
  CharacterProperties,
} from "@/components/characters/character-editor";
import {
  addCharacterInstance,
  assignCharacterPlacement,
  createCharacterIdentity,
  removeCharacterIdentity,
  removeCharacterInstance,
  renameCharacter,
  replaceCharacterModel,
  resetCharacterCustomization,
  resetCharacterPlacement,
  updateCharacterCustomization,
  updateCharacterState,
} from "@/lib/characters/character-operations";
import { environmentRegistry } from "@/lib/environments/registry";
import { STUDIO_01 } from "@/lib/environments/studio-01";
import {
  initialObjectEditState,
  reduceObjectEditState,
} from "@/lib/environments/object-edit-state";
import {
  initialWorkspacePanelState,
  reduceWorkspacePanelState,
} from "./workspace-panel-state";
import type { CharacterPreviewPlayback } from "@/components/characters/character-layer";
import {
  clampPreviewSettings,
  defaultPreviewSettings,
  evaluateCharacterPreviewPose,
  getPreviewDuration,
  isPreviewActionSupported,
  type CharacterPreviewActionId,
  type PreviewSettings,
} from "@/lib/characters/animation-preview";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import {
  supportedGazeCapability,
  type GazePreview,
} from "@/lib/characters/gaze-preview";
import {
  addSceneActionEvent,
  convertSceneFrameRate,
  createScene,
  deleteScene,
  duplicateScene,
  moveSceneActionEvent,
  removeSceneActionEvent,
  renameScene,
  reorderScene,
  reorderSceneActionEvent,
  setSceneCamera,
  setSceneDuration,
  updateSceneActionEvent,
  updateSceneContent,
} from "@/lib/scenes/scene-operations";
import {
  computeSceneOffsets,
  resolveSceneTime,
  sceneLocalToGlobalFrame,
  secondsToFrames,
  totalDurationFrames,
} from "@/lib/scenes/scene-time";
import {
  pausePlayback,
  playbackFrameAt,
  seekPlayback,
  startPlayback,
  stopPlayback,
  type PlaybackStatus,
} from "@/lib/scenes/playback";
import {
  applySceneCameraPreset,
  type SceneCameraPresetId,
} from "@/lib/scenes/scene-camera-presets";
import {
  characterConfigFromState,
  resolveSceneArrangement,
  resolveSceneCameraTarget,
  resolveSceneCharacterData,
  seedSceneCharacters,
  setSceneCharacter,
  setSceneEnvironment,
  setSceneLighting,
  setScenePropOverride,
  updateSceneArrangement,
  updateSceneCharacter,
} from "@/lib/scenes/scene-configuration";
import type { ProductionCameraConfig } from "@/lib/camera/production-camera";
import { captureSceneCamera } from "@/lib/scenes/capture-scene-camera";
import { evaluateSceneCharacterActions } from "@/lib/scenes/scene-action-evaluation";
import type {
  SceneActionEvent,
  SceneDefinition,
} from "@/lib/scenes/scene-schema";

export function EditorShell() {
  const [activeSection, setActiveSection] = useState<SectionId>("projects");
  const projects = useProjects();
  const [selection, setSelection] = useState<{
    projectId: string;
    propId: string;
  } | null>(null);
  const [objectEdit, dispatchObjectEdit] = useReducer(
    reduceObjectEditState,
    initialObjectEditState,
  );
  const [characterSelection, setCharacterSelection] = useState<{
    projectId: string;
    instanceId: string;
  } | null>(null);
  const [previewState, setPreviewState] = useState<{
    scopeKey: string | null;
    byInstance: Record<string, CharacterPreviewPlayback>;
  }>({ scopeKey: null, byInstance: {} });
  const [gazeState, setGazeState] = useState<{
    scopeKey: string | null;
    byInstance: Record<string, GazePreview>;
  }>({ scopeKey: null, byInstance: {} });
  const [previewActionSelection, setPreviewActionSelection] = useState<{
    modelId: string | null;
    action: CharacterPreviewActionId;
  }>({ modelId: null, action: "neutral" });
  const [previewSettingsSelection, setPreviewSettingsSelection] = useState<{
    modelId: string | null;
    settings: PreviewSettings;
  }>({ modelId: null, settings: defaultPreviewSettings });
  const [mode, setMode] = useState<TransformMode>("translate");
  const [inspectPropId, setInspectPropId] = useState<string | null>(null);
  const [laptopContentViewerOpen, setLaptopContentViewerOpen] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(true);
  const [playback, setPlayback] = useState<{
    projectId: string | null;
    frame: number;
    status: PlaybackStatus;
  }>({ projectId: null, frame: 0, status: "stopped" });
  const playStartFrameRef = useRef(0);
  const editorCameraCaptureRef = useRef<(() => ProductionCameraConfig) | null>(
    null,
  );
  const setEditorCameraCapture = useCallback(
    (capture: () => ProductionCameraConfig) => {
      editorCameraCaptureRef.current = capture;
    },
    [],
  );
  const [productionCameraPreview, setProductionCameraPreview] = useState(false);
  const [showRoomWalls, setShowRoomWalls] = useState(true);
  const [navigationCollapsed, setNavigationCollapsed] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(280);
  const [timelineHeight, setTimelineHeight] = useState(230);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [helpTopic, setHelpTopic] = useState<ContextHelpId | "all" | null>(
    null,
  );
  const [cameraSaveMessage, setCameraSaveMessage] = useState<{
    sceneId: string | null;
    text: string;
  } | null>(null);
  const [selectedActionEvent, setSelectedActionEvent] = useState<{
    scopeKey: string;
    eventId: string;
  } | null>(null);
  const [timelineAudioSelection, setTimelineAudioSelection] = useState<{
    projectId: string;
    assetId: string;
    clipId: string;
    regionId?: string;
  } | null>(null);
  const [panel, dispatchPanel] = useReducer(
    reduceWorkspacePanelState,
    initialWorkspacePanelState,
  );
  const focusInspectorAfterNavigation = useRef(false);
  const inspectorOpen = panel.open;
  const inspectorView = panel.view;
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const syncPanel = () =>
      dispatchPanel({ type: "viewport", mobile: narrow.matches });
    syncPanel();
    narrow.addEventListener("change", syncPanel);
    return () => narrow.removeEventListener("change", syncPanel);
  }, []);
  const openSection = (section: SectionId) => {
    focusInspectorAfterNavigation.current = true;
    setActiveSection(section);
    dispatchPanel({ type: "section" });
  };
  useEffect(() => {
    if (!inspectorOpen || !focusInspectorAfterNavigation.current) return;
    focusInspectorAfterNavigation.current = false;
    if (window.matchMedia("(max-width: 767px)").matches)
      document.querySelector<HTMLButtonElement>("#workspace-inspector [data-close-mobile-inspector]")?.focus();
  }, [activeSection, inspectorOpen]);
  const closeInspector = () => {
    dispatchPanel({ type: "close" });
    if (window.matchMedia("(max-width: 767px)").matches)
      requestAnimationFrame(() => document.getElementById("workspace-mobile-section")?.focus());
  };
  const activeProjectId = projects.active?.id ?? null;
  const activePlayback =
    playback.projectId === activeProjectId
      ? playback
      : { projectId: activeProjectId, frame: 0, status: "stopped" as const };
  const setProjectPlayback = useCallback(
    (
      update: (current: { frame: number; status: PlaybackStatus }) => {
        frame: number;
        status: PlaybackStatus;
      },
    ) => {
      setPlayback((current) => {
        const base =
          current.projectId === activeProjectId
            ? current
            : {
                projectId: activeProjectId,
                frame: 0,
                status: "stopped" as const,
              };
        return { ...update(base), projectId: activeProjectId };
      });
    },
    [activeProjectId],
  );
  const projectFps = projects.fps;
  const totalFrames = useMemo(
    () => totalDurationFrames(projects.sceneOrder, projects.scenes),
    [projects.sceneOrder, projects.scenes],
  );
  const activeSceneTime = useMemo(
    () =>
      resolveSceneTime(
        activePlayback.frame,
        projects.sceneOrder,
        projects.scenes,
      ),
    [activePlayback.frame, projects.sceneOrder, projects.scenes],
  );
  const activeSceneId = activeSceneTime?.sceneId ?? null;
  const activeScene = activeSceneId
    ? (projects.scenes[activeSceneId] ?? null)
    : null;
  const activeScopeKey = `${activeProjectId ?? ""}:${activeSceneId ?? ""}`;
  const selectedActionEventRecord =
    selectedActionEvent?.scopeKey === activeScopeKey
      ? (activeScene?.actionEvents.find(
          (event) => event.id === selectedActionEvent.eventId,
        ) ?? null)
      : null;
  const sceneCharacterData = useMemo(
    () =>
      resolveSceneCharacterData(
        projects.characterData,
        activeScene ?? undefined,
      ),
    [projects.characterData, activeScene],
  );
  const sceneArrangementResolution = useMemo(
    () =>
      resolveSceneArrangement(projects.arrangement, activeScene ?? undefined),
    [projects.arrangement, activeScene],
  );
  const sceneArrangement = sceneArrangementResolution.arrangement;
  const productionCameraTarget = useMemo(
    () =>
      activeScene && sceneArrangement
        ? resolveSceneCameraTarget(
            activeScene,
            projects.characterData,
            sceneArrangement,
          ).target
        : (activeScene?.productionCamera.target ??
          ([0, 0.75, 0] as [number, number, number])),
    [activeScene, projects.characterData, sceneArrangement],
  );
  useEffect(() => {
    if (activePlayback.status !== "playing" || totalFrames <= 0) return;
    const startFrame = playStartFrameRef.current;
    const startedAt = performance.now();
    let animationFrame = 0;
    let disposed = false;
    const tick = () => {
      if (disposed) return;
      const nextFrame = playbackFrameAt(
        startFrame,
        performance.now() - startedAt,
        projectFps,
        totalFrames,
      );
      setProjectPlayback((current) =>
        current.frame === nextFrame &&
        (nextFrame < totalFrames || current.status === "ended")
          ? current
          : {
              frame: nextFrame,
              status: nextFrame >= totalFrames ? "ended" : "playing",
            },
      );
      if (nextFrame < totalFrames)
        animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    activePlayback.status,
    activeProjectId,
    totalFrames,
    projectFps,
    setProjectPlayback,
  ]);
  const scheduledActions = useMemo(() => {
    if (!activeScene) return {};
    const capabilities: Record<
      string,
      ("head-rotation" | "arm-gesture" | "facial-expression")[]
    > = {};
    const gazeCapable = new Set<string>();
    const joints: Record<string, readonly string[]> = {};
    for (const instanceId of Object.keys(
      sceneCharacterData.characterInstances,
    )) {
      const instance = sceneCharacterData.characterInstances[instanceId];
      const identity =
        instance &&
        sceneCharacterData.characterIdentities[instance.characterId];
      const model = identity && characterModelRegistry.get(identity.modelId);
      capabilities[instanceId] =
        model && !model.glb
          ? model.capabilities.animationCapabilities.filter(
              (
                item,
              ): item is
                | "head-rotation"
                | "arm-gesture"
                | "facial-expression" =>
                item === "head-rotation" ||
                item === "arm-gesture" ||
                item === "facial-expression",
            )
          : [];
      joints[instanceId] = model && !model.glb ? model.attachmentPoints : [];
      if (model && supportedGazeCapability(model)) gazeCapable.add(instanceId);
    }
    return evaluateSceneCharacterActions(
      activeScene,
      activeSceneTime?.localFrame ?? 0,
      projectFps,
      capabilities,
      gazeCapable,
      joints,
    );
  }, [
    activeScene,
    activeSceneTime?.localFrame,
    projectFps,
    sceneCharacterData,
  ]);
  const characterPreviews = useMemo(() => {
    const scheduled: Record<string, CharacterPreviewPlayback> =
      Object.fromEntries(
        Object.entries(scheduledActions)
          .filter(([, pose]) => pose.poseActive)
          .map(([id, timelinePose]) => [
            id,
            {
              actionId: "neutral" as const,
              startedAtMs: 0,
              durationSeconds: 0,
              timelinePose,
            },
          ]),
      );
    const manual =
      previewState.scopeKey === activeScopeKey ? previewState.byInstance : {};
    return { ...manual, ...scheduled };
  }, [scheduledActions, previewState, activeScopeKey]);
  const characterGazes = useMemo(() => {
    const scheduled = Object.fromEntries(
      Object.entries(scheduledActions).flatMap(([id, pose]) =>
        pose.gaze ? [[id, pose.gaze]] : [],
      ),
    );
    const manual =
      gazeState.scopeKey === activeScopeKey ? gazeState.byInstance : {};
    return { ...manual, ...scheduled };
  }, [scheduledActions, gazeState, activeScopeKey]);
  const setPreviewEntries = useCallback(
    (
      update: (
        current: Record<string, CharacterPreviewPlayback>,
      ) => Record<string, CharacterPreviewPlayback>,
    ) => {
      setPreviewState((current) => {
        const currentEntries =
          current.scopeKey === activeScopeKey ? current.byInstance : {};
        return {
          scopeKey: activeScopeKey,
          byInstance: update(currentEntries),
        };
      });
    },
    [activeScopeKey],
  );
  const setGazeEntries = useCallback(
    (
      update: (
        current: Record<string, GazePreview>,
      ) => Record<string, GazePreview>,
    ) => {
      setGazeState((current) => ({
        scopeKey: activeScopeKey,
        byInstance: update(
          current.scopeKey === activeScopeKey ? current.byInstance : {},
        ),
      }));
    },
    [activeScopeKey],
  );
  const selectedId =
    selection && selection.projectId === projects.active?.id
      ? selection.propId
      : null;
  const selectedProp = sceneArrangement?.props.find(
    (prop) => prop.id === selectedId,
  );
  const selectedPropLabel =
    selectedProp && sceneArrangement
      ? propDisplayLabel(sceneArrangement, selectedProp)
      : null;
  const selectedCharacterId =
    characterSelection && characterSelection.projectId === projects.active?.id
      ? characterSelection.instanceId
      : null;
  const selectedCharacterInstance = selectedCharacterId
    ? sceneCharacterData.characterInstances[selectedCharacterId]
    : undefined;
  const selectedCharacterIdentity = selectedCharacterInstance
    ? sceneCharacterData.characterIdentities[
        selectedCharacterInstance.characterId
      ]
    : undefined;
  const selectedCharacterModelId = selectedCharacterIdentity?.modelId;
  const selectedGaze = selectedCharacterId
    ? characterGazes[selectedCharacterId]
    : undefined;
  const gazeTargets = useMemo(() => {
    const characters = Object.values(
      sceneCharacterData.characterInstances,
    ).flatMap((instance) => {
      const state = sceneCharacterData.characterStates[instance.id];
      const identity =
        sceneCharacterData.characterIdentities[instance.characterId];
      return state?.visible && identity
        ? [
            {
              id: instance.id,
              label: identity.name,
              kind: "character" as const,
            },
          ]
        : [];
    });
    const props = (sceneArrangement?.props ?? []).flatMap((prop) => {
      if (!prop.visible) return [];
      const definition = STUDIO_01.propDefinitions.find(
        (entry) => entry.id === prop.definitionId,
      );
      return definition
        ? [
            {
              id: prop.id,
              label: definition.displayName,
              kind: "prop" as const,
            },
          ]
        : [];
    });
    return [...characters, ...props];
  }, [sceneCharacterData, sceneArrangement]);
  const changeCharacterGaze = useCallback(
    (instanceId: string, patch: Partial<GazePreview>) => {
      const instance = projects.characterData.characterInstances[instanceId];
      const identity =
        instance &&
        projects.characterData.characterIdentities[instance.characterId];
      const model = identity && characterModelRegistry.get(identity.modelId);
      if (!model || !supportedGazeCapability(model)) return;
      setGazeEntries((current) => {
        const previous = current[instanceId];
        const next: GazePreview = {
          mode: patch.mode ?? previous?.mode ?? "direction",
          targetId: patch.targetId ?? previous?.targetId,
          point: patch.point ?? previous?.point,
          horizontal: patch.horizontal ?? previous?.horizontal ?? 0,
          vertical: patch.vertical ?? previous?.vertical ?? 0,
          attention: patch.attention ?? previous?.attention ?? "listening",
          attentionTargetKind:
            patch.attentionTargetKind ?? previous?.attentionTargetKind,
          startedAtMs: performance.now(),
          durationSeconds:
            patch.durationSeconds ??
            (patch.mode === "attention" || previous?.mode === "attention"
              ? 2.4
              : patch.mode === "neutral"
                ? 0.55
                : 3600),
          transitionSeconds:
            patch.transitionSeconds ?? previous?.transitionSeconds ?? 0.45,
        };
        return { ...current, [instanceId]: next };
      });
    },
    [projects.characterData, setGazeEntries],
  );
  const resetCharacterGaze = useCallback(
    (instanceId: string) =>
      changeCharacterGaze(instanceId, { mode: "neutral" }),
    [changeCharacterGaze],
  );
  const finishCharacterPreview = useCallback(
    (instanceId: string, startedAtMs: number) => {
      setPreviewEntries((current) =>
        current[instanceId]?.startedAtMs === startedAtMs
          ? Object.fromEntries(
              Object.entries(current).filter(([id]) => id !== instanceId),
            )
          : current,
      );
    },
    [setPreviewEntries],
  );
  const stopCharacterPreview = useCallback(
    (instanceId: string) => {
      setPreviewEntries((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => id !== instanceId),
        ),
      );
    },
    [setPreviewEntries],
  );
  const playCharacterPreview = useCallback(
    (
      instanceId: string,
      actionId: CharacterPreviewActionId,
      requestedSettings: PreviewSettings,
    ) => {
      const instance = projects.characterData.characterInstances[instanceId];
      const identity =
        instance &&
        projects.characterData.characterIdentities[instance.characterId];
      const state = projects.characterData.characterStates[instanceId];
      const model = identity && characterModelRegistry.get(identity.modelId);
      const capabilities =
        model && !model.glb
          ? model.capabilities.animationCapabilities.filter(
              (
                capability,
              ): capability is
                | "head-rotation"
                | "arm-gesture"
                | "facial-expression" =>
                capability === "head-rotation" ||
                capability === "arm-gesture" ||
                capability === "facial-expression",
            )
          : [];
      const settings = clampPreviewSettings(requestedSettings);
      if (!state?.visible) return;
      if (actionId === "return-idle") {
        const current = characterPreviews[instanceId];
        if (!current) {
          stopCharacterPreview(instanceId);
          return;
        }
        const fromPose = evaluateCharacterPreviewPose({
          actionId: current.actionId,
          sourceTimeSeconds: (performance.now() - current.startedAtMs) / 1000,
          durationSeconds: current.durationSeconds,
          capabilities,
          attachmentPoints: model?.attachmentPoints ?? [],
          fromPose: current.fromPose,
          settings: current.settings,
        });
        setPreviewEntries((previous) => ({
          ...previous,
          [instanceId]: {
            actionId,
            startedAtMs: performance.now(),
            durationSeconds: getPreviewDuration(actionId, settings),
            fromPose,
            settings,
          },
        }));
        return;
      }
      if (
        !isPreviewActionSupported(
          actionId,
          capabilities,
          model?.attachmentPoints ?? [],
        )
      )
        return;
      setPreviewEntries((current) => ({
        ...current,
        [instanceId]: {
          actionId,
          startedAtMs: performance.now(),
          durationSeconds: getPreviewDuration(actionId, settings),
          settings,
        },
      }));
    },
    [
      projects.characterData,
      characterPreviews,
      setPreviewEntries,
      stopCharacterPreview,
    ],
  );
  const selectedModelForPreview = selectedCharacterModelId
    ? characterModelRegistry.get(selectedCharacterModelId)
    : undefined;
  const modelDefaultPreviewAction = !selectedCharacterModelId
    ? "neutral"
    : selectedModelForPreview &&
        !selectedModelForPreview.glb &&
        selectedModelForPreview.capabilities.animationCapabilities.includes(
          "head-rotation",
        )
      ? "head-turn"
      : selectedModelForPreview &&
          !selectedModelForPreview.glb &&
          selectedModelForPreview.capabilities.animationCapabilities.includes(
            "arm-gesture",
          )
        ? "arm-gesture"
        : "neutral";
  const previewAction =
    previewActionSelection.modelId === selectedCharacterModelId
      ? previewActionSelection.action
      : modelDefaultPreviewAction;
  const previewSettings =
    previewSettingsSelection.modelId === selectedCharacterModelId
      ? previewSettingsSelection.settings
      : defaultPreviewSettings;
  const selectProp = (id: string | null) => {
    dispatchObjectEdit({ type: "select", id });
    setCharacterSelection(null);
    setSelection(
      id && projects.active
        ? { projectId: projects.active.id, propId: id }
        : null,
    );
    if (id) {
      setActiveSection("environments");
      dispatchPanel({ type: "selection" });
    }
    if (
      !id ||
      projects.arrangement?.props.find((prop) => prop.id === id)
        ?.definitionId !== "prop:laptop"
    )
      setInspectPropId(null);
  };
  const selectCharacter = (id: string | null) => {
    dispatchObjectEdit({ type: "select", id: null });
    setSelection(null);
    setCharacterSelection(
      id && projects.active
        ? { projectId: projects.active.id, instanceId: id }
        : null,
    );
    if (id) {
      setActiveSection("characters");
      setInspectPropId(null);
      dispatchPanel({ type: "selection" });
    }
  };
  const enterPropEdit = (id: string, editable: boolean) => {
    if (editable) setMode("translate");
    dispatchObjectEdit({ type: "enter", id, editable });
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && objectEdit.editingId) {
        dispatchObjectEdit({ type: "select", id: null });
        setSelection(null);
        setCharacterSelection(null);
        setInspectPropId(null);
      }
      if (
        event.key === "Escape" &&
        window.matchMedia("(max-width: 650px)").matches
      )
        dispatchPanel({ type: "close" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [objectEdit.editingId]);
  const commitTransform = (id: string, transform: TransformConfig) => {
    try {
      if (activeScene && projects.arrangement)
        projects.editScenes((sequence) => ({
          ...sequence,
          scenes: {
            ...sequence.scenes,
            [activeScene.id]: updateSceneArrangement(
              activeScene,
              projects.arrangement!,
              (current) => updateProp(current, id, { transform }),
            ),
          },
        }));
      else
        projects.editArrangement((current) =>
          updateProp(current, id, { transform }),
        );
    } catch (error) {
      projects.setError(
        error instanceof Error ? error.message : "تغییر وسیله انجام نشد.",
      );
    }
  };
  const editArrangement = (
    edit: (
      current: import("@/lib/environments/arrangement").EnvironmentArrangement,
    ) => import("@/lib/environments/arrangement").EnvironmentArrangement,
  ) => {
    try {
      if (activeScene && projects.arrangement)
        projects.editScenes((sequence) => ({
          ...sequence,
          scenes: {
            ...sequence.scenes,
            [activeScene.id]: updateSceneArrangement(
              activeScene,
              projects.arrangement!,
              edit,
            ),
          },
        }));
      else projects.editArrangement(edit);
    } catch (error) {
      projects.setError(
        error instanceof Error ? error.message : "تغییر چیدمان انجام نشد.",
      );
    }
  };
  const characterEnvironment = environmentRegistry.get(
    activeScene?.environmentId ??
      projects.active?.environmentArrangement.environmentId ??
      "",
  );
  const createIdentity = (name: string, modelId: string) =>
    projects.editCharacters((current) =>
      createCharacterIdentity(current, crypto.randomUUID(), name, modelId),
    );
  const addCharacter = (characterId: string) => {
    const instanceId = crypto.randomUUID();
    const nextData = addCharacterInstance(
      projects.characterData,
      characterId,
      instanceId,
    );
    projects.editCharacters(() => nextData);
    if (activeScene) {
      const state = nextData.characterStates[instanceId];
      if (state)
        projects.editScenes((sequence) => ({
          ...sequence,
          scenes: {
            ...sequence.scenes,
            [activeScene.id]: setSceneCharacter(
              activeScene,
              instanceId,
              characterConfigFromState(state),
            ),
          },
        }));
      setCharacterSelection(
        projects.active ? { projectId: projects.active.id, instanceId } : null,
      );
    }
  };
  const assignPlacement = (instanceId: string, anchorId: string | null) => {
    if (activeScene) {
      const placed = assignCharacterPlacement(
        sceneCharacterData,
        instanceId,
        anchorId,
        characterEnvironment?.characterAnchors ?? [],
      );
      const state = placed.characterStates[instanceId];
      if (state)
        projects.editScenes((sequence) => ({
          ...sequence,
          scenes: {
            ...sequence.scenes,
            [activeScene.id]: setSceneCharacter(
              activeScene,
              instanceId,
              characterConfigFromState(state),
            ),
          },
        }));
    } else
      void projects.editCharactersAndSave((current) =>
        assignCharacterPlacement(
          current,
          instanceId,
          anchorId,
          characterEnvironment?.characterAnchors ?? [],
        ),
      );
  };
  const setCharacterVisible = (instanceId: string, visible: boolean) => {
    if (activeScene)
      projects.editScenes((sequence) => ({
        ...sequence,
        scenes: {
          ...sequence.scenes,
          [activeScene.id]: updateSceneCharacter(activeScene, instanceId, {
            visible,
          }),
        },
      }));
    else
      projects.editCharacters((current) =>
        updateCharacterState(current, instanceId, { visible }),
      );
  };
  const removeCharacterFromScene = (instanceId: string) => {
    if (!activeScene)
      return projects.editCharacters((current) =>
        removeCharacterInstance(current, instanceId),
      );
    projects.editScenes((sequence) => ({
      ...sequence,
      scenes: {
        ...sequence.scenes,
        [activeScene.id]: setSceneCharacter(activeScene, instanceId, null),
      },
    }));
    if (selectedCharacterId === instanceId) setCharacterSelection(null);
  };
  const restoreCharacterPlacement = (instanceId: string) => {
    const state = projects.characterData.characterStates[instanceId];
    if (!state) return;
    if (activeScene)
      projects.editScenes((sequence) => ({
        ...sequence,
        scenes: {
          ...sequence.scenes,
          [activeScene.id]: updateSceneCharacter(activeScene, instanceId, {
            transform: structuredClone(state.initialTransform),
            placementAnchorId: state.placementAnchorId ?? null,
          }),
        },
      }));
    else
      projects.editCharacters((current) =>
        resetCharacterPlacement(current, instanceId),
      );
  };
  const commitCharacter = (
    instanceId: string,
    state: import("@/lib/characters/character-schema").CharacterState,
  ) =>
    activeScene
      ? projects.editScenes((sequence) => ({
          ...sequence,
          scenes: {
            ...sequence.scenes,
            [activeScene.id]: setSceneCharacter(
              activeScene,
              instanceId,
              characterConfigFromState(state),
            ),
          },
        }))
      : projects.editCharacters((current) =>
          updateCharacterState(current, instanceId, state),
        );
  const saveEditorCameraToScene = async () => {
    const report = (text: string) =>
      setCameraSaveMessage({ sceneId: activeScene?.id ?? null, text });
    if (!activeScene) {
      report("ابتدا یک سکانس را انتخاب کنید.");
      return;
    }
    if (productionCameraPreview || inspectPropId) {
      report(
        "برای ذخیرهٔ نما، ابتدا به دوربین ویرایش برگردید و نمایش نزدیک وسیله را ببندید.",
      );
      return;
    }
    const capture = editorCameraCaptureRef.current?.();
    if (!capture) {
      report(
        "دوربین ویرایش هنوز آماده نیست. پس از بارگذاری نمای سه‌بعدی دوباره تلاش کنید.",
      );
      return;
    }
    const sceneId = activeScene.id;
    report("در حال ذخیرهٔ نمای دوربین…");
    try {
      projects.editScenes((sequence) =>
        setSceneCamera(
          sequence,
          sceneId,
          captureSceneCamera(activeScene.productionCamera, capture),
        ),
      );
      await projects.saveNow();
      report("نمای دوربین تولید این سکانس ذخیره شد.");
    } catch {
      report("ذخیرهٔ نمای دوربین انجام نشد. وضعیت ذخیرهٔ پروژه را بررسی کنید.");
    }
  };
  const activeItem =
    activeSection === "help"
      ? helpItem
      : navigationItems.find((item) => item.id === activeSection);
  const inspectorHelpTopic: ContextHelpId =
    activeSection === "characters"
      ? "characters"
      : activeSection === "scenes"
        ? "sceneConfiguration"
        : activeSection === "environments" &&
            selectedProp?.definitionId === "prop:laptop"
          ? "laptopMedia"
          : activeSection === "environments" && selectedProp
            ? "props"
            : activeSection === "environments"
              ? "environments"
              : activeSection === "help"
                ? "workspace"
                : activeSection === "animations"
                  ? "timelineActions"
                  : (activeSection as ContextHelpId);

  const selectScene = (sceneId: string) => {
    const entry = computeSceneOffsets(
      projects.sceneOrder,
      projects.scenes,
    ).find((item) => item.sceneId === sceneId);
    if (entry) {
      setProjectPlayback(() => ({ frame: entry.startFrame, status: "paused" }));
      if (activeSection !== "animations") setActiveSection("scenes");
      dispatchPanel({ type: "selection" });
    }
  };
  const keepActiveScenePosition = (next: {
    sceneOrder: string[];
    scenes: typeof projects.scenes;
  }) => {
    if (activeSceneId && next.sceneOrder.includes(activeSceneId)) {
      const frame = sceneLocalToGlobalFrame(
        activeSceneId,
        activeSceneTime?.localFrame ?? 0,
        next.sceneOrder,
        next.scenes,
      );
      setProjectPlayback((current) => ({
        frame,
        status: current.status === "playing" ? "paused" : current.status,
      }));
    }
  };
  const addScene = () => {
    if (!projects.active) return;
    const sceneId = crypto.randomUUID();
    projects.editScenes((current) => {
      const created = createScene(
        current,
        sceneId,
        projects.arrangement?.environmentId,
      );
      const scene = created.scenes[sceneId];
      return {
        ...created,
        scenes: {
          ...created.scenes,
          [sceneId]: scene
            ? seedSceneCharacters(scene, projects.characterData)
            : scene,
        },
      };
    });
    setProjectPlayback(() => ({ frame: totalFrames, status: "paused" }));
  };
  const cloneScene = (sceneId: string) => {
    const nextId = crypto.randomUUID();
    const next = duplicateScene(
      { sceneOrder: projects.sceneOrder, scenes: projects.scenes },
      sceneId,
      nextId,
    );
    projects.editScenes(() => next);
    const entry = computeSceneOffsets(next.sceneOrder, next.scenes).find(
      (item) => item.sceneId === nextId,
    );
    if (entry)
      setProjectPlayback(() => ({ frame: entry.startFrame, status: "paused" }));
  };
  const removeScene = (sceneId: string) => {
    const oldIndex = projects.sceneOrder.indexOf(sceneId);
    const next = deleteScene(
      { sceneOrder: projects.sceneOrder, scenes: projects.scenes },
      sceneId,
    );
    projects.editScenes(() => next);
    const selectedId =
      activeSceneId !== sceneId &&
      activeSceneId &&
      next.sceneOrder.includes(activeSceneId)
        ? activeSceneId
        : next.sceneOrder[
            Math.min(Math.max(0, oldIndex), next.sceneOrder.length - 1)
          ];
    const entry = selectedId
      ? computeSceneOffsets(next.sceneOrder, next.scenes).find(
          (item) => item.sceneId === selectedId,
        )
      : undefined;
    const local =
      selectedId === activeSceneId && activeSceneTime
        ? activeSceneTime.localFrame
        : 0;
    setProjectPlayback(() => ({
      frame: entry
        ? sceneLocalToGlobalFrame(
            selectedId!,
            local,
            next.sceneOrder,
            next.scenes,
          )
        : 0,
      status: "paused",
    }));
  };
  const updateSceneDuration = (sceneId: string, seconds: number) => {
    const frames = Math.min(
      1_000_000,
      Math.max(1, secondsToFrames(seconds, projectFps)),
    );
    const next = setSceneDuration(
      { sceneOrder: projects.sceneOrder, scenes: projects.scenes },
      sceneId,
      frames,
    );
    projects.editScenes(() => next);
    keepActiveScenePosition(next);
  };
  const changeProjectFrameRate = (nextFps: number) => {
    if (![24, 25, 30, 50, 60].includes(nextFps)) return;
    const nextScenes = convertSceneFrameRate(
      { sceneOrder: projects.sceneOrder, scenes: projects.scenes },
      projectFps,
      nextFps,
    );
    const nextLocalFrame = secondsToFrames(
      (activeSceneTime?.localFrame ?? 0) / projectFps,
      nextFps,
    );
    const nextFrame = activeSceneId
      ? sceneLocalToGlobalFrame(
          activeSceneId,
          nextLocalFrame,
          nextScenes.sceneOrder,
          nextScenes.scenes,
        )
      : secondsToFrames(activePlayback.frame / projectFps, nextFps);
    projects.editFps(nextFps as 24 | 25 | 30 | 50 | 60);
    setProjectPlayback((current) => ({
      frame: nextFrame,
      status: current.status === "playing" ? "paused" : current.status,
    }));
  };
  const seekTimeline = (frame: number) =>
    setProjectPlayback((current) => seekPlayback(current, frame, totalFrames));
  const placeAudioAsset = (
    assetId: string,
    sceneId: string,
    frame: number,
    durationSeconds: number,
    uploadVerified = false,
  ) => {
    const scene = projects.scenes[sceneId];
    const sceneStartFrame = computeSceneOffsets(
      projects.sceneOrder,
      projects.scenes,
    ).find((item) => item.sceneId === sceneId)?.startFrame;
    const asset = projects.active?.assetManifest[assetId];
    if (
      !scene ||
      sceneStartFrame === undefined ||
      !isAudioAssetAvailable(asset?.kind, uploadVerified) ||
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0 ||
      frame < sceneStartFrame ||
      frame >= sceneStartFrame + scene.durationFrames
    )
      return false;
    const clip = createSceneAudioClip({
      id: crypto.randomUUID(),
      assetId,
      sceneStartFrame,
      sceneDurationFrames: scene.durationFrames,
      localFrame: frame - sceneStartFrame,
      sourceDurationSeconds: durationSeconds,
    });
    if (!clip) return false;
    const region: SpeakerRegion = {
      id: crypto.randomUUID(),
      audioClipId: clip.id,
      startSeconds: 0,
      endSeconds: durationSeconds,
      speakerId: null,
      status: "unknown",
    };
    projects.editAudio((current: AudioProjectCollections) => ({
      ...current,
      audioClips: { ...current.audioClips, [clip.id]: clip },
      speakerRegions: { ...current.speakerRegions, [region.id]: region },
    }));
    setTimelineAudioSelection({
      projectId: projects.active!.id,
      assetId,
      clipId: clip.id,
      regionId: region.id,
    });
    seekTimeline(frame);
    return true;
  };
  const importAudioAtScene = async (
    file: File,
    sceneId: string,
    frame: number,
  ) => {
    const durationSeconds = await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.preload = "metadata";
      audio.src = url;
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("فایل صوتی قابل خواندن نیست."));
      };
    }).catch(() => Number.NaN);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return false;
    const imported = await projects.uploadAudio(file, durationSeconds);
    return imported
      ? placeAudioAsset(
          imported.assetId,
          sceneId,
          frame,
          imported.durationSeconds,
          true,
        )
      : false;
  };
  const playTimeline = () => {
    playStartFrameRef.current =
      activePlayback.frame >= totalFrames ? 0 : activePlayback.frame;
    setProjectPlayback((current) => startPlayback(current, totalFrames));
  };
  const pauseTimeline = () => setProjectPlayback(pausePlayback);
  const stopTimeline = () => {
    playStartFrameRef.current = 0;
    setProjectPlayback(() => stopPlayback());
  };
  const jumpScene = (direction: -1 | 1) => {
    if (!activeSceneTime) return;
    const nextId = projects.sceneOrder[activeSceneTime.sceneIndex + direction];
    if (nextId) selectScene(nextId);
  };
  const moveScene = (sceneId: string, index: number) => {
    const next = reorderScene(
      { sceneOrder: projects.sceneOrder, scenes: projects.scenes },
      sceneId,
      index,
    );
    projects.editScenes(() => next);
    keepActiveScenePosition(next);
  };
  const editActionEvents = (
    sceneId: string,
    update: (scene: SceneDefinition) => SceneDefinition,
  ) => {
    try {
      projects.editScenes((sequence) => {
        const scene = sequence.scenes[sceneId];
        if (!scene) return sequence;
        return {
          ...sequence,
          scenes: { ...sequence.scenes, [sceneId]: update(scene) },
        };
      });
    } catch (error) {
      projects.setError(
        error instanceof Error
          ? error.message
          : "تغییر حرکت در سکانس ذخیره نشد.",
      );
    }
  };
  const selectActionEvent = (eventId: string, sceneId = activeSceneId) => {
    if (sceneId)
      setSelectedActionEvent({
        scopeKey: `${activeProjectId ?? ""}:${sceneId}`,
        eventId,
      });
    setActiveSection("animations");
    dispatchPanel({ type: "view", view: "properties" });
    dispatchPanel({ type: "selection" });
  };
  const previewActionEvent = (event: SceneActionEvent) => {
    const entry = computeSceneOffsets(
      projects.sceneOrder,
      projects.scenes,
    ).find((item) => item.sceneId === activeSceneId);
    if (!entry || !event.enabled) return;
    const frame = entry.startFrame + event.startFrame;
    playStartFrameRef.current = frame;
    setProjectPlayback(() => ({ frame, status: "playing" }));
  };

  const initialTimelineAudioSelection = (() => {
    const selectedAudio = timelineAudioSelection;
    if (!selectedAudio || selectedAudio.projectId !== projects.active?.id)
      return null;
    return {
      assetId: selectedAudio.assetId,
      clipId: selectedAudio.clipId,
      regionId: selectedAudio.regionId,
    };
  })();

  const sectionEditor =
    activeSection === "projects" ? (
      <ProjectManager projects={projects} />
    ) : activeSection === "characters" ? (
      <CharacterEditor
        data={sceneCharacterData}
        active={Boolean(projects.active)}
        selectedId={selectedCharacterId}
        saveStatus={projects.saveStatus}
        error={projects.error}
        projectId={projects.active?.id ?? null}
        onBeforeImport={async () => {
          if (projects.saveStatus === "dirty") await projects.saveNow();
          return Boolean(projects.active);
        }}
        onImported={(project) => {
          void projects.adoptImportedProject(project);
        }}
        onDeleteImportedModel={projects.removeImportedCharacterModel}
        onCreate={createIdentity}
        onAdd={addCharacter}
        onSelect={selectCharacter}
        onVisibility={setCharacterVisible}
        anchors={characterEnvironment?.characterAnchors ?? []}
        onRemove={removeCharacterFromScene}
        onAssignPlacement={assignPlacement}
        onRename={(id, name) =>
          projects.editCharacters((current) =>
            renameCharacter(current, id, name),
          )
        }
        onDeleteIdentity={(id) =>
          projects.editCharactersAndSave((current) =>
            removeCharacterIdentity(current, id),
          )
        }
        onChangeModel={(id, modelId) =>
          projects.editCharactersAndSave((current) =>
            replaceCharacterModel(current, id, modelId),
          )
        }
      />
    ) : activeSection === "scenes" ? (
      <SceneManagementPanel
        canEdit={Boolean(projects.active)}
        sceneOrder={projects.sceneOrder}
        scenes={projects.scenes}
        fps={projectFps}
        activeSceneId={activeSceneId}
        onHelp={setHelpTopic}
        onCreate={addScene}
        onSelect={selectScene}
        onDuplicate={cloneScene}
        onDelete={removeScene}
        onReorder={moveScene}
        onRename={(id, name) => {
          try {
            projects.editScenes((current) => renameScene(current, id, name));
          } catch (error) {
            projects.setError(
              error instanceof Error ? error.message : "نام سکانس معتبر نیست.",
            );
          }
        }}
      />
    ) : activeSection === "environments" ? (
      <EnvironmentEditor
        arrangement={sceneArrangement}
        selectedId={selectedId}
        onSelect={selectProp}
        showRoomWalls={showRoomWalls}
        onToggleRoomWalls={() => setShowRoomWalls((value) => !value)}
        editing={objectEdit.editingId === selectedId}
        onEnterEdit={() => selectedId && enterPropEdit(selectedId, true)}
        onFinishEdit={() => dispatchObjectEdit({ type: "finish" })}
        mode={mode}
        onModeChange={setMode}
        onEdit={editArrangement}
        saveStatus={projects.saveStatus}
        onSave={() => {
          void projects.saveNow().catch(() => undefined);
        }}
        project={projects.active}
        onUpload={projects.uploadDisplay}
        onHelp={(topic) => setHelpTopic(topic)}
      />
    ) : activeSection === "audio" ? (
      <AudioEditor
        key={projects.active?.id ?? ""}
        project={projects.active}
        audio={projects.audio}
        fps={projectFps}
        busy={projects.busy}
        projectEndFrame={totalFrames}
        initialSelection={initialTimelineAudioSelection}
        scene={
          activeScene && activeSceneTime
            ? {
                id: activeScene.id,
                name: activeScene.name,
                startFrame: activeSceneTime.startFrame,
                durationFrames: activeScene.durationFrames,
                localFrame: activeSceneTime.localFrame,
              }
            : null
        }
        onSelectClip={(assetId, clipId, regionId) => {
          if (!projects.active || !assetId || !clipId) {
            setTimelineAudioSelection(null);
            return;
          }
          setTimelineAudioSelection({
            projectId: projects.active.id,
            assetId,
            clipId,
            ...(regionId ? { regionId } : {}),
          });
        }}
        onHelp={setHelpTopic}
        onUpload={projects.uploadAudio}
        onDelete={projects.deleteAudioAsset}
        onReplace={projects.replaceAudioAsset}
        onEdit={projects.editAudio}
      />
    ) : activeSection === "animations" ? (
      <SceneActionEditor
        key={`${projects.active?.id ?? ""}:${activeScene?.id ?? ""}`}
        scene={activeScene}
        characters={sceneCharacterData}
        arrangement={sceneArrangement}
        fps={projectFps}
        localFrame={activeSceneTime?.localFrame ?? 0}
        selectedEventId={selectedActionEventRecord?.id ?? null}
        onHelp={setHelpTopic}
        onSelectEvent={selectActionEvent}
        onReorderEvent={(id, index) =>
          activeScene &&
          editActionEvents(activeScene.id, (scene) =>
            reorderSceneActionEvent(scene, id, index),
          )
        }
        onAdd={(event) => {
          if (activeScene) {
            editActionEvents(activeScene.id, (scene) =>
              addSceneActionEvent(scene, event),
            );
            selectActionEvent(event.id);
          }
        }}
      />
    ) : (
      <SectionContent section={activeSection} />
    );

  const propertiesEditor =
    activeSection === "characters" ? (
      <CharacterProperties
        data={sceneCharacterData}
        selectedId={selectedCharacterId}
        mode={mode}
        onModeChange={setMode}
        onEdit={commitCharacter}
        onReset={restoreCharacterPlacement}
        onAppearanceChange={(id, appearance) =>
          projects.editCharacters((current) =>
            updateCharacterCustomization(current, id, appearance),
          )
        }
        onResetAppearance={(id) =>
          projects.editCharacters((current) =>
            resetCharacterCustomization(current, id),
          )
        }
        onSavePreset={() => {
          void projects.saveNow().catch(() => undefined);
        }}
        previewAction={previewAction}
        previewPlaying={Boolean(
          selectedCharacterId && characterPreviews[selectedCharacterId],
        )}
        previewSettings={previewSettings}
        onPreviewActionChange={(action) =>
          setPreviewActionSelection({
            modelId: selectedCharacterModelId ?? null,
            action,
          })
        }
        onPreviewSettingsChange={(settings) =>
          setPreviewSettingsSelection({
            modelId: selectedCharacterModelId ?? null,
            settings: clampPreviewSettings(settings),
          })
        }
        onPlayPreview={playCharacterPreview}
        onStopPreview={stopCharacterPreview}
        onResetPreview={stopCharacterPreview}
        gazePreview={selectedGaze}
        gazeTargets={gazeTargets}
        onGazeChange={changeCharacterGaze}
        onGazeReset={resetCharacterGaze}
        onHelp={setHelpTopic}
      />
    ) : activeSection === "animations" ? (
      <SceneActionInspector
        scene={activeScene}
        event={selectedActionEventRecord}
        characters={sceneCharacterData}
        arrangement={sceneArrangement}
        fps={projectFps}
        onHelp={setHelpTopic}
        onUpdate={(id, change) =>
          activeScene &&
          editActionEvents(activeScene.id, (scene) =>
            updateSceneActionEvent(scene, id, change),
          )
        }
        onDelete={(id) => {
          if (activeScene)
            editActionEvents(activeScene.id, (scene) =>
              removeSceneActionEvent(scene, id),
            );
          setSelectedActionEvent(null);
        }}
        onPreview={previewActionEvent}
      />
    ) : activeSection === "scenes" ? (
      <SceneConfigurationPanel
        scene={activeScene}
        characters={projects.characterData}
        baseArrangement={projects.arrangement}
        arrangement={sceneArrangement}
        resolutionWarning={sceneArrangementResolution.warning}
        anchors={characterEnvironment?.characterAnchors ?? []}
        onEnvironmentChange={(environmentId) => {
          if (activeScene)
            projects.editScenes((sequence) => ({
              ...sequence,
              scenes: {
                ...sequence.scenes,
                [activeScene.id]: setSceneEnvironment(
                  activeScene,
                  environmentId,
                ),
              },
            }));
        }}
        onCharacterAdd={(id) => {
          const state = projects.characterData.characterStates[id];
          if (activeScene && state)
            projects.editScenes((sequence) => ({
              ...sequence,
              scenes: {
                ...sequence.scenes,
                [activeScene.id]: setSceneCharacter(
                  activeScene,
                  id,
                  characterConfigFromState(state),
                ),
              },
            }));
        }}
        onCharacterRemove={(id) => {
          if (activeScene)
            projects.editScenes((sequence) => ({
              ...sequence,
              scenes: {
                ...sequence.scenes,
                [activeScene.id]: setSceneCharacter(activeScene, id, null),
              },
            }));
          if (selectedCharacterId === id) setCharacterSelection(null);
        }}
        onCharacterChange={(id, change) => {
          if (activeScene)
            projects.editScenes((sequence) => ({
              ...sequence,
              scenes: {
                ...sequence.scenes,
                [activeScene.id]: updateSceneCharacter(activeScene, id, change),
              },
            }));
        }}
        onPropChange={(id, change) => {
          try {
            if (activeScene)
              projects.editScenes((sequence) => ({
                ...sequence,
                scenes: {
                  ...sequence.scenes,
                  [activeScene.id]: setScenePropOverride(
                    activeScene,
                    id,
                    change,
                  ),
                },
              }));
          } catch (error) {
            projects.setError(
              error instanceof Error ? error.message : "تغییر وسیله انجام نشد.",
            );
          }
        }}
        onLightingChange={(lighting) => {
          if (activeScene)
            projects.editScenes((sequence) => ({
              ...sequence,
              scenes: {
                ...sequence.scenes,
                [activeScene.id]: setSceneLighting(activeScene, lighting),
              },
            }));
        }}
        onCameraChange={(camera) => {
          if (activeScene)
            projects.editScenes((sequence) =>
              setSceneCamera(sequence, activeScene.id, camera),
            );
        }}
        onCameraPreset={(preset: SceneCameraPresetId) => {
          if (activeScene && sceneArrangement)
            projects.editScenes((sequence) =>
              setSceneCamera(
                sequence,
                activeScene.id,
                applySceneCameraPreset(
                  activeScene,
                  preset,
                  sceneArrangement,
                  projects.characterData,
                ),
              ),
            );
        }}
        onSaveEditorView={saveEditorCameraToScene}
        previewing={productionCameraPreview}
        inspectionActive={Boolean(inspectPropId)}
        onPreviewChange={setProductionCameraPreview}
        onHelp={setHelpTopic}
      />
    ) : (
      <PropertiesPanel
        section={activeSection}
        projectTitle={projects.active?.title}
        arrangement={activeSection === "environments" ? sceneArrangement : null}
        selectedId={selectedId}
        editing={objectEdit.editingId === selectedId}
        onEnterEdit={() =>
          selectedId &&
          enterPropEdit(
            selectedId,
            STUDIO_01.propDefinitions.find(
              (definition) =>
                definition.id ===
                sceneArrangement?.props.find((prop) => prop.id === selectedId)
                  ?.definitionId,
            )?.editable !== false,
          )
        }
        onFinishEdit={() => dispatchObjectEdit({ type: "finish" })}
        onEdit={editArrangement}
        mode={mode}
        onModeChange={setMode}
        project={projects.active}
        displayAssignments={projects.displayAssignments}
        onDisplayChange={projects.editDisplay}
        onUploadDisplay={projects.uploadDisplay}
        onDeleteDisplayImage={projects.deleteDisplayImage}
        inspecting={inspectPropId === selectedId}
        onInspect={() =>
          setInspectPropId(inspectPropId === selectedId ? null : selectedId)
        }
        mediaPlaying={mediaPlaying}
        onLaptopViewerOpenChange={setLaptopContentViewerOpen}
        onTogglePlayback={() => setMediaPlaying((current) => !current)}
      />
    );

  return (
    <div className="app-background editor-shell flex h-dvh min-h-0 flex-col overflow-hidden">
      <a
        className="fixed -top-16 right-3 z-20 rounded-md bg-accent px-3.5 py-2 text-[#061315] focus:top-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#65e6d7]"
        href="#section-title"
      >
        پرش به محتوای اصلی
      </a>
      <WorkspaceHeader
        projectTitle={projects.active?.title}
        saveStatus={projects.saveStatus}
        onHelp={() => setHelpTopic("all")}
      />
      <AudioTimelinePlayback
        projectId={projects.active?.id ?? null}
        clips={Object.values(projects.audio.audioClips)}
        fps={projectFps}
        frame={activePlayback.frame}
        playing={activePlayback.status === "playing"}
      />
      <div
        className={`editor-layout grid min-h-0 flex-1 ${navigationCollapsed ? "navigation-is-collapsed" : ""}`}
        style={
          {
            "--navigation-width": navigationCollapsed ? "68px" : "220px",
          } as CSSProperties
        }
        dir="rtl"
      >
        <WorkspaceNavigation
          activeSection={activeSection}
          onSelect={openSection}
          collapsed={navigationCollapsed}
          onToggleCollapsed={() => setNavigationCollapsed((value) => !value)}
          onHelp={setHelpTopic}
        />
        <main
          className={`editor-workspace flex min-h-0 min-w-0 flex-col gap-2 p-2.5 max-[1120px]:p-2 max-[650px]:gap-2 max-[650px]:p-2 ${timelineCollapsed ? "timeline-is-collapsed" : ""}`}
        >
          <div className="workspace-section-bar flex min-h-8 flex-none items-center justify-between gap-3 border-b border-line px-1 pb-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate text-xs font-semibold text-[#c9d8e5]">
                {activeItem?.label ?? "فضای کار"}
              </span>
              <ContextHelpTrigger
                topic={
                  activeSection === "help"
                    ? "workspace"
                    : activeSection === "animations"
                      ? "timelineActions"
                      : (activeSection as ContextHelpId)
                }
                onOpen={setHelpTopic}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                className="workspace-compact-action max-[850px]:hidden"
                title="اندازه و نمایش پنل‌ها را به چیدمان آغازین برمی‌گرداند."
                onClick={() => {
                  setNavigationCollapsed(false);
                  setInspectorWidth(280);
                  setTimelineHeight(230);
                  setTimelineCollapsed(false);
                  dispatchPanel({ type: "section" });
                }}
              >
                بازنشانی چیدمان
              </button>
              <button
                type="button"
                className="workspace-compact-action"
                aria-expanded={!timelineCollapsed}
                aria-controls="scene-timeline-panel"
                onClick={() => setTimelineCollapsed((value) => !value)}
                title={
                  timelineCollapsed ? "بازکردن تایم‌لاین" : "جمع‌کردن تایم‌لاین"
                }
              >
                {timelineCollapsed ? "بازکردن تایم‌لاین" : "جمع‌کردن تایم‌لاین"}
              </button>
              <button
                type="button"
                className="flex-none rounded-md px-2 py-1 text-xs text-[#c9d8e5] transition-colors duration-150 hover:bg-[#243244] hover:text-white focus-visible:outline-2 focus-visible:outline-accent"
                aria-expanded={inspectorOpen}
                aria-controls="workspace-inspector"
                onClick={() => dispatchPanel({ type: "toggle" })}
              >
                {inspectorOpen ? "بستن پنل" : "نمایش پنل و ویژگی‌ها"}
              </button>
            </div>
          </div>
          <div
            className={`workspace-main min-h-0 flex-1 ${inspectorOpen ? "workspace-main-with-inspector" : "workspace-main-without-inspector"}`}
            style={
              { "--inspector-width": `${inspectorWidth}px` } as CSSProperties
            }
          >
            <section
              className="workspace-canvas relative min-h-0 min-w-0"
              data-scene-id={activeSceneId ?? undefined}
              aria-label="پیش‌نمایش سه‌بعدی"
            >
              {activeSceneId && (
                <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md border border-line/80 bg-[#101722]/85 px-2.5 py-1 text-[11px] text-[#d7e5ef]">
                  صحنه {projects.sceneOrder.indexOf(activeSceneId) + 1} ·{" "}
                  {projects.scenes[activeSceneId]?.name}{" "}
                  <span className="text-[#9fb1c3]">(دوربین ویرایش جداست)</span>
                </div>
              )}
              <StudioViewport
                arrangement={sceneArrangement}
                selectedId={selectedId}
                editingId={objectEdit.editingId}
                onSelect={selectProp}
                onEnterEdit={enterPropEdit}
                onCommit={commitTransform}
                mode={mode}
                projectId={projects.active?.id ?? null}
                displayAssignments={projects.displayAssignments}
                mediaPlaying={mediaPlaying}
                inspectPropId={inspectPropId}
                onInspectChange={setInspectPropId}
                laptopContentViewerOpen={laptopContentViewerOpen}
                characterData={sceneCharacterData}
                selectedCharacterId={selectedCharacterId}
                onCharacterSelect={selectCharacter}
                onCharacterCommit={commitCharacter}
                showRoomWalls={showRoomWalls}
                characterPreviews={characterPreviews}
                characterGazes={characterGazes}
                onCharacterPreviewComplete={finishCharacterPreview}
                productionCamera={activeScene?.productionCamera}
                productionCameraTarget={productionCameraTarget}
                productionCameraPreview={
                  productionCameraPreview && Boolean(activeScene)
                }
                onCameraCaptureReady={setEditorCameraCapture}
                onSaveProductionCamera={() => void saveEditorCameraToScene()}
                onProductionCameraPreviewChange={setProductionCameraPreview}
                cameraSaveMessage={
                  cameraSaveMessage?.sceneId === activeSceneId
                    ? cameraSaveMessage.text
                    : null
                }
                onHelp={setHelpTopic}
              />
            </section>
            {inspectorOpen && (
              <WorkspaceResizeHandle
                axis="x"
                value={inspectorWidth}
                min={250}
                max={440}
                onChange={setInspectorWidth}
                label="تغییر عرض پنل ویژگی‌ها"
              />
            )}
            <aside
              id="workspace-inspector"
              className={`workspace-inspector min-h-0 ${inspectorOpen ? "workspace-inspector-open" : "workspace-inspector-closed"}`}
              aria-label="پنل ویرایش"
              aria-hidden={!inspectorOpen}
            >
              <div className="workspace-inspector-heading flex min-h-[42px] flex-none items-center gap-2 border-b border-line px-3">
                <span
                  className="h-[15px] w-[3px] rounded bg-accent"
                  aria-hidden="true"
                />
                <h2
                  id="workspace-inspector-title"
                  className="min-w-0 flex-1 truncate text-xs font-bold"
                >
                  {activeSection === "projects"
                    ? "مدیریت پروژه‌ها"
                    : activeSection === "characters" && selectedCharacterId
                      ? `شخصیت · ${selectedCharacterIdentity?.name ?? "ویژگی‌ها"}`
                      : activeSection === "environments" && selectedPropLabel
                        ? `وسیله · ${selectedPropLabel}`
                        : activeSection === "scenes" &&
                            activeScene &&
                            inspectorView === "properties"
                          ? `سکانس · ${activeScene.name}`
                          : (activeItem?.label ?? "فضای کار")}
                </h2>
                <ContextHelpTrigger
                  topic={inspectorHelpTopic}
                  onOpen={setHelpTopic}
                />
                <button
                  type="button"
                  className="hidden rounded-md px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-accent max-[767px]:inline-flex"
                  data-close-mobile-inspector
                  onClick={closeInspector}
                  aria-label="بستن پنل ویرایش"
                  title="پنل را می‌بندد؛ انتخاب‌ها و تغییرهای ذخیره‌نشده باقی می‌مانند."
                >
                  ✕
                </button>
              </div>
              {(activeSection === "characters" ||
                activeSection === "scenes" ||
                activeSection === "environments" ||
                activeSection === "animations") && (
                <div
                  className="workspace-inspector-tabs flex flex-none items-center border-b border-line"
                  role="tablist"
                  aria-label="نمایش ابزارها یا ویژگی‌های انتخاب‌شده"
                >
                  <button
                    type="button"
                    role="tab"
                    id="workspace-section-tab"
                    aria-controls="workspace-section-pane"
                    aria-selected={inspectorView === "section"}
                    title="ابزارهای فهرست و مدیریت همین بخش را باز می‌کند و انتخاب‌های شما را نگه می‌دارد."
                    className="workspace-inspector-tab min-w-0 flex-1 truncate px-3 py-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent"
                    onClick={() =>
                      dispatchPanel({ type: "view", view: "section" })
                    }
                  >
                    {activeItem?.label
                      ? `${activeItem.label} · ابزارها`
                      : "ابزارهای بخش"}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="workspace-properties-tab"
                    aria-controls="workspace-properties-pane"
                    aria-selected={inspectorView === "properties"}
                    title="کنترل‌های ویرایش مربوط به سکانس، شخصیت یا وسیلهٔ انتخاب‌شده را نشان می‌دهد."
                    className="workspace-inspector-tab min-w-0 flex-1 px-3 py-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent"
                    onClick={() =>
                      dispatchPanel({ type: "view", view: "properties" })
                    }
                  >
                    {activeSection === "animations"
                      ? "ویژگی‌های رویداد"
                      : selectedCharacterId
                        ? "ویژگی‌های شخصیت"
                        : selectedPropLabel
                          ? "ویژگی‌های وسیله"
                          : activeSection === "scenes" && activeScene
                            ? "تنظیمات سکانس"
                            : "ویژگی‌های محیط"}
                  </button>
                </div>
              )}
              <div
                id="workspace-section-pane"
                role="tabpanel"
                aria-labelledby="workspace-inspector-title"
                hidden={
                  activeSection !== "projects" && inspectorView !== "section"
                }
                className="workspace-pane min-h-0 flex-1"
              >
                {sectionEditor}
              </div>
              <div
                id="workspace-properties-pane"
                role="tabpanel"
                aria-labelledby="workspace-inspector-title"
                hidden={
                  !(
                    activeSection === "characters" ||
                    activeSection === "scenes" ||
                    activeSection === "environments" ||
                    activeSection === "animations"
                  ) || inspectorView !== "properties"
                }
                className="workspace-pane min-h-0 flex-1"
              >
                {propertiesEditor}
              </div>
            </aside>
          </div>
          {!timelineCollapsed && (
            <WorkspaceResizeHandle
              axis="y"
              value={timelineHeight}
              min={190}
              max={360}
              invert
              label="تغییر ارتفاع تایم‌لاین"
              onChange={setTimelineHeight}
            />
          )}
          {timelineCollapsed ? (
            <div
              id="scene-timeline-panel"
              className="workspace-timeline-collapsed"
            >
              <span>تایم‌لاین جمع شده</span>
              <button
                type="button"
                className="workspace-compact-action"
                onClick={() => setTimelineCollapsed(false)}
              >
                بازکردن
              </button>
            </div>
          ) : (
            <div
              id="scene-timeline-panel"
              className="workspace-timeline flex-none"
              style={{ height: `${timelineHeight}px` }}
            >
              <SceneAuthoring
                canEdit={Boolean(projects.active)}
                sceneOrder={projects.sceneOrder}
                scenes={projects.scenes}
                fps={projectFps}
                currentFrame={activePlayback.frame}
                totalFrames={totalFrames}
                onHelp={setHelpTopic}
                activeWorkspace={
                  activeSection === "animations" ? "animations" : "scenes"
                }
                activeSceneId={activeSceneId}
                playbackStatus={activePlayback.status}
                onCreate={addScene}
                onSelect={selectScene}
                onRename={(id, name) => {
                  try {
                    projects.editScenes((current) =>
                      renameScene(current, id, name),
                    );
                  } catch (error) {
                    projects.setError(
                      error instanceof Error
                        ? error.message
                        : "نام صحنه معتبر نیست.",
                    );
                  }
                }}
                onContentChange={(id, content) => {
                  try {
                    projects.editScenes((current) =>
                      updateSceneContent(current, id, content),
                    );
                  } catch (error) {
                    projects.setError(
                      error instanceof Error
                        ? error.message
                        : "محتوای صحنه معتبر نیست.",
                    );
                  }
                }}
                onDuplicate={cloneScene}
                onDelete={removeScene}
                onReorder={moveScene}
                onDurationChange={updateSceneDuration}
                onFrameRateChange={changeProjectFrameRate}
                onPlay={playTimeline}
                onPause={pauseTimeline}
                onStop={stopTimeline}
                onSeek={seekTimeline}
                onPreviousScene={() => jumpScene(-1)}
                onNextScene={() => jumpScene(1)}
                selectedEventId={selectedActionEventRecord?.id ?? null}
                audio={projects.audio}
                assetNames={Object.fromEntries(
                  Object.values(projects.active?.assetManifest ?? {})
                    .filter((asset) => asset.kind === "audio")
                    .map((asset) => [asset.id, asset.displayName]),
                )}
                selectedAudioClipId={
                  initialTimelineAudioSelection?.clipId ?? null
                }
                selectedSpeakerRegionId={
                  initialTimelineAudioSelection?.regionId ?? null
                }
                characterNames={Object.fromEntries(
                  Object.values(
                    projects.characterData.characterInstances,
                  ).flatMap((instance) => {
                    const identity =
                      projects.characterData.characterIdentities[
                        instance.characterId
                      ];
                    return identity ? [[instance.id, identity.name]] : [];
                  }),
                )}
                identityNames={Object.fromEntries(
                  Object.values(projects.characterData.characterIdentities).map(
                    (identity) => [identity.id, identity.name],
                  ),
                )}
                assetDurations={Object.fromEntries(
                  Object.values(projects.active?.assetManifest ?? {})
                    .filter(
                      (asset) =>
                        asset.kind === "audio" &&
                        asset.audioDurationSeconds !== undefined,
                    )
                    .map((asset) => [asset.id, asset.audioDurationSeconds!]),
                )}
                onEditAudio={projects.editAudio}
                onDropAudioFile={importAudioAtScene}
                onDropAudioAsset={(assetId, sceneId, frame) =>
                  placeAudioAsset(
                    assetId,
                    sceneId,
                    frame,
                    projects.active?.assetManifest[assetId]
                      ?.audioDurationSeconds ?? Number.NaN,
                  )
                }
                onSelectEvent={(sceneId, eventId, frame) => {
                  seekTimeline(frame);
                  selectActionEvent(eventId, sceneId);
                }}
                onMoveEvent={(sceneId, eventId, startFrame) =>
                  editActionEvents(sceneId, (scene) =>
                    moveSceneActionEvent(scene, eventId, startFrame),
                  )
                }
                onSelectAudio={(assetId, clipId, frame, regionId) => {
                  if (projects.active)
                    setTimelineAudioSelection({
                      projectId: projects.active.id,
                      assetId,
                      clipId,
                      ...(regionId ? { regionId } : {}),
                    });
                  setActiveSection("audio");
                  dispatchPanel({ type: "section" });
                  seekTimeline(frame);
                }}
              />
            </div>
          )}
        </main>
        {inspectorOpen && (
          <button
            type="button"
            className="workspace-mobile-scrim"
            aria-label="بستن پنل ویرایش"
            onClick={closeInspector}
          />
        )}
      </div>
      <ContextHelpDrawer topic={helpTopic} onClose={() => setHelpTopic(null)} />
    </div>
  );
}
