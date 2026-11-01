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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const activeRef = useRef<ProjectDocument | null>(null);
  const draftRef = useRef("");
  const arrangementRef = useRef<EnvironmentArrangement | null>(null);
  const pendingSave = useRef<Promise<void> | null>(null);

  const select = useCallback((project: ProjectDocument | null) => {
    activeRef.current = project;
    draftRef.current = project?.title ?? "";
    arrangementRef.current = project?.environmentArrangement ?? null;
    setActive(project);
    setDraftName(project?.title ?? "");
    setArrangement(project?.environmentArrangement ?? null);
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

  const hasChanges = () => activeRef.current && (draftRef.current.trim() !== activeRef.current.title ||
    JSON.stringify(arrangementRef.current) !== JSON.stringify(activeRef.current.environmentArrangement));

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
    const operation = (async () => {
      setSaveStatus("saving");
      try {
        const saved = await projectRequest<ProjectDocument>(projectUrl(project.id), "PATCH", { title, expectedRevision: project.revision, environmentArrangement: snapshot });
        if (activeRef.current?.id === saved.id) {
          activeRef.current = saved;
          setActive(saved);
          setSaveStatus(statusAfterSave(saved.title, draftRef.current) === "saved" &&
            JSON.stringify(snapshot) === JSON.stringify(arrangementRef.current) ? "saved" : "dirty");
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
  }, [active, draftName, arrangement, saveStatus, saveNow]);

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

  return { list, loading, busy, error, setError, active, arrangement, editArrangement, draftName, saveStatus, refresh, editName, saveNow, create, open, rename, duplicate, remove, close };
}
