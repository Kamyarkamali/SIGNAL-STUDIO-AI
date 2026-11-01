export type SaveStatus = "saved" | "saving" | "dirty" | "error";

export function statusAfterSave(savedTitle: string, currentDraft: string): SaveStatus {
  return savedTitle === currentDraft.trim() ? "saved" : "dirty";
}
