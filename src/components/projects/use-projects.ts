"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { projectRequest, projectUrl, type ProjectDocument, type ProjectList, type ProjectSummary } from "@/lib/projects/project-client";
import { statusAfterSave, type SaveStatus } from "@/lib/projects/save-state";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";

export type { SaveStatus } from "@/lib/projects/save-state";

export function useProjects() {
  const [list, setList] = useState<ProjectList>({ projects: [], issues: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<ProjectDocument | null>(null);
  const [draftName, setDraftName] = useState("");
  const [arrangement, setArrangement] = useState<EnvironmentArrangement | null>(null);
  const [displayAssignments, setDisplayAssignments] = useState<ProjectDocument["displayAssignments"]>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const activeRef = useRef<ProjectDocument | null>(null);
  const draftRef = useRef("");
  const arrangementRef = useRef<EnvironmentArrangement | null>(null);
  const displayRef = useRef<ProjectDocument["displayAssignments"]>({});
  const pendingSave = useRef<Promise<void> | null>(null);

  const select = useCallback((project: ProjectDocument | null) => {
    activeRef.current = project;
    draftRef.current = project?.title ?? "";
    arrangementRef.current = project?.environmentArrangement ?? null;
    displayRef.current = project?.displayAssignments ?? {};
    setActive(project);
    setDraftName(project?.title ?? "");
    setArrangement(project?.environmentArrangement ?? null);
    setDisplayAssignments(project?.displayAssignments ?? {});
    setSaveStatus("saved");
    try {
      if (project) sessionStorage.setItem("signal-studio-active-project", project.id);
      else sessionStorage.removeItem("signal-studio-active-project");
    } catch { /* Project files remain the source of truth when browser storage is unavailable. */ }
  }, []);

  const refresh = useCallback(async () => {
    const result = await projectRequest<ProjectList>("/api/projects");
    setList(result);
    return result;
  }, []);

  useEffect(() => {
    let current = true;
    projectRequest<ProjectList>("/api/projects").then(async (result) => {
      if (!current) return;
      setList(result);
      let remembered: string | null = null;
      try { remembered = sessionStorage.getItem("signal-studio-active-project"); } catch { /* Optional convenience only. */ }
      if (remembered && result.projects.some((item) => item.id === remembered)) {
        try {
          const reopened = await projectRequest<ProjectDocument>(projectUrl(remembered));
          if (current && !activeRef.current) select(reopened);
        } catch { try { sessionStorage.removeItem("signal-studio-active-project"); } catch { /* ignore */ } }
      }
    }).catch((cause: unknown) => {
      if (current) setError(cause instanceof Error ? cause.message : "خواندن پروژه‌ها ممکن نشد.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [select]);

  const editName = (value: string) => {
    draftRef.current = value;
    setDraftName(value);
    setSaveStatus("dirty");
  };

  const editArrangement = (updater: (current: EnvironmentArrangement) => EnvironmentArrangement) => {
    if (!arrangementRef.current) return;
    const next = updater(arrangementRef.current);
    arrangementRef.current = next;
    setArrangement(next);
    setSaveStatus("dirty");
  };

  const editDisplay = (propId: string, assignment: ProjectDocument["displayAssignments"][string]) => {
    if (!activeRef.current) return;
    const next = { ...displayRef.current, [propId]: assignment };
    displayRef.current = next;
    setDisplayAssignments(next);
    setSaveStatus("dirty");
  };

  const hasChanges = () => activeRef.current && (draftRef.current.trim() !== activeRef.current.title ||
    JSON.stringify(arrangementRef.current) !== JSON.stringify(activeRef.current.environmentArrangement) ||
    JSON.stringify(displayRef.current) !== JSON.stringify(activeRef.current.displayAssignments));

  const saveNow = useCallback(async () => {
    if (pendingSave.current) await pendingSave.current.catch(() => undefined);
    const project = activeRef.current;
    if (!project) return;
    if (!hasChanges()) {
      draftRef.current = project.title;
      setDraftName(project.title);
      setSaveStatus("saved");
      return;
    }
    const title = draftRef.current.trim();
    const snapshot = arrangementRef.current;
    const displaySnapshot = displayRef.current;
    const operation = (async () => {
      setSaveStatus("saving");
      try {
        const saved = await projectRequest<ProjectDocument>(projectUrl(project.id), "PATCH", { title, expectedRevision: project.revision,
          environmentArrangement: snapshot, displayAssignments: displaySnapshot });
        if (activeRef.current?.id === saved.id) {
          activeRef.current = saved;
          setActive(saved);
          setSaveStatus(statusAfterSave(saved.title, draftRef.current) === "saved" &&
            JSON.stringify(snapshot) === JSON.stringify(arrangementRef.current) &&
            JSON.stringify(displaySnapshot) === JSON.stringify(displayRef.current) ? "saved" : "dirty");
        }
        await refresh().catch(() => setError("پروژه ذخیره شد، اما تازه‌سازی فهرست ممکن نشد."));
      } catch (cause) {
        setSaveStatus("error");
        setError(cause instanceof Error ? cause.message : "خطا در ذخیره");
        throw cause;
      }
    })();
    pendingSave.current = operation;
    try { await operation; }
    finally { if (pendingSave.current === operation) pendingSave.current = null; }
  }, [refresh]);

  useEffect(() => {
    if (!active || saveStatus !== "dirty") return;
    const timer = setTimeout(() => { void saveNow().catch(() => undefined); }, 800);
    return () => clearTimeout(timer);
  }, [active, draftName, arrangement, displayAssignments, saveStatus, saveNow]);

  const uploadDisplay = async (file: File): Promise<string | null> => {
    const project = activeRef.current;
    if (!project) return null;
    setBusy(true); setError("");
    try {
      if (hasChanges()) await saveNow();
      const current = activeRef.current!;
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`${projectUrl(current.id)}/display-assets`, { method: "POST", body: form });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error((data as { error?: { message?: string } }).error?.message || "بارگذاری رسانه ممکن نشد.");
      const updated = data as ProjectDocument;
      const addedId = Object.keys(updated.assetManifest).find((id) => !current.assetManifest[id]);
      select(updated);
      await refresh();
      return addedId ?? null;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "بارگذاری رسانه ممکن نشد."); return null; }
    finally { setBusy(false); }
  };

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError("");
    try { await action(); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "انجام عملیات ممکن نشد."); return false; }
    finally { setBusy(false); }
  };

  const create = (title: string) => run(async () => {
    const created = await projectRequest<ProjectDocument>("/api/projects", "POST", { title });
    await refresh();
    select(created);
  });
  const open = (id: string) => run(async () => {
    if (hasChanges()) await saveNow();
    select(await projectRequest<ProjectDocument>(projectUrl(id)));
  });
  const rename = (project: ProjectSummary, title: string) => run(async () => {
    if (activeRef.current?.id === project.id && hasChanges()) await saveNow();
    const saved = await projectRequest<ProjectDocument>(projectUrl(project.id), "PATCH", { title, expectedRevision: activeRef.current?.id === project.id ? activeRef.current.revision : project.revision });
    if (activeRef.current?.id === saved.id) select(saved);
    await refresh();
  });
  const duplicate = (project: ProjectSummary) => run(async () => {
    if (activeRef.current?.id === project.id && hasChanges()) await saveNow();
    const created = await projectRequest<ProjectDocument>(`${projectUrl(project.id)}/duplicate`, "POST");
    await refresh();
    select(created);
  });
  const remove = (project: ProjectSummary) => run(async () => {
    await projectRequest<{ deleted: true }>(projectUrl(project.id), "DELETE", { expectedRevision: project.revision });
    if (activeRef.current?.id === project.id) select(null);
    await refresh();
  });
  const close = () => run(async () => {
    if (hasChanges()) await saveNow();
    select(null);
  });

  return { list, loading, busy, error, setError, active, arrangement, editArrangement, displayAssignments, editDisplay,
    uploadDisplay, draftName, saveStatus, refresh, editName, saveNow, create, open, rename, duplicate, remove, close };
}
