export function hasWebGL(createCanvas: () => Pick<HTMLCanvasElement, "getContext">): boolean {
  try {
    const canvas = createCanvas();
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!context) return false;
    // The probe canvas is temporary; release its GPU context before R3F creates its own.
    (context as WebGLRenderingContext).getExtension?.("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function watchContextLoss(canvas: HTMLCanvasElement, onLost: () => void): () => void {
  const handleLoss = (event: Event) => {
    event.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLoss);
  return () => canvas.removeEventListener("webglcontextlost", handleLoss);
}
