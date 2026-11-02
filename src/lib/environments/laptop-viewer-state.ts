export type LaptopViewerState = { open: boolean; fullscreen: boolean; message: string | null };
export type LaptopViewerAction =
  | { type: "open" }
  | { type: "fullscreen"; value: boolean }
  | { type: "message"; value: string | null }
  | { type: "close" };

export const initialLaptopViewerState: LaptopViewerState = { open: false, fullscreen: false, message: null };

export function reduceLaptopViewerState(state: LaptopViewerState, action: LaptopViewerAction): LaptopViewerState {
  if (action.type === "open") return { open: true, fullscreen: false, message: null };
  if (action.type === "fullscreen") return { ...state, fullscreen: action.value };
  if (action.type === "message") return { ...state, message: action.value };
  return initialLaptopViewerState;
}
