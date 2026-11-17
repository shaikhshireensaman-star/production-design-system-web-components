import type { HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "pds-rating": HTMLAttributes<HTMLElement> & {
        label: string;
        value?: number;
        max?: number;
        "onpds-change"?: (event: CustomEvent<{ value: number }>) => void;
      };
    }
  }
}
