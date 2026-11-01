"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { projectRequest, projectUrl, type ProjectDocument, type ProjectList, type ProjectSummary } from "@/lib/projects/project-client";
import { statusAfterSave, type SaveStatus } from "@/lib/projects/save-state";

export type { SaveStatus } from "@/lib/projects/save-state";

export function useProjects() {
  const [list, setList] = useState<ProjectList>({ projects: [], issues: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<ProjectDocument | null>(null);
  const [draftName, setDraftName] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const activeRef = useRef<ProjectDocument | null>(null);
  const draftRef = useRef("");
  const pendingSave = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    const result = await projectRequest<ProjectList>("/api/projects");
    setList(result);
    return result;
  }, []);

  useEffect(() => {
    let current = true;
    projectRequest<ProjectList>("/api/projects").then((result) => {
      if (current) setList(result);
    }).catch((cause: unknown) => {
      if (current) setError(cause instanceof Error ? cause.message : "خواندن پروژه‌ها ممکن نشد.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const select = (project: ProjectDocument | null) => {
    activeRef.current = project;
    draftRef.current = project?.title ?? "";
    setActive(project);
    setDraftName(project?.title ?? "");
    setSaveStatus("saved");
  };

  const editName = (value: string) => {
    draftRef.current = value;
    setDraftName(value);
    setSaveStatus("dirty");
  };

  const saveNow = useCallback(async () => {
    if (pendingSave.current) await pendingSave.current.catch(() => undefined);
    const project = activeRef.current;
    if (!project) return;
    if (draftRef.current.trim() === project.title) {
      draftRef.current = project.title;
      setDraftName(project.title);
      setSaveStatus("saved");
      return;
    }
    const title = draftRef.current.trim();
    const operation = (async () => {
      setSaveStatus("saving");
      try {
        const saved = await projectRequest<ProjectDocument>(projectUrl(project.id), "PATCH", { title, expectedRevision: project.revision });
        if (activeRef.current?.id === saved.id) {
          activeRef.current = saved;
          setActive(saved);
          setSaveStatus(statusAfterSave(saved.title, draftRef.current));
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
    if (!active || draftName.trim() === active.title || saveStatus !== "dirty") return;
    const timer = setTimeout(() => { void saveNow().catch(() => undefined); }, 800);
    return () => clearTimeout(timer);
  }, [active, draftName, saveStatus, saveNow]);

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
    if (activeRef.current && draftRef.current.trim() !== activeRef.current.title) await saveNow();
    select(await projectRequest<ProjectDocument>(projectUrl(id)));
  });
  const rename = (project: ProjectSummary, title: string) => run(async () => {
    const saved = await projectRequest<ProjectDocument>(projectUrl(project.id), "PATCH", { title, expectedRevision: project.revision });
    if (activeRef.current?.id === saved.id) select(saved);
    await refresh();
  });
  const duplicate = (project: ProjectSummary) => run(async () => {
    if (activeRef.current?.id === project.id && draftRef.current.trim() !== activeRef.current.title) await saveNow();
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
    if (activeRef.current && draftRef.current.trim() !== activeRef.current.title) await saveNow();
    select(null);
  });

  return { list, loading, busy, error, setError, active, draftName, saveStatus, refresh, editName, saveNow, create, open, rename, duplicate, remove, close };
}
