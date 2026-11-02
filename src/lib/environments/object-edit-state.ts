export type ObjectEditState = { selectedId: string | null; editingId: string | null };
export type ObjectEditAction =
  | { type: "select"; id: string | null }
  | { type: "enter"; id: string; editable: boolean }
  | { type: "finish" };

export const initialObjectEditState: ObjectEditState = { selectedId: null, editingId: null };

export function reduceObjectEditState(state: ObjectEditState, action: ObjectEditAction): ObjectEditState {
  if (action.type === "finish") return { ...state, editingId: null };
  if (action.type === "select") return action.id === state.selectedId
    ? state : { selectedId: action.id, editingId: null };
  return action.editable && action.id === state.selectedId
    ? { ...state, editingId: action.id } : state;
}

export function shouldEnterObjectEditMode(clickCount: number, editable: boolean): boolean {
  return clickCount >= 2 && editable;
}

export function lockOrbitControls(controls: { enabled?: boolean } | null): () => void {
  if (!controls) return () => undefined;
  const wasEnabled = controls.enabled !== false;
  controls.enabled = false;
  return () => { controls.enabled = wasEnabled; };
}
