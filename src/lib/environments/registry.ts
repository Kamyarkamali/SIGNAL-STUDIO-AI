import { createEnvironmentRegistry } from "./environment-registry.ts";
import { STUDIO_01 } from "./studio-01.ts";

// Only finished, renderable environments belong in this registry.
export const environmentRegistry = createEnvironmentRegistry([STUDIO_01]);
