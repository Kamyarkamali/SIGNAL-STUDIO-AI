export type AudioSourceDraft = { assetId: string; start: string; end: string };

export function sourceDraftValues(
  draft: AudioSourceDraft | null,
  asset: { id: string; audioDurationSeconds?: number } | undefined,
): { start: string; end: string } {
  if (!draft || !asset || draft.assetId !== asset.id) {
    return { start: "0", end: String(asset?.audioDurationSeconds ?? "") };
  }
  return { start: draft.start, end: draft.end };
}
