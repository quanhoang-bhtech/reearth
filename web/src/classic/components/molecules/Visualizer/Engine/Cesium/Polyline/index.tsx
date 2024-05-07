import { Cartesian3 } from "cesium";
import { isEqual } from "lodash-es";
import React, { useMemo } from "react";
import { PolylineGraphics, Entity } from "resium";
import { useCustomCompareMemo } from "use-custom-compare";

import { Coordinates, toColor } from "@reearth/classic/util/value";

import type { Props as PrimitiveProps } from "../../../Primitive";
import { shadowMode } from "../common";
import { toDistanceDisplayCondition } from "../utils";

export type Props = PrimitiveProps<Property>;

export type Property = {
  default?: {
    coordinates?: Coordinates;
    clampToGround?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    shadows?: "disabled" | "enabled" | "cast_only" | "receive_only";
  };
  distanceDisplayCondition?: {
    near?: number;
    far?: number;
  };
};

const Polyline: React.FC<PrimitiveProps<Property>> = ({ layer }) => {
  const { id, isVisible, property } = layer ?? {};
  const {
    coordinates,
    clampToGround,
    strokeColor,
    strokeWidth = 1,
    shadows,
  } = property?.default ?? {};

  const { near, far } = property?.distanceDisplayCondition ?? {};

  const distanceDisplayCondition = useMemo(
    () => toDistanceDisplayCondition(near, far),
    [near, far],
  );

  const positions = useCustomCompareMemo(
    () => coordinates?.map(c => Cartesian3.fromDegrees(c.lng, c.lat, c.height)),
    [coordinates ?? []],
    isEqual,
  );
  const material = useMemo(() => toColor(strokeColor), [strokeColor]);

  return !isVisible ? null : (
    <Entity id={id}>
      <PolylineGraphics
        positions={positions}
        width={strokeWidth}
        material={material}
        clampToGround={clampToGround}
        shadows={shadowMode(shadows)}
        distanceDisplayCondition={distanceDisplayCondition}
      />
    </Entity>
  );
};

export default Polyline;
