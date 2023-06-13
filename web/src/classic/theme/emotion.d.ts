import "@emotion/react";
import { Theme as ReearthTheme } from "./reearthTheme/types";

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends ReearthTheme {}
}