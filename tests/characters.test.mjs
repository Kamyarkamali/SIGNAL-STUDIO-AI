import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createCharacterRegistry, characterModelDefinitionSchema, characterModelRegistry, normalizeCharacterCustomization } from "../src/lib/characters/character-registry.ts";
import { addCharacterInstance, assignCharacterPlacement, assignCharacterSeat, CharacterSeatAssignmentError, CharacterIdentityDeletionError, clampCharacterScale, createCharacterIdentity, emptyCharacterData, previewCharacterModelChange, removeCharacterIdentity, removeCharacterInstance, renameCharacter, replaceCharacterModel, resetCharacterCustomization, resetCharacterPlacement, resolveCharacterPlacementTransform, resolveCharacterSeatTransform, updateCharacterCustomization, updateCharacterState } from "../src/lib/characters/character-operations.ts";
import { chatGptExpressionNames, chatGptExpressionPresets, resolveChatGptExpression } from "../src/lib/characters/chatgpt-expression-presets.ts";
import { characterProjectDataSchema } from "../src/lib/characters/character-schema.ts";
import { STUDIO_01 } from "../src/lib/environments/studio-01.ts";
import { migrateProject, newProject, projectSchema } from "../src/lib/projects/project-schema.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";
import { createKamyarBeardDetailGeometry, createKamyarBeardGeometry, createKamyarHairGeometry, createKamyarHeadGeometry } from "../src/components/characters/kamyar-geometry.ts";
import { createHamidHeadGeometry, createHamidTorsoGeometry, geometryPositionSignature } from "../src/components/characters/hamid-geometry.ts";

test("character registry validates stable models, renderer keys, capabilities, forward and transforms", () => {
  const model = characterModelRegistry.list()[0];
  assert.equal(characterModelDefinitionSchema.safeParse(model).success, true);
  assert.throws(() => createCharacterRegistry([model, model], new Set([model.rendererKey])), /Duplicate/);
  assert.throws(() => createCharacterRegistry([model], new Set()), /Unsupported/);
  assert.equal(model.forwardAxis, "+Z");
  assert.ok(Array.isArray(model.seatPositionOffset));
  assert.ok(Number.isFinite(model.seatYawOffsetRadians));
  assert.equal("preferredAnchorRoles" in model, false, "seat selection must not be model-specific");
  assert.deepEqual(model.capabilities.animationCapabilities, ["head-rotation", "arm-gesture", "facial-expression"]);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...model, defaultTransform: { ...model.defaultTransform, scale: [0, 1, 1] } }).success, false);
});

test("gizmo scale commits stay within valid positive bounds", () => {
  assert.deepEqual(clampCharacterScale([0, -3, 40]), [0.05, 0.05, 20]);
  assert.deepEqual(clampCharacterScale([Number.NaN, Number.POSITIVE_INFINITY, 1]), [1, 1, 1]);
});

test("new instances stay unassigned and explicit seating aligns per-model offsets and orientation", () => {
  const modelIds = ["character-model:kamyar", "character-model:chatgpt-robot", "character-model:claude-mascot"];
  let data = emptyCharacterData();
  for (let index = 0; index < modelIds.length; index += 1) {
    const identityId = randomUUID();
    const instanceId = randomUUID();
    data = createCharacterIdentity(data, identityId, `Seat ${index}`, modelIds[index]);
    data = addCharacterInstance(data, identityId, instanceId);
    const model = characterModelRegistry.get(modelIds[index]);
    const unassigned = data.characterStates[instanceId];
    assert.equal(unassigned.placementAnchorId, undefined);
    assert.deepEqual(unassigned.transform, unassigned.initialTransform);
    const anchor = STUDIO_01.characterAnchors[index];
    data = assignCharacterSeat(data, instanceId, anchor.id, STUDIO_01.characterAnchors);
    const state = data.characterStates[instanceId];
    assert.equal(state.placementAnchorId, anchor.id);
    assert.ok(Math.abs(state.transform.position[1] + model.seatContactY * state.transform.scale[1]
      - (anchor.position[1] + anchor.seatSurfaceOffsetY)) < 1e-9);
    assert.equal(state.transform.rotation[1], anchor.facingRadians + model.seatYawOffsetRadians);
    assert.deepEqual(state.initialTransform, state.transform);
    const manuallyMovedY = state.transform.position[1] + 0.23;
    data = updateCharacterState(data, instanceId, { transform: { ...state.transform, position: [state.transform.position[0], manuallyMovedY, state.transform.position[2]] } });
    assert.equal(data.characterStates[instanceId].transform.position[1], manuallyMovedY);
    assert.equal(data.characterStates[instanceId].initialTransform.position[1], state.initialTransform.position[1]);
    assert.equal(assignCharacterSeat(data, instanceId, anchor.id, STUDIO_01.characterAnchors).characterStates[instanceId].transform.position[1], manuallyMovedY,
      "reselecting an assigned seat must not reposition a manually edited character");
  }
  const futureModel = { seatContactY: -0.2, seatPositionOffset: [0.1, 0, 0.25], seatYawOffsetRadians: 0.4 };
  const futureSeat = { id: "future-seat", role: "guest", position: [1, 0.1, 2], facingRadians: 0.2, seatSurfaceOffsetY: 0.67 };
  const futureTransform = resolveCharacterSeatTransform(futureModel, futureSeat, [2, 1.5, 0.5]);
  assert.ok(Math.abs(futureTransform.position[1] - 1.07) < 1e-9);
  assert.ok(Math.abs(futureTransform.rotation[1] - 0.6) < 1e-9);
  assert.notDeepEqual(futureTransform.position, futureSeat.position);
  assert.ok(Math.abs(futureTransform.position[0] - (1 + 0.2 * Math.cos(0.6) + 0.125 * Math.sin(0.6))) < 1e-9);
  assert.ok(Math.abs(futureTransform.position[2] - (2 - 0.2 * Math.sin(0.6) + 0.125 * Math.cos(0.6))) < 1e-9);
});

test("seat assignment prevents occupancy conflicts and unassignment preserves manual transforms", () => {
  const anchors = STUDIO_01.characterAnchors;
  let data = emptyCharacterData();
  const identities = [randomUUID(), randomUUID()];
  const instances = [randomUUID(), randomUUID()];
  for (const [index, identityId] of identities.entries()) {
    data = createCharacterIdentity(data, identityId, `Actor ${index}`, "character-model:kamyar");
    data = addCharacterInstance(data, identityId, instances[index]);
  }
  data = assignCharacterSeat(data, instances[0], anchors[0].id, anchors);
  assert.throws(() => assignCharacterSeat(data, instances[1], anchors[0].id, anchors),
    (error) => error instanceof CharacterSeatAssignmentError && error.code === "OCCUPIED");
  const editedTransform = { ...data.characterStates[instances[0]].transform, position: [3.2, 2.1, -1], rotation: [0.1, 1.7, 0.2], scale: [1.2, 0.9, 1.1] };
  data = updateCharacterState(data, instances[0], { transform: editedTransform });
  const movedToAnotherSeat = assignCharacterSeat(data, instances[0], anchors[1].id, anchors);
  assert.deepEqual(movedToAnotherSeat.characterStates[instances[0]].transform.scale, editedTransform.scale,
    "seat reassignment must retain the user's current model scale");
  assert.equal(movedToAnotherSeat.characterStates[instances[0]].placementAnchorId, anchors[1].id);
  const unassigned = assignCharacterSeat(data, instances[0], null, anchors);
  assert.equal(unassigned.characterStates[instances[0]].placementAnchorId, undefined);
  assert.deepEqual(unassigned.characterStates[instances[0]].transform, editedTransform);
  assert.deepEqual(unassigned.characterStates[instances[0]].initialTransform, editedTransform);
  assert.deepEqual(unassigned.characterStates[instances[1]].transform, data.characterStates[instances[1]].transform);
  assert.throws(() => assignCharacterSeat(unassigned, instances[0], "studio-01:removed-seat", anchors),
    (error) => error instanceof CharacterSeatAssignmentError && error.code === "UNAVAILABLE");
  const unavailableStoredSeat = updateCharacterState(data, instances[0], { placementAnchorId: "studio-01:removed-seat" });
  assert.equal(characterProjectDataSchema.safeParse(unavailableStoredSeat).success, true,
    "unknown seat IDs remain loadable so the UI can offer a safe unassign action");
  const safeFallback = assignCharacterSeat(unavailableStoredSeat, instances[0], null, []);
  assert.deepEqual(safeFallback.characterStates[instances[0]].transform, unavailableStoredSeat.characterStates[instances[0]].transform);
});

test("tabletop and platform placement aligns model support points and rejects invalid surfaces or scale", () => {
  const robot = characterModelRegistry.get("character-model:chatgpt-robot");
  const tabletop = STUDIO_01.characterAnchors.find((anchor) => anchor.kind === "tabletop");
  const platform = STUDIO_01.characterAnchors.find((anchor) => anchor.kind === "platform");
  assert.ok(robot && tabletop && platform);
  const transform = resolveCharacterPlacementTransform(robot, tabletop, robot.defaultTransform.scale);
  assert.ok(Math.abs(transform.position[1] + robot.placementContactY * robot.defaultTransform.scale[1] - tabletop.surfaceOffsetY) < 1e-9);
  assert.equal(transform.rotation[1], tabletop.facingRadians + robot.placementYawOffsetRadians);
  assert.throws(() => resolveCharacterPlacementTransform(characterModelRegistry.get("character-model:kamyar"), tabletop, [0.72, 0.72, 0.72]),
    (error) => error instanceof CharacterSeatAssignmentError && error.code === "UNSUPPORTED");
  assert.throws(() => resolveCharacterPlacementTransform(robot, tabletop, [0.7, 0.7, 0.7]),
    (error) => error instanceof CharacterSeatAssignmentError && error.code === "TOO_LARGE");
  const platformTransform = resolveCharacterPlacementTransform(characterModelRegistry.get("character-model:kamyar"), platform, [0.72, 0.72, 0.72]);
  assert.ok(Math.abs(platformTransform.position[1] + 0.035 * 0.72 - platform.surfaceOffsetY) < 1e-9);

  const identityIds = [randomUUID(), randomUUID()]; const instanceIds = [randomUUID(), randomUUID()];
  let data = emptyCharacterData();
  for (let index = 0; index < identityIds.length; index += 1) {
    data = createCharacterIdentity(data, identityIds[index], `Table actor ${index}`, "character-model:chatgpt-robot");
    data = addCharacterInstance(data, identityIds[index], instanceIds[index]);
  }
  const freeActor = data.characterStates[instanceIds[1]];
  data = updateCharacterState(data, instanceIds[1], { transform: { ...freeActor.transform,
    position: [tabletop.position[0], tabletop.surfaceOffsetY, tabletop.position[2]] } });
  assert.throws(() => assignCharacterPlacement(data, instanceIds[0], tabletop.id, STUDIO_01.characterAnchors),
    (error) => error instanceof CharacterSeatAssignmentError && error.code === "OCCUPIED");
  assert.equal(data.characterStates[instanceIds[0]].placementAnchorId, undefined, "a rejected placement does not mutate the project data");
  const placed = assignCharacterPlacement(data, instanceIds[0], platform.id, STUDIO_01.characterAnchors);
  assert.equal(placed.characterStates[instanceIds[0]].placementAnchorId, platform.id);
  const reopenedCompatible = characterProjectDataSchema.parse(placed);
  assert.equal(reopenedCompatible.characterStates[instanceIds[0]].placementAnchorId, platform.id);
});

test("ChatGPT static expression presets coordinate distinct eyes, brows and real mouth shapes", () => {
  assert.deepEqual(chatGptExpressionNames, ["neutral", "happy", "sad", "angry", "surprised", "worried", "confused", "thinking", "listening", "speaking", "excited", "laughing"]);
  assert.equal(new Set(Object.values(chatGptExpressionPresets).map((preset) => preset.mouth)).size, 7);
  assert.ok(new Set(Object.values(chatGptExpressionPresets).map((preset) => preset.eyeScaleY)).size > 5);
  assert.ok(new Set(Object.values(chatGptExpressionPresets).map((preset) => preset.browAngle.join(","))).size > 4);
  for (const expression of chatGptExpressionNames) {
    const preset = chatGptExpressionPresets[expression];
    assert.ok(preset.mouthScale[0] > 0 && preset.mouthScale[1] > 0, `${expression} must select a visible mouth shape`);
    assert.ok(["line", "smile", "frown", "open", "small-open", "laughing-open", "tilted-line"].includes(preset.mouth));
  }
  assert.equal(resolveChatGptExpression("friendly"), "happy");
  assert.equal(resolveChatGptExpression("focused"), "thinking");
  assert.equal(resolveChatGptExpression("curious"), "confused");
  assert.equal(resolveChatGptExpression("legacy-unknown"), "happy");
  let data = emptyCharacterData();
  const identityId = randomUUID();
  data = createCharacterIdentity(data, identityId, "Expression compatibility", "character-model:chatgpt-robot");
  data = { ...data, characterIdentities: { ...data.characterIdentities, [identityId]: {
    ...data.characterIdentities[identityId], customization: { ...data.characterIdentities[identityId].customization, faceStyle: "friendly" },
  } } };
  data = updateCharacterCustomization(data, identityId, { ...data.characterIdentities[identityId].customization, accentColor: "#008899" });
  assert.equal(data.characterIdentities[identityId].customization.faceStyle, "happy",
    "editing other appearance fields safely normalizes legacy values without losing their meaning");
});

test("tabletop anchor and static expression survive project save and reopen", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-placement-persistence-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Tabletop character placement");
    const identityId = randomUUID(); const instanceId = randomUUID();
    let data = createCharacterIdentity(emptyCharacterData(), identityId, "ChatGPT tabletop", "character-model:chatgpt-robot");
    data = addCharacterInstance(data, identityId, instanceId);
    data = updateCharacterCustomization(data, identityId, { faceStyle: "speaking" });
    const tabletopId = "studio-01:desk-top-left";
    data = assignCharacterPlacement(data, instanceId, tabletopId, STUDIO_01.characterAnchors);
    await service.save(project.id, project.title, project.revision, undefined, undefined,
      data.characterIdentities, data.characterInstances, data.characterStates);
    const opened = await service.open(project.id);
    assert.equal(opened.characterStates[instanceId].placementAnchorId, tabletopId);
    assert.deepEqual(opened.characterStates[instanceId].transform, data.characterStates[instanceId].transform);
    assert.equal(opened.characterIdentities[identityId].customization.faceStyle, "speaking");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("production model definitions and capability-backed appearances are distinct and independent", () => {
  const models = characterModelRegistry.list();
  assert.equal(models.length, 4);
  assert.equal(new Set(models.map((model) => model.id)).size, 4);
  assert.equal(new Set(models.map((model) => model.rendererKey)).size, 4);
  assert.deepEqual(models.map((model) => model.capabilities.animationCapabilities), [
    ["head-rotation", "arm-gesture", "facial-expression"], ["head-rotation", "arm-gesture", "facial-expression", "eyes"], ["head-rotation", "facial-expression"], ["head-rotation", "arm-gesture", "facial-expression"],
  ]);
  let data = emptyCharacterData();
  const firstId = randomUUID(); const secondId = randomUUID();
  data = createCharacterIdentity(data, firstId, "Kamyar One", "character-model:kamyar");
  data = createCharacterIdentity(data, secondId, "Kamyar Two", "character-model:kamyar");
  data = updateCharacterCustomization(data, firstId, { hairColor: "#123456", beardStyle: "stubble" });
  assert.equal(data.characterIdentities[firstId].customization.hairColor, "#123456");
  assert.notEqual(data.characterIdentities[firstId].customization.hairColor, data.characterIdentities[secondId].customization.hairColor);
  assert.throws(() => updateCharacterCustomization(data, firstId, { hairColor: "not-a-color" }));
  assert.throws(() => updateCharacterCustomization(data, firstId, { faceStyle: "friendly" }));
  assert.equal(resetCharacterCustomization(data, firstId).characterIdentities[firstId].customization.hairColor,
    characterModelRegistry.get("character-model:kamyar").customizationFields.find((field) => field.key === "hairColor").defaultValue);
});

test("Hamid is an independent registered human with a shaped torso and persistent identity customization", async () => {
  const model = characterModelRegistry.get("character-model:hamid");
  assert.ok(model);
  assert.equal(model.modelType, "human");
  assert.equal(model.rendererKey, "hamid-stylized");
  assert.equal(model.forwardAxis, "+Z");
  assert.deepEqual(model.defaultTransform.scale, [0.72, 0.72, 0.72]);
  assert.ok(model.placementKinds.includes("seat"));
  assert.deepEqual(model.capabilities.animationCapabilities, ["head-rotation", "arm-gesture", "facial-expression"], "declared channels are wired to functional local face controls");
  assert.equal(model.customizationFields.find((field) => field.key === "hairStyle").defaultValue, "short-fade");
  assert.equal(model.customizationFields.find((field) => field.key === "beardStyle").defaultValue, "light-stubble");
  assert.equal(model.customizationFields.find((field) => field.key === "clothingColor").defaultValue, "#111315");
  assert.equal(model.customizationFields.find((field) => field.key === "bellyFullness").defaultValue, "fuller");

  const head = createHamidHeadGeometry();
  const natural = createHamidTorsoGeometry(0.15);
  const full = createHamidTorsoGeometry(1);
  assert.notEqual(geometryPositionSignature(head), geometryPositionSignature(createKamyarHeadGeometry()),
    "Hamid has independently shaped head geometry");
  assert.notEqual(geometryPositionSignature(natural), geometryPositionSignature(full),
    "body profile customization changes the connected torso geometry");
  head.dispose(); natural.dispose(); full.dispose();

  const root = await mkdtemp(join(tmpdir(), "signal-studio-hamid-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Hamid prototype persistence");
    let data = emptyCharacterData();
    const identityId = randomUUID(); const otherIdentityId = randomUUID();
    const instanceIds = [randomUUID(), randomUUID()]; const otherInstanceId = randomUUID();
    data = createCharacterIdentity(data, identityId, "Hamid Guest", model.id);
    data = createCharacterIdentity(data, otherIdentityId, "Another Hamid", model.id);
    for (const id of instanceIds) data = addCharacterInstance(data, identityId, id);
    data = addCharacterInstance(data, otherIdentityId, otherInstanceId);
    data = updateCharacterCustomization(data, identityId, {
      hairStyle: "side-part", beardStyle: "light-stubble", clothingColor: "#202326", bellyFullness: "full",
    });
    data = assignCharacterSeat(data, instanceIds[0], "studio-01:guest-seat", STUDIO_01.characterAnchors);
    data = updateCharacterState(data, instanceIds[0], { transform: {
      ...data.characterStates[instanceIds[0]].transform,
      position: [2.2, 1.35, 0.8], rotation: [0.1, -1.1, 0], scale: [0.8, 0.78, 0.82],
    } });
    assert.equal(data.characterIdentities[otherIdentityId].customization.bellyFullness, "fuller");
    const saved = await service.save(project.id, project.title, project.revision, undefined, undefined,
      data.characterIdentities, data.characterInstances, data.characterStates);
    const reopened = await service.open(project.id);
    assert.equal(reopened.characterIdentities[identityId].modelId, model.id);
    assert.equal(reopened.characterIdentities[identityId].customization.bellyFullness, "full");
    assert.equal(reopened.characterIdentities[otherIdentityId].customization.bellyFullness, "fuller");
    assert.deepEqual(reopened.characterStates[instanceIds[0]].transform, data.characterStates[instanceIds[0]].transform);
    assert.equal(reopened.characterStates[instanceIds[0]].placementAnchorId, "studio-01:guest-seat");
    const copy = await service.duplicate(project.id);
    assert.equal(copy.characterIdentities[identityId].customization.bellyFullness, "full");
    assert.equal(copy.characterInstances[instanceIds[1]].characterId, identityId);
    assert.equal(saved.schemaVersion, 5, "adding a built-in model does not require a persistence migration");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Kamyar uses a distinct stylized head, attached hair and beard shells, and supported glasses", async () => {
  const kamyar = characterModelRegistry.get("character-model:kamyar");
  assert.ok(kamyar);
  assert.equal(kamyar.rendererKey, "kamyar-stylized");
  assert.equal(kamyar.forwardAxis, "+Z");
  assert.ok(kamyar.placementKinds.includes("seat"));
  assert.deepEqual(kamyar.customizationFields.map((field) => field.key), [
    "hairColor", "hairStyle", "skinTone", "eyeColor", "beardColor", "beardStyle", "beardVisibility", "clothingColor", "accessory",
  ]);
  const hairStyles = kamyar.customizationFields.find((field) => field.key === "hairStyle");
  assert.deepEqual(hairStyles.options.map((option) => option.value), ["modern-textured-quiff", "side-part", "curly-short", "medium-wavy", "slicked-back", "short-fade", "crew-cut", "buzz-cut", "bald"]);
  assert.equal(hairStyles.defaultValue, "side-part", "default follows Kamyar's neat short, swept hairstyle in the original photos");
  const beardStyleField = kamyar.customizationFields.find((field) => field.key === "beardStyle");
  assert.deepEqual(beardStyleField.options.map((option) => option.value), ["clean-shaven", "light-stubble", "medium-stubble", "short-boxed-beard", "full-trimmed-beard", "goatee", "mustache", "mustache-light-stubble"]);
  assert.equal(beardStyleField.defaultValue, "short-boxed-beard", "default follows the close, neatly trimmed facial hair in the original photos");
  const accessory = kamyar.customizationFields.find((field) => field.key === "accessory");
  assert.deepEqual(accessory.options.map((option) => option.value), ["none", "glasses"]);
  assert.ok(kamyar.attachmentPoints.includes("head-pivot"));
  assert.ok(kamyar.attachmentPoints.includes("facial-hair-pivot"));
  assert.ok(kamyar.attachmentPoints.includes("left-hand-pivot"));
  assert.deepEqual(kamyar.capabilities.animationCapabilities, ["head-rotation", "arm-gesture", "facial-expression"], "preview channels are declared only after the face controls are wired");

  const head = createKamyarHeadGeometry();
  const hair = createKamyarHairGeometry("parted");
  const beard = createKamyarBeardGeometry("short");
  const stubble = createKamyarBeardGeometry("stubble");
  const hairstyles = ["modern-textured-quiff", "side-part", "curly-short", "medium-wavy", "slicked-back", "short-fade", "crew-cut", "buzz-cut"].map((style) => createKamyarHairGeometry(style));
  assert.equal(createKamyarHairGeometry("bald"), null, "bald preset removes the scalp shell");
  assert.equal(new Set(hairstyles.map(({ cap }) => Array.from(cap.getAttribute("position").array).join(","))).size, hairstyles.length,
    "each hairstyle changes cap silhouette geometry");
  assert.deepEqual(hairstyles.map(({ locks }) => locks.length), [9, 7, 11, 8, 7, 6, 5, 0], "each style has a distinct low-cost sculpted-clump profile");
  assert.ok(hairstyles[0].locks.length > hairstyles[6].locks.length, "textured quiff has more swept clumps than crew cut");
  assert.ok(hairstyles[2].locks.length > hairstyles[1].locks.length, "curly hair uses a denser clump layout than side part");
  for (const hairstyle of hairstyles) {
    const position = hairstyle.cap.getAttribute("position");
    const columns = 56; const row = 24; const stride = columns + 1;
    let maximumHairlineStep = 0;
    for (let column = 0; column < columns; column += 1) {
      const a = row * stride + column; const b = a + 1;
      maximumHairlineStep = Math.max(maximumHairlineStep, Math.hypot(
        position.getX(a) - position.getX(b), position.getY(a) - position.getY(b), position.getZ(a) - position.getZ(b),
      ));
    }
    assert.ok(maximumHairlineStep < 0.06, "hairline profile transitions continuously around front, sides and back");
  }
  hairstyles[1].cap.computeBoundingBox();
  const sidePartBounds = hairstyles[1].cap.boundingBox;
  const longerGeometry = createKamyarHairGeometry("medium-wavy").cap;
  longerGeometry.computeBoundingBox();
  const longerBounds = longerGeometry.boundingBox;
  assert.ok(sidePartBounds.min.y > longerBounds.min.y, "reference side-part has a tighter temple/rear hairline than medium waves");
  const beardStyles = ["light-stubble", "medium-stubble", "short-boxed-beard", "full-trimmed-beard", "goatee", "mustache-light-stubble"].map((style) => createKamyarBeardGeometry(style));
  assert.equal(createKamyarBeardGeometry("clean-shaven"), null, "clean shaven removes jaw hair");
  assert.equal(createKamyarBeardGeometry("mustache"), null, "mustache-only has no cheek or jaw shell");
  assert.equal(new Set(beardStyles.map((geometry) => Array.from(geometry.getAttribute("position").array).join(","))).size, beardStyles.length,
    "each beard preset changes cheek and jaw coverage");
  const beardDetails = ["light-stubble", "medium-stubble", "short-boxed-beard", "full-trimmed-beard", "goatee", "mustache-light-stubble"].map((style) => createKamyarBeardDetailGeometry(style));
  assert.ok(beardDetails.every(Boolean), "jaw-hair styles include surface-following detail strokes");
  assert.equal(createKamyarBeardDetailGeometry("clean-shaven"), null, "clean shaven removes facial-hair detail geometry");
  assert.equal(createKamyarBeardDetailGeometry("mustache"), null, "mustache-only removes cheek detail geometry");
  head.computeBoundingBox(); hair.cap.computeBoundingBox(); beard.computeBoundingBox(); stubble.computeBoundingBox();
  assert.ok(head.boundingBox.min.y < -0.27 && head.boundingBox.max.y > 0.27);
  assert.ok(hair.cap.boundingBox.max.y > head.boundingBox.max.y, "hair base extends above the skull");
  assert.ok(hair.locks.some((lock) => { lock.computeBoundingBox(); return lock.boundingBox.max.y > hair.cap.boundingBox.max.y + 0.02; }), "raised lock geometry adds visible crown volume");
  assert.ok(beard.boundingBox.min.y < -0.2 && beard.boundingBox.max.y < 0.1);
  assert.ok(stubble.boundingBox.max.y < beard.boundingBox.max.y, "stubble variant has a visibly shorter jaw region");
  assert.ok(hair.cap.getAttribute("position").count > 500, "the fitted hair base has sufficient surface detail");
  for (const geometry of [head, hair.cap, ...hair.locks, beard, stubble, ...hairstyles.flatMap(({ cap, locks }) => [cap, ...locks]), longerGeometry, ...beardStyles, ...beardDetails]) {
    const positions = geometry.getAttribute("position");
    assert.ok(positions.count > 100, "each visible geometry layer has enough vertices to form a smooth surface");
    for (let index = 0; index < positions.count; index += 1) {
      assert.ok(Number.isFinite(positions.getX(index)) && Number.isFinite(positions.getY(index)) && Number.isFinite(positions.getZ(index)));
    }
    geometry.dispose();
  }

  const renderer = await readFile(new URL("../src/components/characters/character-renderers.tsx", import.meta.url), "utf8");
  const kamyarRenderer = renderer.slice(renderer.indexOf("function Kamyar("), renderer.indexOf("function ChatGPT("));
  assert.match(kamyarRenderer, /name="sculpted-head"/);
  assert.match(kamyarRenderer, /name="scalp-following-hair-base"/);
  assert.match(kamyarRenderer, /raised-swept-hair-lock/);
  assert.match(kamyarRenderer, /name="beard-following-jaw"/);
  assert.match(kamyarRenderer, /appearance\.accessory \?\? "none"/);
  assert.match(kamyarRenderer, /name="glasses-accessory"/);
  assert.match(kamyarRenderer, /appearance\.hairColor/);
  assert.match(kamyarRenderer, /appearance\.skinTone/);
  assert.match(kamyarRenderer, /appearance\.eyeColor/);
  assert.match(kamyarRenderer, /appearance\.beardColor/);
  assert.match(kamyarRenderer, /beardVisibility/);
  assert.match(kamyarRenderer, /beardStyle === "clean-shaven"/);
  assert.match(kamyarRenderer, /hairStyle === "bald" \? null/);
  assert.match(kamyarRenderer, /appearance\.clothingColor/);
});

test("Kamyar legacy preset identifiers migrate safely and new hairstyle/beard settings remain identity-local", () => {
  let data = emptyCharacterData();
  const firstId = randomUUID();
  const secondId = randomUUID();
  data = createCharacterIdentity(data, firstId, "Kamyar One", "character-model:kamyar");
  data = createCharacterIdentity(data, secondId, "Kamyar Two", "character-model:kamyar");
  data = updateCharacterCustomization(data, firstId, {
    hairStyle: "curly-short", beardStyle: "goatee", beardVisibility: "hidden", hairColor: "#352727",
  });
  assert.deepEqual(data.characterIdentities[firstId].customization, {
    ...data.characterIdentities[firstId].customization,
    hairStyle: "curly-short", beardStyle: "goatee", beardVisibility: "hidden", hairColor: "#352727",
  });
  assert.equal(data.characterIdentities[secondId].customization.hairStyle, "side-part");
  assert.equal(data.characterIdentities[secondId].customization.beardVisibility, "visible");
  assert.equal(updateCharacterCustomization(data, firstId, { hairStyle: "mohawk" }).characterIdentities[firstId].customization.hairStyle,
    "side-part", "unsupported persisted hair presets fall back to the reference-inspired default");
  assert.equal(updateCharacterCustomization(data, firstId, { beardStyle: "long-beard" }).characterIdentities[firstId].customization.beardStyle,
    "short-boxed-beard", "unsupported beard presets fall back safely");
  const legacy = normalizeCharacterCustomization("character-model:kamyar", { hairStyle: "parted", beardStyle: "short" });
  assert.equal(legacy.hairStyle, "side-part");
  assert.equal(legacy.beardStyle, "short-boxed-beard");
  const oldSavedPresets = normalizeCharacterCustomization("character-model:kamyar", { hairStyle: "longer-styled", beardStyle: "trimmed-full-beard" });
  assert.equal(oldSavedPresets.hairStyle, "slicked-back");
  assert.equal(oldSavedPresets.beardStyle, "full-trimmed-beard");
  const persistedLegacy = structuredClone(data);
  persistedLegacy.characterIdentities[firstId].customization = { hairStyle: "textured-quiff", beardStyle: "full-short" };
  assert.equal(characterProjectDataSchema.safeParse(persistedLegacy).success, true,
    "previously saved preset identifiers remain schema-compatible");
  assert.equal(legacy.beardVisibility, "visible");
});

test("Claude keeps its saved model identity while defining the reference cube, independent face parts, and supported headphone options", async () => {
  const claude = characterModelRegistry.get("character-model:claude-mascot");
  assert.ok(claude);
  assert.equal(claude.rendererKey, "claude-terracotta-mascot");
  assert.deepEqual(claude.defaultTransform.scale, [0.58, 0.58, 0.58]);
  assert.deepEqual(claude.customizationFields.map((field) => field.key), ["furColor", "chestColor", "eyeColor", "earStyle"]);
  assert.equal(claude.customizationFields[0].defaultValue, "#f47920");
  assert.ok(claude.attachmentPoints.includes("headphones"));
  assert.ok(claude.attachmentPoints.includes("left-eye"));
  assert.ok(claude.attachmentPoints.includes("right-eye"));
  assert.ok(claude.attachmentPoints.includes("mouth"));
  assert.ok(!claude.attachmentPoints.some((point) => point.includes("tail") || point.includes("ear")));

  const renderer = await readFile(new URL("../src/components/characters/character-renderers.tsx", import.meta.url), "utf8");
  const claudeRenderer = renderer.slice(renderer.indexOf("function Claude("), renderer.indexOf("export function CharacterModelRenderer"));
  assert.match(claudeRenderer, /claude-cube-forward-positive-z/);
  assert.match(claudeRenderer, /name="cube-head-body"/);
  assert.match(claudeRenderer, /name=\{side < 0 \? "left-eye" : "right-eye"\}/);
  assert.match(claudeRenderer, /name="mouth"/);
  assert.match(claudeRenderer, /name="headphones"/);
  assert.match(claudeRenderer, /lower-limb-\$\{index \+ 1\}/);
  assert.doesNotMatch(claudeRenderer, /<Ball|<Tube|<Spike|tail|earStyle === "pointed"/);
});

test("ChatGPT keeps its stable model contract and renders an expressive face with a sourced chest mark", async () => {
  const chatgpt = characterModelRegistry.get("character-model:chatgpt-robot");
  assert.ok(chatgpt);
  assert.equal(chatgpt.rendererKey, "chatgpt-robot");
  assert.ok(chatgpt.capabilities.animationCapabilities.includes("facial-expression"));
  assert.deepEqual(chatgpt.defaultTransform.scale, [0.48, 0.48, 0.48]);
  assert.deepEqual(chatgpt.customizationFields.map((field) => field.key), ["bodyColor", "accentColor", "eyeColor", "faceStyle", "accessory"]);
  assert.equal(chatgpt.customizationFields.find((field) => field.key === "faceStyle").defaultValue, "happy");
  assert.ok(chatgpt.attachmentPoints.includes("head-pivot"));
  assert.ok(chatgpt.attachmentPoints.includes("left-eye"));
  assert.ok(chatgpt.attachmentPoints.includes("right-eye"));
  assert.ok(chatgpt.attachmentPoints.includes("mouth-display"));

  const renderer = await readFile(new URL("../src/components/characters/character-renderers.tsx", import.meta.url), "utf8");
  const chatgptRenderer = renderer.slice(renderer.indexOf("function ChatGPT("), renderer.indexOf("function Claude("));
  assert.match(chatgptRenderer, /chatGPTHeadShell/);
  assert.match(chatgptRenderer, /polished-dark-face-screen/);
  assert.match(chatgptRenderer, /name=\{side < 0 \? "left-eye" : "right-eye"\}/);
  assert.match(chatgptRenderer, /name="eyebrow"/);
  assert.match(chatgptRenderer, /name="eye-shape"/);
  assert.match(chatgptRenderer, /name="mouth-display"/);
  assert.match(renderer, /name="mouth-smile"/);
  assert.match(renderer, /name="mouth-frown"/);
  assert.match(chatgptRenderer, /resolveChatGptExpression\(appearance\.faceStyle\)/);
  assert.match(chatgptRenderer, /chatGptExpressionPresets\[face\]/);
  assert.match(chatgptRenderer, /<ExpressionMouth expression=\{face\}/);
  assert.match(chatgptRenderer, /name="iris"/);
  assert.match(chatgptRenderer, /name="openai-chest-logo"/);
  assert.match(renderer, /const chatGPTLogoPlane = new PlaneGeometry\(0\.22, 0\.22\)/);
  assert.match(renderer, /const chatGPTSmile = new ShapeGeometry\(smileShape, 20\)/);
  assert.match(chatgptRenderer, /position=\{\[0, 0\.55, 0\.235\]\}/);
  assert.match(chatgptRenderer, /useTexture\("\/characters\/openai-mark\.svg"\)/);
  assert.match(chatgptRenderer, /name=\{side < 0 \? "left-arm-pivot" : "right-arm-pivot"\}/);

  const mark = await readFile(new URL("../public/characters/openai-mark.svg", import.meta.url), "utf8");
  assert.match(mark, /OpenAI mark/);
  assert.match(mark, /github\.com\/simple-icons\/simple-icons/);
  assert.match(mark, /<path fill="#18252e" d="M22\.2819/);
});

test("identity deletion is independent from built-in models and refuses identities still used in the scene", () => {
  const modelIdsBefore = characterModelRegistry.list().map((model) => model.id);
  const identityId = randomUUID(); const otherIdentityId = randomUUID(); const instanceId = randomUUID();
  let data = emptyCharacterData();
  data = createCharacterIdentity(data, identityId, "Delete me", "character-model:kamyar");
  data = createCharacterIdentity(data, otherIdentityId, "Keep me", "character-model:kamyar");
  data = addCharacterInstance(data, otherIdentityId, instanceId);
  const deleted = removeCharacterIdentity(data, identityId);
  assert.equal(deleted.characterIdentities[identityId], undefined);
  assert.ok(deleted.characterIdentities[otherIdentityId]);
  assert.ok(deleted.characterInstances[instanceId]);
  assert.deepEqual(characterModelRegistry.list().map((model) => model.id), modelIdsBefore);
  assert.throws(() => removeCharacterIdentity(data, otherIdentityId), (error) => error instanceof CharacterIdentityDeletionError && error.code === "IN_USE");
  assert.ok(data.characterInstances[instanceId]);
  assert.throws(() => removeCharacterIdentity(deleted, identityId), (error) => error instanceof CharacterIdentityDeletionError && error.code === "NOT_FOUND");
});

test("identity definitions stay separate while multiple instances and state remain independent", () => {
  let data = emptyCharacterData();
  const identityId = randomUUID();
  const modelId = characterModelRegistry.list()[0].id;
  data = createCharacterIdentity(data, identityId, "نمونهٔ فنی", modelId);
  const anchors = [
    { id: "host", role: "host", position: [-1, 0, -1], facingRadians: 0 },
    { id: "cohost", role: "co-host", position: [1, 0, -1], facingRadians: Math.PI },
  ];
  const firstId = randomUUID();
  const secondId = randomUUID();
  const otherIdentityId = randomUUID();
  data = createCharacterIdentity(data, otherIdentityId, "Independent", modelId);
  data = addCharacterInstance(data, identityId, firstId);
  data = addCharacterInstance(data, identityId, secondId);
  data = assignCharacterSeat(data, firstId, anchors[0].id, anchors.map((anchor) => ({ ...anchor, seatSurfaceOffsetY: 0.67 })));
  assert.notEqual(firstId, secondId);
  assert.equal(data.characterInstances[firstId].characterId, identityId);
  assert.equal(data.characterStates[firstId].placementAnchorId, "host");
  assert.equal(data.characterStates[secondId].placementAnchorId, undefined);
  assert.deepEqual(data.characterStates[secondId].transform.position, [-2.25, 0, 2.35]);
  const renamed = renameCharacter(data, identityId, "Renamed identity");
  assert.equal(renamed.characterIdentities[identityId].id, identityId);
  assert.equal(renamed.characterIdentities[identityId].name, "Renamed identity");
  assert.equal(renamed.characterInstances[firstId].characterId, identityId);
  assert.equal(renamed.characterInstances[secondId].characterId, identityId);
  assert.equal(renamed.characterIdentities[otherIdentityId].name, "Independent");
  assert.throws(() => renameCharacter(renamed, identityId, "   "));
  const moved = updateCharacterState(data, firstId, { transform: { ...data.characterStates[firstId].transform, position: [2, 0, 3], rotation: [0, Math.PI / 2, 0] } });
  assert.deepEqual(moved.characterStates[secondId], data.characterStates[secondId]);
  assert.throws(() => updateCharacterState(moved, firstId, { transform: { ...moved.characterStates[firstId].transform, scale: [0, 1, 1] } }));
  const scaled = updateCharacterState(moved, firstId, { transform: { ...moved.characterStates[firstId].transform, scale: [1.25, 0.9, 1.1] } });
  assert.deepEqual(scaled.characterStates[firstId].transform.scale, [1.25, 0.9, 1.1]);
  assert.deepEqual(scaled.characterStates[secondId].transform.scale, data.characterStates[secondId].transform.scale);
  assert.equal(updateCharacterState(moved, firstId, { visible: false }).characterStates[firstId].visible, false);
  assert.deepEqual(resetCharacterPlacement(moved, firstId).characterStates[firstId].transform, data.characterStates[firstId].initialTransform);
  assert.throws(() => addCharacterInstance(data, identityId, firstId), /تکراری/);
  const removed = removeCharacterInstance(moved, firstId);
  assert.equal(removed.characterInstances[firstId], undefined);
  assert.ok(removed.characterIdentities[identityId]);
  assert.ok(removed.characterInstances[secondId]);
  assert.equal(characterProjectDataSchema.safeParse(removed).success, true);
});

test("unknown model references survive project loading and can be reported as missing", () => {
  const project = newProject(randomUUID(), "Missing model");
  const identityId = randomUUID();
  const instanceId = randomUUID();
  const missingModelId = "character-model:future-import";
  const parsed = projectSchema.parse({ ...project,
    characterIdentities: { [identityId]: { id: identityId, name: "هویت محفوظ", modelId: missingModelId, customization: {} } },
    characterInstances: { [instanceId]: { id: instanceId, characterId: identityId } },
    characterStates: { [instanceId]: { transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      initialTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, visible: true } },
  });
  assert.equal(parsed.characterIdentities[identityId].modelId, missingModelId);
  assert.equal(parsed.characterStates[instanceId].placementAnchorId, undefined,
    "older saved character states without a seat assignment remain valid and unassigned");
  assert.equal(characterModelRegistry.get(missingModelId), undefined);
});

test("v3 migration preserves studio and laptop fields while adding empty character collections", () => {
  const project = newProject(randomUUID(), "Schema migration");
  const legacy = { ...project, schemaVersion: 3 };
  delete legacy.characterIdentities;
  delete legacy.characterInstances;
  delete legacy.characterStates;
  const migrated = migrateProject(legacy);
  assert.equal(migrated.schemaVersion, 5);
  assert.deepEqual(migrated.environmentArrangement, project.environmentArrangement);
  assert.deepEqual(migrated.displayAssignments, project.displayAssignments);
  assert.deepEqual(migrated.characterIdentities, {});
});

test("v4 migration upgrades only empty development placeholder appearances and preserves identity and placement", () => {
  const project = newProject(randomUUID(), "v4 character migration");
  const identityId = randomUUID(); const instanceId = randomUUID();
  const oldIdentity = { id: identityId, name: "Existing identity", modelId: "character-model:development-human", customization: {} };
  const transform = { position: [1, 2, 3], rotation: [0, 0.5, 0], scale: [0.7, 0.7, 0.7] };
  const v4 = { ...project, schemaVersion: 4, characterIdentities: { [identityId]: oldIdentity },
    characterInstances: { [instanceId]: { id: instanceId, characterId: identityId } },
    characterStates: { [instanceId]: { transform, initialTransform: transform, visible: false } } };
  const migrated = migrateProject(v4);
  assert.equal(migrated.schemaVersion, 5);
  assert.equal(migrated.characterIdentities[identityId].id, identityId);
  assert.equal(migrated.characterIdentities[identityId].modelId, "character-model:kamyar");
  assert.equal(migrated.characterInstances[instanceId].id, instanceId);
  assert.deepEqual(migrated.characterStates[instanceId].transform, transform);
  const customizedV4 = { ...v4, characterIdentities: { [identityId]: { ...oldIdentity, customization: { legacyHair: "custom" } } } };
  const preserved = migrateProject(customizedV4);
  assert.equal(preserved.characterIdentities[identityId].modelId, "character-model:development-human");
  assert.deepEqual(preserved.characterIdentities[identityId].customization, { legacyHair: "custom" });
});

test("character arrangement saves, reopens and duplicates without sharing placement state", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-characters-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Character persistence");
    let data = createCharacterIdentity(emptyCharacterData(), randomUUID(), "پیکره", characterModelRegistry.list()[0].id);
    const identityId = Object.keys(data.characterIdentities)[0];
    const instanceId = randomUUID();
    data = addCharacterInstance(data, identityId, instanceId);
    data = assignCharacterSeat(data, instanceId, STUDIO_01.characterAnchors[0].id, STUDIO_01.characterAnchors);
    data = renameCharacter(data, identityId, "Persisted identity");
    data = updateCharacterCustomization(data, identityId, { hairColor: "#4a3529", clothingColor: "#111111", hairStyle: "slicked-back", beardStyle: "full-trimmed-beard", beardVisibility: "hidden", accessory: "glasses" });
    data = updateCharacterState(data, instanceId, { transform: { ...data.characterStates[instanceId].transform,
      position: [0.4, 1.25, -0.7], rotation: [0.25, 0.85, -0.1], scale: [1.4, 0.8, 1.1] } });
    const saved = await service.save(project.id, project.title, project.revision, undefined, undefined,
      data.characterIdentities, data.characterInstances, data.characterStates);
    const opened = await service.open(project.id);
    assert.equal(opened.characterIdentities[identityId].name, "Persisted identity");
    assert.equal(opened.characterIdentities[identityId].customization.hairColor, "#4a3529");
    assert.equal(opened.characterIdentities[identityId].customization.hairStyle, "slicked-back");
    assert.equal(opened.characterIdentities[identityId].customization.beardStyle, "full-trimmed-beard");
    assert.equal(opened.characterIdentities[identityId].customization.beardVisibility, "hidden");
    assert.equal(opened.characterIdentities[identityId].customization.accessory, "glasses");
    assert.deepEqual(opened.characterStates[instanceId].transform.scale, [1.4, 0.8, 1.1]);
    assert.deepEqual(opened.characterStates[instanceId].transform.position, [0.4, 1.25, -0.7]);
    assert.deepEqual(opened.characterStates[instanceId].transform.rotation, [0.25, 0.85, -0.1]);
    assert.equal(opened.characterStates[instanceId].placementAnchorId, STUDIO_01.characterAnchors[0].id);
    assert.equal(opened.characterStates[instanceId].visible, true);
    const copy = await service.duplicate(project.id);
    const hiddenCopy = updateCharacterState({ characterIdentities: copy.characterIdentities, characterInstances: copy.characterInstances,
      characterStates: copy.characterStates }, instanceId, { visible: false });
    const customizedCopy = updateCharacterCustomization(hiddenCopy, identityId, {
      hairColor: "#987654", clothingColor: "#111111", hairStyle: "curly-short", beardStyle: "light-stubble", beardVisibility: "visible",
    });
    await service.save(copy.id, copy.title, copy.revision, undefined, undefined, customizedCopy.characterIdentities, customizedCopy.characterInstances, customizedCopy.characterStates);
    assert.equal((await service.open(project.id)).characterStates[instanceId].visible, true);
    assert.equal((await service.open(project.id)).characterIdentities[identityId].customization.hairColor, "#4a3529");
    assert.equal((await service.open(project.id)).characterIdentities[identityId].customization.hairStyle, "slicked-back");
    assert.equal((await service.open(project.id)).characterIdentities[identityId].customization.beardStyle, "full-trimmed-beard");
    assert.equal((await service.open(copy.id)).characterStates[instanceId].visible, false);
    assert.equal((await service.open(copy.id)).characterIdentities[identityId].customization.hairColor, "#987654");
    assert.equal((await service.open(copy.id)).characterIdentities[identityId].customization.hairStyle, "curly-short");
    assert.equal((await service.open(copy.id)).characterIdentities[identityId].customization.beardStyle, "light-stubble");
    assert.equal(saved.schemaVersion, 5);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("deleted identity persists after reopening while unrelated identities, instances and models remain", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-character-delete-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Character identity deletion");
    let data = emptyCharacterData();
    const deleteId = randomUUID(); const keepId = randomUUID(); const instanceId = randomUUID();
    data = createCharacterIdentity(data, deleteId, "Removed preset", "character-model:kamyar");
    data = createCharacterIdentity(data, keepId, "Kept preset", "character-model:kamyar");
    data = addCharacterInstance(data, keepId, instanceId);
    await service.save(project.id, project.title, project.revision, undefined, undefined,
      data.characterIdentities, data.characterInstances, data.characterStates);
    const afterDelete = removeCharacterIdentity(data, deleteId);
    const saved = await service.save(project.id, project.title, 1, undefined, undefined,
      afterDelete.characterIdentities, afterDelete.characterInstances, afterDelete.characterStates);
    const reopened = await service.open(project.id);
    assert.equal(saved.characterIdentities[deleteId], undefined);
    assert.equal(reopened.characterIdentities[deleteId], undefined);
    assert.equal(reopened.characterIdentities[keepId].name, "Kept preset");
    assert.equal(reopened.characterInstances[instanceId].characterId, keepId);
    assert.equal(reopened.characterStates[instanceId].visible, true);
    assert.equal(characterModelRegistry.get("character-model:kamyar").displayName, "کامیار");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("ChatGPT identity can become Claude while preserving IDs, instances, transforms, placement and compatible appearance", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-model-change-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Replace character model");
    let data = emptyCharacterData();
    const identityId = randomUUID(); const otherIdentityId = randomUUID();
    const instanceIds = [randomUUID(), randomUUID()]; const otherInstanceId = randomUUID();
    data = createCharacterIdentity(data, identityId, "Kept custom name", "character-model:chatgpt-robot");
    data = createCharacterIdentity(data, otherIdentityId, "Unrelated identity", "character-model:kamyar");
    for (const instanceId of instanceIds) data = addCharacterInstance(data, identityId, instanceId);
    data = addCharacterInstance(data, otherIdentityId, otherInstanceId);
    data = updateCharacterCustomization(data, identityId, { bodyColor: "#abcdef", eyeColor: "#123456", faceStyle: "excited" });
    data = updateCharacterState(data, instanceIds[0], { placementAnchorId: STUDIO_01.characterAnchors[0].id,
      transform: { position: [1.2, 1.4, -0.7], rotation: [0.1, 0.4, -0.2], scale: [0.8, 0.9, 1.1] }, visible: false });
    data = updateCharacterState(data, instanceIds[1], { transform: { position: [-2, 0.5, 2], rotation: [0, 1, 0], scale: [0.6, 0.6, 0.6] } });
    const originalStates = structuredClone(data.characterStates);
    const initiallySaved = await service.save(project.id, project.title, project.revision, undefined, undefined,
      data.characterIdentities, data.characterInstances, data.characterStates);

    const preview = previewCharacterModelChange(data, identityId, "character-model:claude-mascot");
    assert.deepEqual(preview.replacedCustomizationKeys.sort(), ["bodyColor", "faceStyle"]);
    const changed = replaceCharacterModel(data, identityId, "character-model:claude-mascot");
    assert.equal(changed.characterIdentities[identityId].id, identityId);
    assert.equal(changed.characterIdentities[identityId].name, "Kept custom name");
    assert.equal(changed.characterIdentities[identityId].modelId, "character-model:claude-mascot");
    assert.equal(changed.characterIdentities[identityId].customization.eyeColor, "#123456");
    assert.equal(changed.characterIdentities[identityId].customization.furColor, "#f47920");
    assert.deepEqual(changed.characterInstances, data.characterInstances);
    assert.deepEqual(changed.characterStates, originalStates);
    assert.deepEqual(changed.characterIdentities[otherIdentityId], data.characterIdentities[otherIdentityId]);
    await service.save(project.id, project.title, initiallySaved.revision, undefined, undefined,
      changed.characterIdentities, changed.characterInstances, changed.characterStates);
    const reopened = await service.open(project.id);
    assert.equal(reopened.characterIdentities[identityId].modelId, "character-model:claude-mascot");
    assert.equal(reopened.characterIdentities[identityId].name, "Kept custom name");
    assert.deepEqual(reopened.characterInstances, data.characterInstances);
    assert.deepEqual(reopened.characterStates, originalStates);
    assert.equal(reopened.characterIdentities[otherIdentityId].modelId, "character-model:kamyar");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Claude identity can become Kamyar with compatible values preserved and model-specific appearance reset", () => {
  let data = emptyCharacterData();
  const identityId = randomUUID(); const instanceId = randomUUID();
  data = createCharacterIdentity(data, identityId, "Claude-derived host", "character-model:claude-mascot");
  data = addCharacterInstance(data, identityId, instanceId);
  data = updateCharacterCustomization(data, identityId, { furColor: "#aa5522", eyeColor: "#665544" });
  const changed = replaceCharacterModel(data, identityId, "character-model:kamyar");
  assert.equal(changed.characterIdentities[identityId].name, "Claude-derived host");
  assert.equal(changed.characterIdentities[identityId].modelId, "character-model:kamyar");
  assert.equal(changed.characterIdentities[identityId].customization.eyeColor, "#665544");
  assert.equal(changed.characterIdentities[identityId].customization.hairColor,
    characterModelRegistry.get("character-model:kamyar").customizationFields.find((field) => field.key === "hairColor").defaultValue);
  assert.deepEqual(changed.characterInstances[instanceId], data.characterInstances[instanceId]);
  assert.deepEqual(changed.characterStates[instanceId], data.characterStates[instanceId]);
});

test("model replacement rejects unsupported targets and safely repairs identities with missing source models", () => {
  let data = emptyCharacterData();
  const identityId = randomUUID();
  data = createCharacterIdentity(data, identityId, "Missing source", "character-model:kamyar");
  data.characterIdentities[identityId] = { ...data.characterIdentities[identityId], modelId: "character-model:removed", customization: { legacyFace: "odd" } };
  assert.throws(() => replaceCharacterModel(data, identityId, "character-model:not-registered"), /پشتیبانی/);
  const preview = previewCharacterModelChange(data, identityId, "character-model:chatgpt-robot");
  assert.deepEqual(preview.replacedCustomizationKeys, ["legacyFace"]);
  assert.equal(preview.data.characterIdentities[identityId].modelId, "character-model:chatgpt-robot");
  assert.deepEqual(preview.data.characterIdentities[identityId].customization,
    { bodyColor: "#edf2f4", accentColor: "#52d7ca", eyeColor: "#8cfff0", faceStyle: "happy", accessory: "none" });
});
