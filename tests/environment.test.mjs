import test from "node:test";
import assert from "node:assert/strict";
import { createEnvironmentRegistry, copyDefaultProps } from "../src/lib/environments/environment-registry.ts";
import { environmentRegistry } from "../src/lib/environments/registry.ts";
import { STUDIO_01, STUDIO_01_ID } from "../src/lib/environments/studio-01.ts";
import { productionCameraSchema } from "../src/lib/camera/production-camera.ts";

test("only the real studio is registered with a stable environment ID", () => {
  assert.equal(environmentRegistry.list().length, 1);
  assert.equal(environmentRegistry.get(STUDIO_01_ID), STUDIO_01);
  assert.equal(environmentRegistry.get("environment:unavailable"), undefined);
  assert.notEqual(STUDIO_01.id, STUDIO_01.category);
  assert.throws(() => createEnvironmentRegistry([STUDIO_01, STUDIO_01]), /Duplicate environment ID/);
});

test("major props have stable independent definitions and instances", () => {
  const keys = new Set(STUDIO_01.propDefinitions.map((prop) => prop.rendererKey));
  for (const required of ["room-shell", "desk", "chair", "bookshelf", "laptop", "microphone", "acoustic-wall", "practical-lights", "plant"]) {
    assert.ok(keys.has(required), `Missing ${required}`);
  }
  const ids = STUDIO_01.defaultProps.map((prop) => prop.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(STUDIO_01.defaultProps.filter((prop) => prop.definitionId === "prop:chair").length, 3);
  assert.equal(STUDIO_01.defaultProps.filter((prop) => prop.definitionId === "prop:microphone").length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(STUDIO_01)).id, STUDIO_01_ID);
});

test("copying an arrangement isolates each transform and preserves the built-in defaults", () => {
  const first = copyDefaultProps(STUDIO_01);
  const second = copyDefaultProps(STUDIO_01);
  first[2].visible = false;
  first[2].transform.position[0] = 99;
  first[3].transform.rotation[1] = 1.5;
  assert.equal(second[2].visible, true);
  assert.equal(second[2].transform.position[0], 0);
  assert.equal(second[3].transform.rotation[1], 0);
  assert.equal(STUDIO_01.defaultProps[2].transform.position[0], 0);
});

test("host laptop and microphones serve the seated participants, not the audience", () => {
  const byId = (id) => STUDIO_01.defaultProps.find((prop) => prop.id === `studio-01:${id}`);
  const anchor = (role) => STUDIO_01.characterAnchors.find((entry) => entry.role === role);
  const transformPoint = (prop, localZ) => {
    const yaw = prop.transform.rotation[1];
    return [prop.transform.position[0] + Math.sin(yaw) * localZ,
      prop.transform.position[2] + Math.cos(yaw) * localZ];
  };
  const distance = (point, seat) => Math.hypot(point[0] - seat.position[0], point[1] - seat.position[2]);
  const laptop = byId("laptop");
  const host = anchor("host");
  const cohost = anchor("co-host");
  const guest = anchor("guest");
  const keyboard = transformPoint(laptop, 0.08);
  const screen = transformPoint(laptop, -0.29);
  assert.ok(distance(keyboard, host) < distance(screen, host), "keyboard must be nearer the host than the screen");
  const screenFront = [Math.sin(laptop.transform.rotation[1]), Math.cos(laptop.transform.rotation[1])];
  const towardHost = [host.position[0] - screen[0], host.position[2] - screen[1]];
  assert.ok(screenFront[0] * towardHost[0] + screenFront[1] * towardHost[1] > 0.5,
    "display must face the host at negative Z");
  assert.ok(Math.abs(laptop.transform.position[0] - host.position[0]) < 0.1);
  assert.ok(laptop.transform.position[1] >= 1.17);
  assert.ok(keyboard[1] >= -0.775 && screen[1] <= 0.775, "laptop must fit on the desktop");

  for (const [chairId, seat] of [["host-chair", host], ["cohost-chair", cohost], ["guest-chair", guest]]) {
    const chair = byId(chairId);
    assert.deepEqual([chair.transform.position[0], chair.transform.position[2]], [seat.position[0], seat.position[2]]);
  }
  assert.ok(host.position[2] + 0.39 < -0.775, "host chair must remain behind the desk edge");
  assert.ok(-0.775 - (host.position[2] + 0.39) < 0.3, "host can reach the desk");

  for (const [micId, seat] of [["microphone-left", host], ["microphone-right", cohost], ["microphone-guest", guest]]) {
    const capsule = transformPoint(byId(micId), -0.49);
    assert.ok(distance(capsule, seat) < 0.9, `${micId} must be within seated speaking distance`);
  }
  assert.ok(distance(transformPoint(byId("microphone-guest"), -0.49), guest) <
    distance(transformPoint(byId("microphone-right"), -0.49), guest));
  assert.ok(byId("guest-table"), "guest microphone has a dedicated support surface");
});

test("camera and future character anchors are finite and separated", () => {
  for (const camera of Object.values(STUDIO_01.cameraAnchors)) {
    assert.equal(productionCameraSchema.safeParse(camera).success, true);
  }
  assert.equal(new Set(STUDIO_01.characterAnchors.map((anchor) => anchor.id)).size, 3);
  for (const [index, anchor] of STUDIO_01.characterAnchors.entries()) {
    for (const other of STUDIO_01.characterAnchors.slice(index + 1)) {
      const distance = Math.hypot(anchor.position[0] - other.position[0], anchor.position[2] - other.position[2]);
      assert.ok(distance > anchor.clearanceRadius + other.clearanceRadius);
    }
  }
});

test("camera suggestions cover studio, two seats, individual seats and three seats in both formats", () => {
  const suggestions = Object.entries(STUDIO_01.cameraAnchorMetadata);
  const anchorById = new Map(STUDIO_01.characterAnchors.map((anchor) => [anchor.id, anchor]));
  for (const [id, metadata] of suggestions) {
    const camera = STUDIO_01.cameraAnchors[id];
    assert.ok(camera, `${id} needs a camera pose`);
    assert.ok(metadata.aspectRatios.length > 0);
    for (const subjectId of metadata.subjectAnchorIds) assert.ok(anchorById.has(subjectId));
    const expectedCount = { studio: 0, conversation: 2, "single-seat": 1, group: 3 }[metadata.framing];
    assert.equal(metadata.subjectAnchorIds.length, expectedCount);
    for (const ratio of metadata.aspectRatios) {
      const aspect = ratio === "16:9" ? 16 / 9 : 9 / 16;
      const distance = Math.hypot(camera.position[0] - camera.target[0], camera.position[2] - camera.target[2]);
      const halfWidth = distance * Math.tan(camera.fov * Math.PI / 360) * aspect;
      for (const subjectId of metadata.subjectAnchorIds) {
        const seat = anchorById.get(subjectId);
        assert.ok(Math.abs(seat.position[0] - camera.target[0]) + seat.clearanceRadius < halfWidth,
          `${id} must leave horizontal framing room for ${subjectId} at ${ratio}`);
      }
    }
  }
  for (const ratio of ["16:9", "9:16"]) {
    for (const framing of ["studio", "conversation", "single-seat", "group"]) {
      assert.ok(suggestions.some(([, metadata]) => metadata.framing === framing && metadata.aspectRatios.includes(ratio)),
        `${ratio} needs a ${framing} suggestion`);
    }
  }
  assert.throws(() => createEnvironmentRegistry([{ ...STUDIO_01, cameraAnchorMetadata: {
    ...STUDIO_01.cameraAnchorMetadata, conversation: { ...STUDIO_01.cameraAnchorMetadata.conversation,
      subjectAnchorIds: ["character:kamyar"] },
  } }]), /Invalid camera anchor metadata/);
});

test("left-seat close-up eye line clears the host-facing laptop display", () => {
  const laptop = STUDIO_01.defaultProps.find((prop) => prop.id === "studio-01:laptop");
  const camera = STUDIO_01.cameraAnchors["seat-left-close"];
  // Laptop display top is local base + hinge height + panel height; this is a coarse geometry guard.
  const displayTop = laptop.transform.position[1] + 0.11 + 0.44;
  const displayZ = laptop.transform.position[2] + 0.29;
  const progress = (camera.position[2] - displayZ) / (camera.position[2] - camera.target[2]);
  const sightlineY = camera.position[1] + (camera.target[1] - camera.position[1]) * progress;
  assert.ok(sightlineY > displayTop + 0.08, "the laptop must stay below the close-up face sightline");
});

test("registry rejects missing props and invalid transforms", () => {
  assert.throws(() => createEnvironmentRegistry([{ ...STUDIO_01, defaultProps: [
    { ...STUDIO_01.defaultProps[0], definitionId: "prop:missing" },
  ] }]), /Unknown prop definition/);
  assert.throws(() => createEnvironmentRegistry([{ ...STUDIO_01, defaultProps: [
    { ...STUDIO_01.defaultProps[0], transform: { ...STUDIO_01.defaultProps[0].transform, scale: [0, 1, 1] } },
  ] }]), /Invalid prop transform/);
});
