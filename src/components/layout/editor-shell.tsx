"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { navigationItems, helpItem, type SectionId } from "@/config/navigation";
import { MainNavigation } from "@/components/navigation/main-navigation";
import { TopToolbar } from "./top-toolbar";
import { SectionContent } from "./section-content";
import { StudioViewport } from "@/components/viewport/studio-viewport";
import { PropertiesPanel, type TransformMode } from "./properties-panel";
import { EnvironmentEditor } from "@/components/viewport/environment-editor";
import { updateProp } from "@/lib/environments/arrangement";
import type { TransformConfig } from "@/lib/environments/environment-registry";
import { TimelinePlaceholder } from "./timeline-placeholder";
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
    projectId: string | null;
    byInstance: Record<string, CharacterPreviewPlayback>;
  }>({ projectId: null, byInstance: {} });
  const [gazeState, setGazeState] = useState<{
    projectId: string | null;
    byInstance: Record<string, GazePreview>;
  }>({ projectId: null, byInstance: {} });
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
  const [showRoomWalls, setShowRoomWalls] = useState(true);
  const [panel, dispatchPanel] = useReducer(
    reduceWorkspacePanelState,
    initialWorkspacePanelState,
  );
  const inspectorOpen = panel.open;
  const inspectorView = panel.view;
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 650px)");
    const syncPanel = () =>
      dispatchPanel({ type: "viewport", mobile: narrow.matches });
    syncPanel();
    narrow.addEventListener("change", syncPanel);
    return () => narrow.removeEventListener("change", syncPanel);
  }, []);
  const openSection = (section: SectionId) => {
    setActiveSection(section);
    dispatchPanel({ type: "section" });
  };
  const activeProjectId = projects.active?.id ?? null;
  const characterPreviews = useMemo(
    () =>
      previewState.projectId === activeProjectId ? previewState.byInstance : {},
    [previewState, activeProjectId],
  );
  const characterGazes = useMemo(
    () => (gazeState.projectId === activeProjectId ? gazeState.byInstance : {}),
    [gazeState, activeProjectId],
  );
  const setPreviewEntries = useCallback(
    (
      update: (
        current: Record<string, CharacterPreviewPlayback>,
      ) => Record<string, CharacterPreviewPlayback>,
    ) => {
      setPreviewState((current) => {
        const currentEntries =
          current.projectId === activeProjectId ? current.byInstance : {};
        return {
          projectId: activeProjectId,
          byInstance: update(currentEntries),
        };
      });
    },
    [activeProjectId],
  );
  const setGazeEntries = useCallback(
    (
      update: (
        current: Record<string, GazePreview>,
      ) => Record<string, GazePreview>,
    ) => {
      setGazeState((current) => ({
        projectId: activeProjectId,
        byInstance: update(
          current.projectId === activeProjectId ? current.byInstance : {},
        ),
      }));
    },
    [activeProjectId],
  );
  const selectedId =
    selection && selection.projectId === projects.active?.id
      ? selection.propId
      : null;
  const selectedCharacterId =
    characterSelection && characterSelection.projectId === projects.active?.id
      ? characterSelection.instanceId
      : null;
  const selectedCharacterInstance = selectedCharacterId
    ? projects.characterData.characterInstances[selectedCharacterId]
    : undefined;
  const selectedCharacterIdentity = selectedCharacterInstance
    ? projects.characterData.characterIdentities[
        selectedCharacterInstance.characterId
      ]
    : undefined;
  const selectedCharacterModelId = selectedCharacterIdentity?.modelId;
  const selectedGaze = selectedCharacterId
    ? characterGazes[selectedCharacterId]
    : undefined;
  const gazeTargets = useMemo(() => {
    const characters = Object.values(
      projects.characterData.characterInstances,
    ).flatMap((instance) => {
      const state = projects.characterData.characterStates[instance.id];
      const identity =
        projects.characterData.characterIdentities[instance.characterId];
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
    const props = (projects.arrangement?.props ?? []).flatMap((prop) => {
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
  }, [projects.characterData, projects.arrangement]);
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
              : patch.mode === "neutral" ? 0.55 : 3600),
          transitionSeconds:
            patch.transitionSeconds ?? previous?.transitionSeconds ?? 0.45,
        };
        return { ...current, [instanceId]: next };
      });
    },
    [projects.characterData, setGazeEntries],
  );
  const resetCharacterGaze = useCallback(
    (instanceId: string) => changeCharacterGaze(instanceId, { mode: "neutral" }),
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
      if (actionId === "neutral") {
        stopCharacterPreview(instanceId);
        return;
      }
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
      if (!isPreviewActionSupported(actionId, capabilities)) return;
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
  const commitTransform = (id: string, transform: TransformConfig) =>
    projects.editArrangement((current) =>
      updateProp(current, id, { transform }),
    );
  const characterEnvironment =
    projects.active &&
    environmentRegistry.get(
      projects.active.environmentArrangement.environmentId,
    );
  const createIdentity = (name: string, modelId: string) =>
    projects.editCharacters((current) =>
      createCharacterIdentity(current, crypto.randomUUID(), name, modelId),
    );
  const addCharacter = (characterId: string) =>
    projects.editCharacters((current) =>
      addCharacterInstance(current, characterId, crypto.randomUUID()),
    );
  const assignPlacement = (instanceId: string, anchorId: string | null) => {
    void projects.editCharactersAndSave((current) =>
      assignCharacterPlacement(
        current,
        instanceId,
        anchorId,
        characterEnvironment?.characterAnchors ?? [],
      ),
    );
  };
  const setCharacterVisible = (instanceId: string, visible: boolean) =>
    projects.editCharacters((current) =>
      updateCharacterState(current, instanceId, { visible }),
    );
  const commitCharacter = (
    instanceId: string,
    state: import("@/lib/characters/character-schema").CharacterState,
  ) =>
    projects.editCharacters((current) =>
      updateCharacterState(current, instanceId, state),
    );
  const activeItem =
    activeSection === "help"
      ? helpItem
      : navigationItems.find((item) => item.id === activeSection);

  const sectionEditor =
    activeSection === "projects" ? (
      <ProjectManager projects={projects} />
    ) : activeSection === "characters" ? (
      <CharacterEditor
        data={projects.characterData}
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
        onRemove={(id) =>
          projects.editCharacters((current) =>
            removeCharacterInstance(current, id),
          )
        }
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
    ) : activeSection === "environments" ? (
      <EnvironmentEditor
        arrangement={projects.arrangement}
        selectedId={selectedId}
        onSelect={selectProp}
        showRoomWalls={showRoomWalls}
        onToggleRoomWalls={() => setShowRoomWalls((value) => !value)}
        editing={objectEdit.editingId === selectedId}
        onEnterEdit={() => selectedId && enterPropEdit(selectedId, true)}
        onFinishEdit={() => dispatchObjectEdit({ type: "finish" })}
        mode={mode}
        onModeChange={setMode}
        onEdit={projects.editArrangement}
        saveStatus={projects.saveStatus}
        onSave={() => {
          void projects.saveNow().catch(() => undefined);
        }}
        project={projects.active}
        onUpload={projects.uploadDisplay}
      />
    ) : (
      <SectionContent section={activeSection} />
    );

  const propertiesEditor =
    activeSection === "characters" ? (
      <CharacterProperties
        data={projects.characterData}
        selectedId={selectedCharacterId}
        mode={mode}
        onModeChange={setMode}
        onEdit={commitCharacter}
        onReset={(id) =>
          projects.editCharacters((current) =>
            resetCharacterPlacement(current, id),
          )
        }
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
      />
    ) : (
      <PropertiesPanel
        section={activeSection}
        projectTitle={projects.active?.title}
        arrangement={
          activeSection === "environments" ? projects.arrangement : null
        }
        selectedId={selectedId}
        editing={objectEdit.editingId === selectedId}
        onEnterEdit={() =>
          selectedId &&
          enterPropEdit(
            selectedId,
            STUDIO_01.propDefinitions.find(
              (definition) =>
                definition.id ===
                projects.arrangement?.props.find(
                  (prop) => prop.id === selectedId,
                )?.definitionId,
            )?.editable !== false,
          )
        }
        onFinishEdit={() => dispatchObjectEdit({ type: "finish" })}
        onEdit={projects.editArrangement}
        mode={mode}
        onModeChange={setMode}
        project={projects.active}
        displayAssignments={projects.displayAssignments}
        onDisplayChange={projects.editDisplay}
        onUploadDisplay={projects.uploadDisplay}
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
      <TopToolbar
        onHelp={() => openSection("help")}
        projectTitle={projects.active?.title}
      />
      <div
        className="editor-layout grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] max-[1120px]:grid-cols-[180px_minmax(0,1fr)] max-[850px]:grid-cols-1"
        dir="rtl"
      >
        <MainNavigation activeSection={activeSection} onSelect={openSection} />
        <main className="editor-workspace flex min-h-0 min-w-0 flex-col gap-3 p-3 max-[1120px]:p-3 max-[650px]:gap-2 max-[650px]:p-2">
          <div className="flex min-h-9 flex-none items-center justify-between gap-3 border-b border-line px-1 pb-1">
            <span className="min-w-0 truncate text-xs font-semibold text-[#c9d8e5]">
              {activeItem?.label ?? "فضای کار"}
            </span>
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
          <div
            className={`workspace-main min-h-0 flex-1 ${inspectorOpen ? "workspace-main-with-inspector" : "workspace-main-without-inspector"}`}
          >
            <section
              className="workspace-canvas min-h-0 min-w-0"
              aria-label="پیش‌نمایش سه‌بعدی"
            >
              <StudioViewport
                arrangement={projects.arrangement}
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
                characterData={projects.characterData}
                selectedCharacterId={selectedCharacterId}
                onCharacterSelect={selectCharacter}
                onCharacterCommit={commitCharacter}
                showRoomWalls={showRoomWalls}
                characterPreviews={characterPreviews}
                characterGazes={characterGazes}
                onCharacterPreviewComplete={finishCharacterPreview}
              />
            </section>
            <aside
              id="workspace-inspector"
              className={`workspace-inspector min-h-0 ${inspectorOpen ? "workspace-inspector-open" : "workspace-inspector-closed"}`}
              aria-label="پنل ویرایش"
              aria-hidden={!inspectorOpen}
            >
              <div
                className="workspace-inspector-tabs flex flex-none items-center border-b border-line"
                role="tablist"
                aria-label="پنل ویرایش"
              >
                <button
                  type="button"
                  role="tab"
                  id="workspace-section-tab"
                  aria-controls="workspace-section-pane"
                  aria-selected={inspectorView === "section"}
                  className="workspace-inspector-tab min-w-0 flex-1 truncate px-3 py-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent"
                  onClick={() =>
                    dispatchPanel({ type: "view", view: "section" })
                  }
                >
                  {activeItem?.label ?? "بخش"}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="workspace-properties-tab"
                  aria-controls="workspace-properties-pane"
                  aria-selected={inspectorView === "properties"}
                  className="workspace-inspector-tab min-w-0 flex-1 px-3 py-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent"
                  onClick={() =>
                    dispatchPanel({ type: "view", view: "properties" })
                  }
                >
                  ویژگی‌ها
                </button>
                <button
                  type="button"
                  className="hidden rounded-md px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-accent max-[650px]:inline-flex"
                  onClick={() => dispatchPanel({ type: "close" })}
                  aria-label="بستن پنل"
                >
                  ✕
                </button>
              </div>
              <div
                id="workspace-section-pane"
                role="tabpanel"
                aria-labelledby="workspace-section-tab"
                hidden={inspectorView !== "section"}
                className="workspace-pane min-h-0 flex-1"
              >
                {sectionEditor}
              </div>
              <div
                id="workspace-properties-pane"
                role="tabpanel"
                aria-labelledby="workspace-properties-tab"
                hidden={inspectorView !== "properties"}
                className="workspace-pane min-h-0 flex-1"
              >
                {propertiesEditor}
              </div>
            </aside>
          </div>
          <div className="workspace-timeline flex-none">
            <TimelinePlaceholder />
          </div>
        </main>
        {inspectorOpen && (
          <button
            type="button"
            className="workspace-mobile-scrim"
            aria-label="بستن پنل ویرایش"
            onClick={() => dispatchPanel({ type: "close" })}
          />
        )}
      </div>
    </div>
  );
}
