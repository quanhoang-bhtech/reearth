import Button from "./Button";
import Menu from "./LegacyMenu";
import Navigator from "./Navigator";
import SplashScreen from "./SplashScreen";
import Storytelling from "./Storytelling";
import Timeline from "./Timeline";
import Layer from "./Layer";

import type { Component } from ".";

export const MENU_BUILTIN_WIDGET_ID = "reearth/menu"; // legacy
export const BUTTON_BUILTIN_WIDGET_ID = "reearth/button";
export const SPLASHSCREEN_BUILTIN_WIDGET_ID = "reearth/splashscreen";
export const STORYTELLING_BUILTIN_WIDGET_ID = "reearth/storytelling";
export const TIMELINE_BUILTIN_WIDGET_ID = "reearth/timeline";
export const NAVIGATOR_BUILTIN_WIDGET_ID = "reearth/navigator";
export const LAYER_BUILTIN_WIDGET_ID = "reearth/layer";

export type BuiltinWidgets<T = unknown> = Record<
  | typeof MENU_BUILTIN_WIDGET_ID
  | typeof BUTTON_BUILTIN_WIDGET_ID
  | typeof SPLASHSCREEN_BUILTIN_WIDGET_ID
  | typeof STORYTELLING_BUILTIN_WIDGET_ID
  | typeof TIMELINE_BUILTIN_WIDGET_ID
  | typeof NAVIGATOR_BUILTIN_WIDGET_ID
  | typeof LAYER_BUILTIN_WIDGET_ID,
  T
>;

const BUILTIN_WIDGET_OPTIONS: BuiltinWidgets<{ animation?: boolean }> = {
  [MENU_BUILTIN_WIDGET_ID]: {},
  [BUTTON_BUILTIN_WIDGET_ID]: {},
  [SPLASHSCREEN_BUILTIN_WIDGET_ID]: {},
  [STORYTELLING_BUILTIN_WIDGET_ID]: {},
  [TIMELINE_BUILTIN_WIDGET_ID]: {
    animation: true,
  },
  [NAVIGATOR_BUILTIN_WIDGET_ID]: {
    animation: true,
  },
  [LAYER_BUILTIN_WIDGET_ID]: {},
};

export const getBuiltinWidgetOptions = (id: string) =>
  BUILTIN_WIDGET_OPTIONS[id as keyof BuiltinWidgets];

export const isBuiltinWidget = (id: string): id is keyof BuiltinWidgets =>
  !!builtin[id as keyof BuiltinWidgets];

const builtin: BuiltinWidgets<Component> = {
  [MENU_BUILTIN_WIDGET_ID]: Menu,
  [BUTTON_BUILTIN_WIDGET_ID]: Button,
  [SPLASHSCREEN_BUILTIN_WIDGET_ID]: SplashScreen,
  [STORYTELLING_BUILTIN_WIDGET_ID]: Storytelling,
  [TIMELINE_BUILTIN_WIDGET_ID]: Timeline,
  [NAVIGATOR_BUILTIN_WIDGET_ID]: Navigator,
  [LAYER_BUILTIN_WIDGET_ID]: Layer,
};

export default builtin;
