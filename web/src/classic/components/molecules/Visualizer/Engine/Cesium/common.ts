import {
  ColorBlendMode,
  BoundingSphere,
  HeadingPitchRange,
  HorizontalOrigin,
  VerticalOrigin,
  Camera as CesiumCamera,
  Math as CesiumMath,
  Scene,
  Cartesian2,
  Cartesian3,
  CesiumWidget,
  PerspectiveFrustum,
  OrthographicOffCenterFrustum,
  Viewer,
  HeightReference,
  ShadowMode,
  Entity,
  PropertyBag,
  Clock as CesiumClock,
  JulianDate,
  ClockStep,
  Ellipsoid,
  Quaternion,
  Matrix3,
  Cartographic,
  EllipsoidTerrainProvider,
  sampleTerrainMostDetailed,
  Ray,
  IntersectionTests,
  Matrix4,
  SceneMode,
  defined
} from "cesium";
import { useCallback, MutableRefObject } from "react";

import { useCanvas, useImage } from "@reearth/classic/util/image";
import { tweenInterval } from "@reearth/classic/util/raf";
import { Camera } from "@reearth/classic/util/value";

import { CameraOptions, Clock } from "../../Plugin/types";
import { FlyToDestination } from "../ref";

export const layerIdField = `__reearth_layer_id`;

const defaultImageSize = 50;

export const drawIcon = (
  c: HTMLCanvasElement,
  image: HTMLImageElement | undefined,
  w: number,
  h: number,
  crop: "circle" | "rounded" | "none" = "none",
  shadow = false,
  shadowColor = "rgba(0, 0, 0, 0.7)",
  shadowBlur = 3,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
) => {
  const ctx = c.getContext("2d");
  if (!image || !ctx) return;

  ctx.save();

  c.width = w + shadowBlur;
  c.height = h + shadowBlur;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(image, (c.width - w) / 2, (c.height - h) / 2, w, h);

  if (crop === "circle") {
    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "destination-in";
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, 2 * Math.PI);
    ctx.fill();

    if (shadow) {
      ctx.shadowColor = shadowColor;
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "black";
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  } else if (shadow) {
    ctx.shadowColor = shadowColor;
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "black";
    ctx.rect((c.width - w) / 2, (c.height - h) / 2, w, h);
    ctx.fill();
  }

  ctx.restore();
};

export const useIcon = ({
  image,
  imageSize,
  crop,
  shadow,
  shadowColor,
  shadowBlur,
  shadowOffsetX,
  shadowOffsetY,
}: {
  image?: string;
  imageSize?: number;
  crop?: "circle" | "rounded" | "none";
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}): [string, number, number] => {
  const img = useImage(image);

  const w = !img
    ? 0
    : typeof imageSize === "number"
    ? Math.floor(img.width * imageSize)
    : Math.min(defaultImageSize, img.width);
  const h = !img
    ? 0
    : typeof imageSize === "number"
    ? Math.floor(img.height * imageSize)
    : Math.floor((w / img.width) * img.height);

  const draw = useCallback(
    (can: HTMLCanvasElement) =>
      drawIcon(can, img, w, h, crop, shadow, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY),
    [crop, h, img, shadow, shadowBlur, shadowColor, shadowOffsetX, shadowOffsetY, w],
  );
  const canvas = useCanvas(draw);
  return [canvas, w, h];
};

export const ho = (o: "left" | "center" | "right" | undefined): HorizontalOrigin | undefined =>
  ({
    left: HorizontalOrigin.LEFT,
    center: HorizontalOrigin.CENTER,
    right: HorizontalOrigin.RIGHT,
    [""]: undefined,
  }[o || ""]);

export const vo = (
  o: "top" | "center" | "baseline" | "bottom" | undefined,
): VerticalOrigin | undefined =>
  ({
    top: VerticalOrigin.TOP,
    center: VerticalOrigin.CENTER,
    baseline: VerticalOrigin.BASELINE,
    bottom: VerticalOrigin.BOTTOM,
    [""]: undefined,
  }[o || ""]);

export const getLocationFromScreen = (
  scene: Scene | undefined | null,
  x: number,
  y: number,
  withTerrain = false,
) => {
  if (!scene) return undefined;
  const camera = scene.camera;
  const ellipsoid = scene.globe.ellipsoid;
  let cartesian;
  const pickedObject = scene.pick(new Cartesian2(x, y));
  
  if (defined(pickedObject)) {
    
    if (scene.pickPositionSupported) {
      cartesian = scene.pickPosition(new Cartesian2(x, y));
      if(pickedObject?.id?.billboard){
        const cartesian2 = scene.clampToHeight(cartesian, [pickedObject.id])
        const cartographic = ellipsoid.cartesianToCartographic(cartesian2);
        
        if(cartographic.height > 0) {
          cartesian.z = cartesian2.z
          cartesian.x = cartesian2.x
          cartesian.y = cartesian2.y
        }
      }
     
    }
    if (!cartesian) {
      const ray = camera.getPickRay(new Cartesian2(x, y));
      if (ray) {
        cartesian = scene.globe.pick(ray, scene);
      }
    }
  } 
  if (!cartesian) {
    cartesian = camera?.pickEllipsoid(new Cartesian2(x, y), ellipsoid);
  }
  if (!cartesian) return undefined;
  const { latitude, longitude, height } = ellipsoid.cartesianToCartographic(cartesian);
  return {
    lat: CesiumMath.toDegrees(latitude),
    lng: CesiumMath.toDegrees(longitude),
    height,
  };
};

export const flyTo = (
  cesiumCamera?: CesiumCamera,
  camera?: {
    /** degrees */
    lat?: number;
    /** degrees */
    lng?: number;
    /** meters */
    height?: number;
    /** radians */
    heading?: number;
    /** radians */
    pitch?: number;
    /** radians */
    roll?: number;
    /** Field of view expressed in radians */
    fov?: number;
  },
  options?: {
    /** Seconds */
    duration?: number;
    easing?: (time: number) => number;
  },
  complete?: () => void,
) => {
  if (!cesiumCamera || !camera) return () => {};

  const cancelFov = animateFOV({
    fov: camera.fov,
    camera: cesiumCamera,
    duration: options?.duration,
    easing: options?.easing,
  });

  const position =
    typeof camera.lat === "number" &&
    typeof camera.lng === "number" &&
    typeof camera.height === "number"
      ? Cartesian3.fromDegrees(camera.lng, camera.lat, camera.height)
      : undefined;

  if (position) {
    cesiumCamera.flyTo({
      destination: position,
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      },
      duration: options?.duration ?? 0,
      easingFunction: options?.easing,
      complete
    });
  }

  return () => {
    cancelFov?.();
    cesiumCamera?.cancelFlight();
  };
};

export const lookAt = (
  cesiumCamera?: CesiumCamera,
  camera?: {
    /** degrees */
    lat?: number;
    /** degrees */
    lng?: number;
    /** meters */
    height?: number;
    /** radians */
    heading?: number;
    /** radians */
    pitch?: number;
    /** radians */
    range?: number;
    /** Field of view expressed in radians */
    fov?: number;
  },
  options?: {
    /** Seconds */
    duration?: number;
    easing?: (time: number) => number;
  },
  complete?: () => void,
) => {
  if (!cesiumCamera || !camera) return () => {};

  const cancelFov = animateFOV({
    fov: camera.fov,
    camera: cesiumCamera,
    duration: options?.duration,
    easing: options?.easing,
  });

  const position =
    typeof camera.lat === "number" &&
    typeof camera.lng === "number" &&
    typeof camera.height === "number"
      ? Cartesian3.fromDegrees(camera.lng, camera.lat, camera.height)
      : undefined;

  if (position) {
    cesiumCamera.flyToBoundingSphere(new BoundingSphere(position), {
      offset: new HeadingPitchRange(camera.heading, camera.pitch, camera.range),
      duration: options?.duration,
      easingFunction: options?.easing,
      complete,
    });
  }

  return () => {
    cancelFov?.();
    cesiumCamera?.cancelFlight();
  };
};

export const lookAtWithoutAnimation = (
  scene: Scene,
  camera?: {
    /** degrees */
    lat?: number;
    /** degrees */
    lng?: number;
    /** meters */
    height?: number;
    /** radians */
    heading?: number;
    /** radians */
    pitch?: number;
    /** radians */
    range?: number;
    /** Field of view expressed in radians */
    fov?: number;
  },
) => {
  if (!camera) {
    return;
  }

  const position =
    typeof camera.lat === "number" &&
    typeof camera.lng === "number" &&
    typeof camera.height === "number"
      ? Cartesian3.fromDegrees(camera.lng, camera.lat, camera.height)
      : undefined;

  if (position) {
    scene.camera.lookAtTransform(Matrix4.fromTranslation(position));
  }
};

export const animateFOV = ({
  fov,
  camera,
  easing,
  duration,
}: {
  fov?: number;
  camera: CesiumCamera;
  easing?: (t: number) => number;
  duration?: number;
}): (() => void) | undefined => {
  // fov animation
  if (
    typeof fov === "number" &&
    camera.frustum instanceof PerspectiveFrustum &&
    typeof camera.frustum.fov === "number" &&
    camera.frustum.fov !== fov
  ) {
    const fromFov = camera.frustum.fov;
    return tweenInterval(
      t => {
        if (!(camera.frustum instanceof PerspectiveFrustum)) return;
        camera.frustum.fov = (fov - fromFov) * t + fromFov;
      },
      easing || "inOutCubic",
      (duration ?? 0) * 1000,
    );
  }
  return undefined;
};

/**
 * Get the center of globe.
 */
export const getCenterCamera = ({
  camera,
  scene,
}: {
  camera: CesiumCamera;
  scene: Scene;
}): Cartesian3 | void => {
  const result = new Cartesian3();
  const ray = camera.getPickRay(camera.positionWC);
  if (ray) {
    ray.origin = camera.positionWC;
    ray.direction = camera.directionWC;
    return scene.globe.pick(ray, scene, result);
  }
};

export const zoom = (
  { viewer, relativeAmount }: { viewer: Viewer; relativeAmount: number },
  options?: CameraOptions,
) => {
  const { camera, scene } = viewer;
  if (scene.mode !== SceneMode.SCENE3D) {
    const pos = getCamera(viewer);
    flyTo(camera, { ...pos, height: (pos?.height || 1) * relativeAmount }, { duration: 0.5 });
    return;
  }

  const center = getCenterCamera({ camera, scene });
  const target =
    center ||
    IntersectionTests.grazingAltitudeLocation(
      // Get the ray from cartographic to the camera direction
      new Ray(
        // Get the cartographic position of camera on 3D space.
        scene.globe.ellipsoid.cartographicToCartesian(camera.positionCartographic),
        // Get the camera direction.
        camera.directionWC,
      ),
      scene.globe.ellipsoid,
    );

  if (!target) {
    return;
  }

  const orientation = {
    heading: camera.heading,
    pitch: camera.pitch,
    roll: camera.roll,
  };

  const cartesian3Scratch = new Cartesian3();
  const direction = Cartesian3.subtract(camera.position, target, cartesian3Scratch);
  const movementVector = Cartesian3.multiplyByScalar(direction, relativeAmount, direction);
  const endPosition = Cartesian3.add(target, movementVector, target);

  camera.flyTo({
    destination: endPosition,
    orientation: orientation,
    duration: options?.duration || 0.5,
    convert: false,
  });
};

export const getCamera = (viewer: Viewer | CesiumWidget | undefined): Camera | undefined => {
  if (!viewer || viewer.isDestroyed() || !viewer.camera || !viewer.scene) return undefined;
  const { camera } = viewer;
  if (
    !(
      camera.frustum instanceof PerspectiveFrustum ||
      camera.frustum instanceof OrthographicOffCenterFrustum
    )
  )
    return;
  const { latitude, longitude, height } = camera.positionCartographic;
  const lat = CesiumMath.toDegrees(latitude);
  const lng = CesiumMath.toDegrees(longitude);
  const { heading, pitch, roll } = camera;
  const fov = camera.frustum instanceof PerspectiveFrustum ? camera.frustum.fov : 1;
  return { lng, lat, height, heading, pitch, roll, fov };
};

export const getClock = (clock: CesiumClock | undefined): Clock | undefined => {
  if (!clock) return undefined;
  return {
    // Getter
    get startTime() {
      return JulianDate.toDate(clock.startTime);
    },
    get stopTime() {
      return JulianDate.toDate(clock.stopTime);
    },
    get currentTime() {
      return JulianDate.toDate(clock.currentTime);
    },
    get tick() {
      return () => JulianDate.toDate(clock.tick());
    },
    get playing() {
      return clock.shouldAnimate;
    },
    get paused() {
      return !clock.shouldAnimate;
    },
    get speed() {
      return clock.multiplier;
    },

    // Setter
    set startTime(d: Date) {
      clock["startTime"] = JulianDate.fromDate(d);
    },
    set stopTime(d: Date) {
      clock["stopTime"] = JulianDate.fromDate(d);
    },
    set currentTime(d: Date) {
      clock["currentTime"] = JulianDate.fromDate(d);
    },
    set tick(cb: () => Date) {
      clock["tick"] = () => JulianDate.fromDate(cb());
    },
    set playing(v: boolean) {
      clock["shouldAnimate"] = v;
    },
    set paused(v: boolean) {
      clock["shouldAnimate"] = !v;
    },
    set speed(v: number) {
      clock["multiplier"] = v;
      // Force multiplier
      clock["clockStep"] = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    },

    // methods
    get play() {
      return () => {
        clock["shouldAnimate"] = true;
      };
    },
    get pause() {
      return () => {
        clock["shouldAnimate"] = false;
      };
    },
  };
};

export const colorBlendMode = (colorBlendMode?: "highlight" | "replace" | "mix" | "none") =>
  ((
    {
      highlight: ColorBlendMode.HIGHLIGHT,
      replace: ColorBlendMode.REPLACE,
      mix: ColorBlendMode.MIX,
    } as { [key in string]?: ColorBlendMode }
  )[colorBlendMode || ""]);

export const heightReference = (
  heightReference?: "none" | "clamp" | "relative",
): HeightReference | undefined =>
  ((
    {
      clamp: HeightReference.CLAMP_TO_GROUND,
      relative: HeightReference.RELATIVE_TO_GROUND,
      none: HeightReference.NONE,
    } as {
      [key in string]?: HeightReference;
    }
  )[heightReference || ""]);

export const shadowMode = (
  shadows?: "disabled" | "enabled" | "cast_only" | "receive_only",
): ShadowMode | undefined =>
  ((
    {
      enabled: ShadowMode.ENABLED,
      cast_only: ShadowMode.CAST_ONLY,
      receive_only: ShadowMode.RECEIVE_ONLY,
    } as {
      [key in string]?: ShadowMode;
    }
  )[shadows || ""]);

export const unselectableTag = "reearth_unselectable";
export const draggableTag = "reearth_draggable";

export function isSelectable(e: Entity | undefined): boolean {
  return !e?.properties?.hasProperty(unselectableTag);
}

export function isDraggable(e: Entity): string | undefined {
  return e.properties?.getValue(new JulianDate())?.[draggableTag];
}

export function attachTag(entity: Entity | undefined, tag: string, value: any) {
  if (!entity) return;
  if (typeof value !== "undefined" && !entity.properties) {
    entity.properties = new PropertyBag({ [tag]: value });
  } else if (typeof value === "undefined") {
    entity.properties?.removeProperty(tag);
  } else if (entity.properties?.hasProperty(tag)) {
    entity.properties?.removeProperty(tag);
    entity.properties?.addProperty(tag, value);
  } else {
    entity.properties?.addProperty(tag, value);
  }
}

export function lookHorizontal(scene: Scene, amount: number) {
  const camera = scene.camera;
  const ellipsoid = scene.globe.ellipsoid;
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(camera.position, new Cartesian3());
  camera.look(surfaceNormal, amount);
}

export function lookVertical(scene: Scene, amount: number) {
  const camera = scene.camera;
  const ellipsoid = scene.globe.ellipsoid;
  const lookAxis = projectVectorToSurface(camera.right, camera.position, ellipsoid);
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(camera.position, new Cartesian3());
  const currentAngle = CesiumMath.toDegrees(Cartesian3.angleBetween(surfaceNormal, camera.up));
  const upAfterLook = rotateVectorAboutAxis(camera.up, lookAxis, amount);
  const angleAfterLook = CesiumMath.toDegrees(Cartesian3.angleBetween(surfaceNormal, upAfterLook));
  const friction = angleAfterLook < currentAngle ? 1 : (90 - currentAngle) / 90;
  camera.look(lookAxis, amount * friction);
}

export function moveForward(scene: Scene, amount: number) {
  const direction = projectVectorToSurface(
    scene.camera.direction,
    scene.camera.position,
    scene.globe.ellipsoid,
  );
  scene.camera.move(direction, amount);
}

export function moveBackward(scene: Scene, amount: number) {
  const direction = projectVectorToSurface(
    scene.camera.direction,
    scene.camera.position,
    scene.globe.ellipsoid,
  );
  scene.camera.move(direction, -amount);
}

export function moveUp(scene: Scene, amount: number) {
  const surfaceNormal = scene.globe.ellipsoid.geodeticSurfaceNormal(
    scene.camera.position,
    new Cartesian3(),
  );
  scene.camera.move(surfaceNormal, amount);
}

export function moveDown(scene: Scene, amount: number) {
  const surfaceNormal = scene.globe.ellipsoid.geodeticSurfaceNormal(
    scene.camera.position,
    new Cartesian3(),
  );
  scene.camera.move(surfaceNormal, -amount);
}

export function moveLeft(scene: Scene, amount: number) {
  const direction = projectVectorToSurface(
    scene.camera.right,
    scene.camera.position,
    scene.globe.ellipsoid,
  );
  scene.camera.move(direction, -amount);
}

export function moveRight(scene: Scene, amount: number) {
  const direction = projectVectorToSurface(
    scene.camera.right,
    scene.camera.position,
    scene.globe.ellipsoid,
  );
  scene.camera.move(direction, amount);
}

export async function moveOverTerrain(viewer: Viewer, offset = 0) {
  const camera = getCamera(viewer);
  if (camera?.lng === undefined || camera?.lat === undefined) return;
  const height = await sampleTerrainHeight(viewer.scene, camera.lng, camera.lat);
  if (height && height !== 0) {
    const innerCamera = getCamera(viewer);
    if (innerCamera && innerCamera?.height < height + offset) {
      viewer.scene.camera.moveUp(height + offset - innerCamera.height);
    }
  }
}

export async function flyToGround(
  viewer: Viewer,
  cancelCameraFlight: MutableRefObject<(() => void) | undefined>,
  camera: FlyToDestination,
  options?: {
    duration?: number;
    easing?: (time: number) => number;
  },
  offset = 0,
) {
  if (camera.lng === undefined || camera.lat === undefined) return;
  const height = await sampleTerrainHeight(viewer.scene, camera.lng, camera.lat);
  const tarHeight = height ? height + offset : offset;
  cancelCameraFlight.current?.();
  cancelCameraFlight.current = flyTo(
    viewer.scene?.camera,
    { ...getCamera(viewer), ...camera, height: tarHeight },
    options,
  );
}

function projectVectorToSurface(vector: Cartesian3, position: Cartesian3, ellipsoid: Ellipsoid) {
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(position, new Cartesian3());
  const magnitudeOfProjectionOnSurfaceNormal = Cartesian3.dot(vector, surfaceNormal);
  const projectionOnSurfaceNormal = Cartesian3.multiplyByScalar(
    surfaceNormal,
    magnitudeOfProjectionOnSurfaceNormal,
    new Cartesian3(),
  );
  return Cartesian3.subtract(vector, projectionOnSurfaceNormal, new Cartesian3());
}

function rotateVectorAboutAxis(vector: Cartesian3, rotateAxis: Cartesian3, rotateAmount: number) {
  const quaternion = Quaternion.fromAxisAngle(rotateAxis, -rotateAmount, new Quaternion());
  const rotation = Matrix3.fromQuaternion(quaternion, new Matrix3());
  const rotatedVector = Matrix3.multiplyByVector(rotation, vector, vector.clone());
  return rotatedVector;
}

export async function sampleTerrainHeight(
  scene: Scene,
  lng: number,
  lat: number,
): Promise<number | undefined> {
  const terrainProvider = scene.terrainProvider;
  if (terrainProvider instanceof EllipsoidTerrainProvider) return 0;

  const [sample] = await sampleTerrainMostDetailed(terrainProvider, [
    Cartographic.fromDegrees(lng, lat),
  ]);
  return sample.height;
}

export async function sampleTerrainHeightFromCartesian(scene: Scene, translation: Cartesian3) {
  const cart = Cartographic.fromCartesian(translation);
  const [lng, lat] = [
    CesiumMath.toDegrees(cart?.longitude || 0),
    CesiumMath.toDegrees(cart?.latitude || 0),
  ];
  if (!lng || !lat) {
    return;
  }
  return await sampleTerrainHeight(scene, lng, lat);
}

const halfHeight = 0.55;
const flyHeight = 0.1;
const pitchHeight = CesiumMath.toRadians(-30);
const motionHeight = CesiumMath.toRadians(10);
class AutoOrbit {
  viewer: Viewer;
  center: Cartesian3;
  range: number;
  headingOffset: number;
  animationFrameHandle: number;
  orbitStartTime: number;
  firstFlightHappened: boolean;
  mapControlsState: any;
  duration?: number = 5;
  autoOrbitActive?: boolean = false;
  easing?: (time: number) => number;
  cancelAnimation: () => void;
  locationOrbit: () => void;
  locationOrbitTick: () => void;
  raycastOrbit: () => void;
  handleLocationChange: () => void;
  handleToggleSwitchClick: () => void;

  constructor(
    viewer: Viewer,
    center: Cartesian3,
    range: number,
    headingOffset: number,
    duration: number = 5,
    easing?: (time: number) => number,
    autoOrbitActive?: boolean,
  ) {
    this.viewer = viewer;
    this.center = center;
    this.range = range;
    this.duration = duration;
    this.easing = easing;
    this.headingOffset = headingOffset;
    this.autoOrbitActive = autoOrbitActive || false;
    this.animationFrameHandle = -1;
    this.orbitStartTime = 0;
    this.firstFlightHappened = false;
    this.mapControlsState = {};
    this.cancelAnimation = () => {
      cancelAnimationFrame(this.animationFrameHandle);
      this.mapControlsState.autoRotateActive = false;
    };
    this.locationOrbit = () => {
      this.mapControlsState.autoRotateActive = true;
      this.orbitStartTime = performance.now();
      this.locationOrbitTick();
    };
    this.locationOrbitTick = () => {
      const { center, range, headingOffset } = this;
      const timeElapsed =
        ((performance.now() - this.orbitStartTime) * flyHeight) / 1000;
      const heading = timeElapsed + headingOffset;
      const pitch = pitchHeight + motionHeight * Math.sin(timeElapsed);
      const height = range + halfHeight * range * -Math.sin(timeElapsed);
      this.viewer.camera.flyToBoundingSphere(new BoundingSphere(center, 0), {
        offset: new HeadingPitchRange(heading, pitch, height),
        duration: 0,
        easingFunction: this.easing,
      });
      this.animationFrameHandle = requestAnimationFrame(this.locationOrbitTick);
    };
    this.raycastOrbit = () => {
      if (!this.viewer) return;
      const position = this.viewer.scene?.pickPosition(
        new Cartesian2(
          Math.round(this.viewer.container?.clientWidth / 2),
          Math.round(this.viewer.container?.clientHeight / 2)
        )
      );
      if (!defined(position)) {
        return;
      }

      this.mapControlsState.autoRotateActive = true;
      this.orbitStartTime = performance.now();
      const pitch = this.viewer.camera.pitch;
      const heading = this.viewer.camera.heading;
      const distance = Cartesian3.distance(
        position,
        this.viewer.camera.position
      );
      const animate = () => {
        const timeElapsed =
          ((performance.now() - this.orbitStartTime) * flyHeight) / 1000;
        let newHeading = heading + timeElapsed;
        let newPitch = pitch + motionHeight * Math.sin(timeElapsed);
        let newRange =
          distance + halfHeight * distance * -Math.sin(timeElapsed) + 800;
        this.viewer.camera.flyToBoundingSphere(
          new BoundingSphere(position, 0),
          {
            offset: new HeadingPitchRange(newHeading, newPitch, newRange),
            duration: 0,
            easingFunction: this.easing,
          }
        );
        this.animationFrameHandle = requestAnimationFrame(animate);
      };
      animate();
    };
    this.handleLocationChange = () => {
      this.cancelAnimation();
      this.flyToCurrentLocation();
    };
    this.handleToggleSwitchClick = () => {
      if (!this.mapControlsState.autoRotateActive) {
        this.raycastOrbit();
      } else {
        this.cancelAnimation();
      }
    };
  }
  async initialize() {}
  public start() {
    this.flyToCurrentLocation();
    //this.mapControlsState.showMapControls = false;
    //this.mapControlsState.autoRotateActive = false;
    //this.removeAnimationCancelEventListener();
    //this.addAnimationCancelEventListener();
    //this.mapControlsState.showMapControls = true;
    //this.locationOrbit();
    //if(!this.firstFlightHappened) {this.firstFlightHappened = true;}
  }
  public stop() {
    this.cancelAnimation();
    this.removeAnimationCancelEventListener();
  }

  public flyToCurrentLocation() {
    const { center, range, headingOffset } = this;
    this.mapControlsState.showMapControls = false;
    this.mapControlsState.autoRotateActive = false;
    this.removeAnimationCancelEventListener();
    this.viewer.camera.flyToBoundingSphere(new BoundingSphere(center, 0), {
      offset: new HeadingPitchRange(headingOffset, pitchHeight, range),
      complete: () => {
        if(this.autoOrbitActive){
          this.addAnimationCancelEventListener();
          this.mapControlsState.showMapControls = true;
          this.locationOrbit();
        }
      },
      duration: this.firstFlightHappened ? 5 : this.duration, // default duration: 5
      easingFunction: this.easing,
    });
    if (!this.firstFlightHappened) {
      this.firstFlightHappened = true;
    }
  }
  public addAnimationCancelEventListener() {
    this.viewer.container.addEventListener("pointerdown", this.cancelAnimation);
    this.viewer.container.addEventListener("wheel", this.cancelAnimation);
  }
  public removeAnimationCancelEventListener() {
    this.viewer.container.removeEventListener(
      "pointerdown",
      this.cancelAnimation
    );
    this.viewer.container.removeEventListener("wheel", this.cancelAnimation);
  }
}

export const autoOrbit = (
  viewer?: Viewer | undefined,
  camera?: {
    /** degrees */
    lat?: number;
    /** degrees */
    lng?: number;
    /** meters */
    height?: number;
    /** radians */
    heading?: number;
    /** radians */
    pitch?: number;
    /** radians */
    range?: number;
    /** Field of view expressed in radians */
    fov?: number;
  },
  options?: {
    /** Seconds */
    duration?: number;
    easing?: (time: number) => number;
  } & {autoOrbit?: boolean}
):
  | {
      stopOrbit: () => void;
      handleToggleOrbit: () => void;
    }
  | undefined
  | void => {
  if (!viewer || viewer.isDestroyed() || !viewer.camera || !viewer.scene || !camera)
    return;

  const position =
    typeof camera.lat === "number" &&
    typeof camera.lng === "number" &&
    typeof camera.height === "number"
      ? Cartesian3.fromDegrees(camera.lng, camera.lat, camera.height)
      : undefined;
  if (!defined(position) || !position) return;

  const autoOrbitInstance = new AutoOrbit(
    viewer,
    position,
    camera.range || 800,
    camera.heading || 0,
    options?.duration,
    options?.easing,
    options?.autoOrbit,
  );
  autoOrbitInstance.start();
  return {
    stopOrbit: () => {
      autoOrbitInstance.stop();
    },
    handleToggleOrbit: () => {
      autoOrbitInstance.handleToggleSwitchClick();
    },
  };
};
