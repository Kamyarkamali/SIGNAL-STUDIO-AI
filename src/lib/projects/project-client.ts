import type { ProjectDocument, ProjectSummary } from "./project-schema.ts";

export type ProjectList = { projects: ProjectSummary[]; issues: { id: string; message: string }[] };

export async function projectRequest<T>(url: string, method = "GET", body?: object): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = data as { error?: { message?: string } };
    throw new Error(error.error?.message || "ارتباط با محل ذخیره‌سازی برقرار نشد.");
  }
  return data as T;
}

export const projectUrl = (id: string) => `/api/projects/${encodeURIComponent(id)}`;
export type { ProjectDocument, ProjectSummary };
