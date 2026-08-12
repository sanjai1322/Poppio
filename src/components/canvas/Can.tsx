"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import type { GroupProps } from "@react-three/fiber";
import { WRAP_URLS } from "@/lib/flavors";

export const CAN_URL = "/poppio-can.glb";
/** Model is 1.22 units tall with its origin at the base — lift it to centre. */
export const CAN_HEIGHT = 1.22;
export const CAN_CENTER_Y = -CAN_HEIGHT / 2;

const LABEL_MATERIAL = "POPPIO_Label";

useGLTF.preload(CAN_URL);

/**
 * All four wraps, loaded once and cached by drei. Swapping only reassigns
 * `material.map`, so no texture is ever decoded mid-scroll.
 *
 * The label's baked texture carries a KHR_texture_transform (offset.x = 0.07).
 * We copy that transform off the GLB's own map rather than hardcoding it, so a
 * re-export of the model can't silently rotate every wrap around the can.
 */
export function useWrapTextures() {
  const { materials } = useGLTF(CAN_URL);
  const textures = useTexture(WRAP_URLS);

  return useMemo(() => {
    const source = (materials[LABEL_MATERIAL] as THREE.MeshStandardMaterial)
      ?.map;

    for (const texture of textures) {
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;

      if (source) {
        texture.wrapS = source.wrapS;
        texture.wrapT = source.wrapT;
        texture.offset.copy(source.offset);
        texture.repeat.copy(source.repeat);
        texture.center.copy(source.center);
        texture.rotation = source.rotation;
      }

      texture.needsUpdate = true;
    }

    return textures;
  }, [textures, materials]);
}

type CanProps = GroupProps & {
  /** Index into FLAVORS. */
  flavor?: number;
};

export default function Can({ flavor = 0, ...props }: CanProps) {
  const { scene } = useGLTF(CAN_URL);
  const textures = useWrapTextures();

  // Clone per instance and give each its own label material, so two cans on
  // screen can wear different flavours without fighting over one material.
  const { object, label } = useMemo<{
    object: THREE.Object3D;
    label: THREE.MeshStandardMaterial | null;
  }>(() => {
    const object = scene.clone(true);
    let label: THREE.MeshStandardMaterial | null = null;

    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material as THREE.Material;
      if (material.name !== LABEL_MATERIAL) return;

      const clone = material.clone() as THREE.MeshStandardMaterial;
      child.material = clone;
      label = clone;
    });

    return { object, label };
  }, [scene]);

  useEffect(() => {
    if (!label) return;
    label.map = textures[flavor] ?? textures[0];
    label.needsUpdate = true;
  }, [label, textures, flavor]);

  return <primitive object={object} {...props} />;
}
