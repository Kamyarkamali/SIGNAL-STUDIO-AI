import { z } from "zod";

const vectorSchema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

// Production camera data is serializable and never reads editor orbit state.
export const productionCameraSchema = z.object({
  position: vectorSchema,
  target: vectorSchema,
  fov: z.number().finite().min(10).max(100),
  near: z.number().finite().positive(),
  far: z.number().finite().positive(),
}).strict().superRefine((camera, context) => {
  if (camera.near >= camera.far) context.addIssue({ code: "custom", message: "بازهٔ دوربین نامعتبر است." });
  if (camera.position.every((value, index) => value === camera.target[index])) {
    context.addIssue({ code: "custom", message: "موقعیت و هدف دوربین باید متفاوت باشند." });
  }
});

export type ProductionCameraConfig = z.infer<typeof productionCameraSchema>;

export const DEFAULT_PRODUCTION_CAMERA: ProductionCameraConfig = {
  position: [4, 3, 6], target: [0, 0.75, 0], fov: 45, near: 0.1, far: 100,
};

export const EDITOR_CAMERA = {
  position: [4, 3, 6] as [number, number, number],
  target: [0, 0.75, 0] as [number, number, number],
  fov: 45,
  near: 0.1,
  far: 100,
  minDistance: 2,
  maxDistance: 20,
};
