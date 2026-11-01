import type { EnvironmentDefinition, PropDefinition, PropRendererKey } from "@/lib/environments/environment-registry";
import { environmentRegistry } from "@/lib/environments/registry";
import { STUDIO_01_ID } from "@/lib/environments/studio-01";
import { AcousticWall, RoomShell, Rug } from "./room-architecture";
import { Bookshelf, PodcastDesk, SideTable, StudioChair } from "./furniture";
import { Laptop, Plant, PodcastMicrophone, PracticalLights, WallArt } from "./studio-details";

function StudioLighting() {
  return <>
    <ambientLight intensity={0.9} />
    <hemisphereLight args={["#b9d9d4", "#4e3f36", 1.15]} />
    <directionalLight position={[1, 5, 5]} intensity={1.6} color="#fff2dd" />
    <directionalLight position={[-4, 3.2, 0]} intensity={0.75} color="#9bd5d5" />
  </>;
}

function PropVisual({ rendererKey, definition }: { rendererKey: PropRendererKey; definition: PropDefinition }) {
  switch (rendererKey) {
    case "room-shell": return <RoomShell />;
    case "acoustic-wall": return <AcousticWall />;
    case "desk": return <PodcastDesk material={definition.material} />;
    case "chair": return <StudioChair />;
    case "bookshelf": return <Bookshelf />;
    case "laptop": return <Laptop />;
    case "microphone": return <PodcastMicrophone />;
    case "side-table": return <SideTable />;
    case "practical-lights": return <PracticalLights />;
    case "plant": return <Plant />;
    case "rug": return <Rug />;
    case "wall-art": return <WallArt />;
    default: return rendererKey satisfies never;
  }
}

export function StudioEnvironment({ environmentId = STUDIO_01_ID }: { environmentId?: string }) {
  const environment: EnvironmentDefinition | undefined = environmentRegistry.get(environmentId);
  if (!environment) throw new Error(`Environment is not registered: ${environmentId}`);
  const propDefinitions = new Map(environment.propDefinitions.map((definition) => [definition.id, definition]));

  return <group name={environment.id}>
    <StudioLighting />
    {environment.defaultProps.map((instance) => {
      if (!instance.visible) return null;
      const definition = propDefinitions.get(instance.definitionId);
      if (!definition) throw new Error(`Prop definition is missing: ${instance.definitionId}`);
      return <group key={instance.id} name={instance.id} position={instance.transform.position}
        rotation={instance.transform.rotation} scale={instance.transform.scale}>
        <PropVisual rendererKey={definition.rendererKey} definition={definition} />
      </group>;
    })}
  </group>;
}
