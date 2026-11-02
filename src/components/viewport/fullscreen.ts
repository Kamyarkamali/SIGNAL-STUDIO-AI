export type FullscreenActionResult = "changed" | "unsupported" | "denied";

export interface FullscreenElementLike {
  requestFullscreen?: () => Promise<void>;
}

export interface FullscreenDocumentLike {
  fullscreenElement: unknown;
  exitFullscreen?: () => Promise<void>;
}

/** Request a browser fullscreen transition; UI state should follow fullscreenchange. */
export async function toggleElementFullscreen(
  element: FullscreenElementLike,
  documentLike: FullscreenDocumentLike,
): Promise<FullscreenActionResult> {
  try {
    if (documentLike.fullscreenElement === element) {
      if (!documentLike.exitFullscreen) return "unsupported";
      await documentLike.exitFullscreen();
      return "changed";
    }

    if (!element.requestFullscreen) return "unsupported";
    await element.requestFullscreen();
    return "changed";
  } catch {
    return "denied";
  }
}

export function isElementFullscreen(
  element: unknown,
  documentLike: Pick<FullscreenDocumentLike, "fullscreenElement">,
) {
  return documentLike.fullscreenElement === element;
}
