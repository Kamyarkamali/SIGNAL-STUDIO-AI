import type { ProjectDocument } from "@/lib/projects/project-schema";

export type DisplayAssignment = ProjectDocument["displayAssignments"][string];

/** Removes only the laptop's image reference; video assignment and display controls are retained. */
export function removeLaptopImageAssignment(assignment: DisplayAssignment): DisplayAssignment {
  const retained = { ...assignment };
  delete retained.imageAssetId;
  return { ...retained, state: assignment.state === "image" ? "off" : assignment.state };
}
