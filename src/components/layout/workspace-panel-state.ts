export type WorkspacePanelState = { open: boolean; view: "section" | "properties" };

export type WorkspacePanelAction =
  | { type: "section" }
  | { type: "selection" }
  | { type: "view"; view: WorkspacePanelState["view"] }
  | { type: "toggle" }
  | { type: "close" }
  | { type: "viewport"; mobile: boolean };

export const initialWorkspacePanelState: WorkspacePanelState = { open: true, view: "section" };

export function reduceWorkspacePanelState(state: WorkspacePanelState, action: WorkspacePanelAction): WorkspacePanelState {
  switch (action.type) {
    case "section": return { open: true, view: "section" };
    case "selection": return { open: true, view: "properties" };
    case "view": return { ...state, view: action.view };
    case "toggle": return { ...state, open: !state.open };
    case "close": return { ...state, open: false };
    case "viewport": return { ...state, open: !action.mobile };
  }
}
