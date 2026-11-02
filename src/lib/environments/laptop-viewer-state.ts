export type LaptopViewerMode = "device" | "screen" | "content";
export type LaptopViewerState = { open: boolean; fullscreen: boolean; message: string | null; mode: LaptopViewerMode };
export type LaptopViewerAction =
  | { type: "open" }
  | { type: "fullscreen"; value: boolean }
  | { type: "mode"; value: LaptopViewerMode }
  | { type: "message"; value: string | null }
  | { type: "close" };

export const initialLaptopViewerState: LaptopViewerState = { open: false, fullscreen: false, message: null, mode: "device" };

export function reduceLaptopViewerState(state: LaptopViewerState, action: LaptopViewerAction): LaptopViewerState {
  if (action.type === "open") return { ...state, open: true, fullscreen: false, message: null };
  if (action.type === "fullscreen") return { ...state, fullscreen: action.value };
  if (action.type === "mode") return { ...state, mode: action.value };
  if (action.type === "message") return { ...state, message: action.value };
  return initialLaptopViewerState;
}
