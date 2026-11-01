export type DisplayFit = "contain" | "cover";

export function displayFit(screenWidth: number, screenHeight: number, sourceWidth: number, sourceHeight: number, mode: DisplayFit) {
  if (![screenWidth, screenHeight, sourceWidth, sourceHeight].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Invalid display dimensions");
  }
  const screenAspect = screenWidth / screenHeight;
  const sourceAspect = sourceWidth / sourceHeight;
  if (mode === "contain") {
    return sourceAspect > screenAspect
      ? { width: screenWidth, height: screenWidth / sourceAspect, repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 }
      : { width: screenHeight * sourceAspect, height: screenHeight, repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 };
  }
  if (mode !== "cover") throw new Error("Invalid display fit");
  return sourceAspect > screenAspect
    ? { width: screenWidth, height: screenHeight, repeatX: screenAspect / sourceAspect, repeatY: 1,
      offsetX: (1 - screenAspect / sourceAspect) / 2, offsetY: 0 }
    : { width: screenWidth, height: screenHeight, repeatX: 1, repeatY: sourceAspect / screenAspect,
      offsetX: 0, offsetY: (1 - sourceAspect / screenAspect) / 2 };
}
