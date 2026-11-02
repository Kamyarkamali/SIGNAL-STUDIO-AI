"use client";

import { useState } from "react";
import type { SectionId } from "@/config/navigation";
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
import { CharacterEditor, CharacterProperties } from "@/components/characters/character-editor";
import { addCharacterInstance, createCharacterIdentity, removeCharacterInstance, renameCharacter, resetCharacterPlacement, updateCharacterState } from "@/lib/characters/character-operations";
import { environmentRegistry } from "@/lib/environments/registry";

export function EditorShell() {
  const [activeSection, setActiveSection] = useState<SectionId>("projects");
  const projects = useProjects();
  const [selection, setSelection] = useState<{ projectId: string; propId: string } | null>(null);
  const [characterSelection, setCharacterSelection] = useState<{ projectId: string; instanceId: string } | null>(null);
  const [mode, setMode] = useState<TransformMode>("translate");
  const [inspectPropId, setInspectPropId] = useState<string | null>(null);
  const [mediaPlaying, setMediaPlaying] = useState(true);
  const selectedId = selection && selection.projectId === projects.active?.id ? selection.propId : null;
  const selectedCharacterId = characterSelection && characterSelection.projectId === projects.active?.id ? characterSelection.instanceId : null;
  const selectProp = (id: string | null) => {
    setCharacterSelection(null);
    setSelection(id && projects.active ? { projectId: projects.active.id, propId: id } : null);
    if (id) setActiveSection("environments");
    if (!id || projects.arrangement?.props.find((prop) => prop.id === id)?.definitionId !== "prop:laptop") setInspectPropId(null);
  };
  const selectCharacter = (id: string | null) => {
    setSelection(null);
    setCharacterSelection(id && projects.active ? { projectId: projects.active.id, instanceId: id } : null);
    if (id) { setActiveSection("characters"); setInspectPropId(null); }
  };
  const commitTransform = (id: string, transform: TransformConfig) => projects.editArrangement((current) => updateProp(current, id, { transform }));
  const characterEnvironment = projects.active && environmentRegistry.get(projects.active.environmentArrangement.environmentId);
  const createIdentity = (name: string, modelId: string) => projects.editCharacters((current) => createCharacterIdentity(current, crypto.randomUUID(), name, modelId));
  const addCharacter = (characterId: string) => projects.editCharacters((current) => addCharacterInstance(current, characterId, crypto.randomUUID(), characterEnvironment?.characterAnchors ?? []));
  const setCharacterVisible = (instanceId: string, visible: boolean) => projects.editCharacters((current) => updateCharacterState(current, instanceId, { visible }));
  const commitCharacter = (instanceId: string, state: import("@/lib/characters/character-schema").CharacterState) =>
    projects.editCharacters((current) => updateCharacterState(current, instanceId, state));

  return (
    <div className="app-background min-h-screen">
      <a
        className="fixed -top-16 right-3 z-20 rounded-md bg-accent px-3.5 py-2 text-[#061315] focus:top-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#65e6d7]"
        href="#section-title"
      >
        پرش به محتوای اصلی
      </a>
      <TopToolbar onHelp={() => setActiveSection("help")} projectTitle={projects.active?.title} />
      <div
        className="grid min-h-[calc(100vh-72px)] grid-cols-[220px_minmax(0,1fr)] max-[1120px]:grid-cols-[190px_minmax(0,1fr)] max-[850px]:block"
        dir="rtl"
      >
        <MainNavigation
          activeSection={activeSection}
          onSelect={setActiveSection}
        />
        <main className="flex min-w-0 flex-col gap-4 px-[22px] pt-[19px] pb-[22px] max-[1120px]:p-[15px] max-[650px]:gap-2.5 max-[650px]:p-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_260px] items-stretch gap-4 max-[1120px]:grid-cols-[minmax(0,1fr)_220px] max-[850px]:grid-cols-[minmax(0,1fr)_210px] max-[650px]:flex max-[650px]:flex-col max-[650px]:gap-2.5">
            <div className="flex min-w-0 flex-col gap-3.5">
              {activeSection === "projects" ? <ProjectManager projects={projects} /> : activeSection === "characters"
                ? <CharacterEditor data={projects.characterData} active={Boolean(projects.active)} selectedId={selectedCharacterId} saveStatus={projects.saveStatus}
                    onCreate={createIdentity} onAdd={addCharacter} onSelect={selectCharacter} onVisibility={setCharacterVisible}
                    onRemove={(id) => projects.editCharacters((current) => removeCharacterInstance(current, id))}
                    onRename={(id, name) => projects.editCharacters((current) => renameCharacter(current, id, name))} />
                : activeSection === "environments"
                ? <EnvironmentEditor arrangement={projects.arrangement} selectedId={selectedId} onSelect={selectProp}
                    onEdit={projects.editArrangement} saveStatus={projects.saveStatus} onSave={() => { void projects.saveNow().catch(() => undefined); }} />
                : <SectionContent section={activeSection} />}
              <StudioViewport arrangement={projects.arrangement} selectedId={selectedId} onSelect={selectProp} onCommit={commitTransform} mode={mode}
                projectId={projects.active?.id ?? null} displayAssignments={projects.displayAssignments} mediaPlaying={mediaPlaying} inspectPropId={inspectPropId}
                characterData={projects.characterData} selectedCharacterId={selectedCharacterId} onCharacterSelect={selectCharacter} onCharacterCommit={commitCharacter} />
            </div>
            {activeSection === "characters" ? <CharacterProperties data={projects.characterData} selectedId={selectedCharacterId} mode={mode} onModeChange={setMode}
              onEdit={commitCharacter} onReset={(id) => projects.editCharacters((current) => resetCharacterPlacement(current, id))} /> : <PropertiesPanel section={activeSection} projectTitle={projects.active?.title}
              arrangement={activeSection === "environments" ? projects.arrangement : null} selectedId={selectedId}
              onEdit={projects.editArrangement} mode={mode} onModeChange={setMode} project={projects.active}
              displayAssignments={projects.displayAssignments} onDisplayChange={projects.editDisplay} onUploadDisplay={projects.uploadDisplay}
              inspecting={inspectPropId === selectedId} onInspect={() => setInspectPropId(inspectPropId === selectedId ? null : selectedId)}
              mediaPlaying={mediaPlaying} onTogglePlayback={() => setMediaPlaying((current) => !current)} />}
          </div>
          <TimelinePlaceholder />
        </main>
      </div>
    </div>
  );
}
