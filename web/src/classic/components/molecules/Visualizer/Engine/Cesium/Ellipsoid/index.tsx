/* eslint-disable react-hooks/exhaustive-deps */
import { Cartesian3, Entity as CesiumEntity } from "cesium";
import React, { useEffect, useMemo, useRef } from "react";
import { Entity, EllipsoidGraphics, CesiumComponentRef } from "resium";

import { LatLng, toColor } from "@reearth/classic/util/value";

import type { Props as PrimitiveProps } from "../../../Primitive";
import { attachTag, draggableTag, heightReference, shadowMode } from "../common";
import { toDistanceDisplayCondition } from "../utils";

export type Props = PrimitiveProps<Property>;

export type Property = {
  default?: {
    position?: LatLng;
    location?: LatLng;
    height?: number;
    heightReference?: "none" | "clamp" | "relative";
    shadows?: "disabled" | "enabled" | "cast_only" | "receive_only";
    radius?: number;
    fillColor?: string;
    elevation?: number;
  };
  distanceDisplayCondition?: {
    near?: number;
    far?: number;
  };
};

const Ellipsoid: React.FC<PrimitiveProps<Property>> = ({ layer }) => {
  const { id, isVisible, property } = layer ?? {};
  const { heightReference: hr, shadows, radius = 1000, fillColor } = property?.default ?? {};
  const { near, far } = property?.distanceDisplayCondition ?? {};

  const distanceDisplayCondition = useMemo(
    () => toDistanceDisplayCondition(near, far),
    [near, far],
  );

  const position = useMemo(() => {
    const { position, location, height = 0, elevation = 0 } = property?.default ?? {};
    const pos = position || location;
    return pos ? Cartesian3.fromDegrees(pos.lng, pos.lat, height + elevation ?? 0) : undefined;
  }, [
    property?.default?.position?.lat,
    property?.default?.position?.lng,
    property?.default?.location?.lat,
    property?.default?.location?.lng,
    property?.default?.height,
    property?.default?.elevation,
  ]);

  const raddi = useMemo(() => {
    return new Cartesian3(radius, radius, radius);
  }, [radius]);

  const material = useMemo(() => toColor(fillColor), [fillColor]);

  const e = useRef<CesiumComponentRef<CesiumEntity>>(null);
  useEffect(() => {
    attachTag(
      e.current?.cesiumElement,
      draggableTag,
      property?.default?.location ? "default.location" : "default.position",
    );
  }, [isVisible, position, property?.default?.location]);

  return !isVisible || !position ? null : (
    <Entity id={id} position={position} ref={e}>
      <EllipsoidGraphics
        radii={raddi}
        material={material}
        heightReference={heightReference(hr)}
        shadows={shadowMode(shadows)}
        distanceDisplayCondition={distanceDisplayCondition}
      />
    </Entity>
  );
};

export default Ellipsoid;
