import type { SectionId } from "@/config/navigation";

export function WorkspaceIcon({ section }: { section: SectionId }) {
  const path = {
    projects: <><path d="M3 7h6l2 2h10v11H3z" /><path d="M3 7V4h7l2 3" /></>,
    scenes: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M7 5l3 5m4-5 3 5" /></>,
    characters: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    audio: <><path d="M10 18V5l11-2v13M10 9l11-2" /><ellipse cx="7" cy="18" rx="3" ry="2" /><ellipse cx="18" cy="16" rx="3" ry="2" /></>,
    camera: <><path d="M3 8h4l2-3h6l2 3h4v12H3z" /><circle cx="12" cy="14" r="3.5" /></>,
    environments: <><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10" /></>,
    settings: <><circle cx="12" cy="12" r="4" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.9 4.9l2.8 2.8m8.6 8.6 2.8 2.8m0-14.2-2.8 2.8m-8.6 8.6-2.8 2.8" /></>,
    animations: <><path d="m12 2 2.1 6.9L21 11l-6.9 2.1L12 20l-2.1-6.9L3 11l6.9-2.1z" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-.7.8-1.9 1.4-1.9 3.1M12 17h.01" /></>,
  } as Partial<Record<SectionId, React.ReactNode>>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path[section]}</svg>;
}
