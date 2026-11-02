export const audioAssetUrl = (projectId: string, assetId: string) =>
  `/api/projects/${encodeURIComponent(projectId)}/audio-assets/${encodeURIComponent(assetId)}`;
