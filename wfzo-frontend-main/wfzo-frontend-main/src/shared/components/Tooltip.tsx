
"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

type Position = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

export default function Tooltip({
  children,
  text,
  position = "top",
   align = "end", // desktop default = right aligned
}: {
  children: React.ReactNode;
  text: string;
  position?: Position;
  align?: Align;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span className="inline-block">{children}</span>
        </TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={position}
            align={align}
            sideOffset={6}
            collisionPadding={12} // prevents overflow
            className="
              z-[9999] px-3 py-2 text-xs sm:text-sm 
    text-white bg-black rounded shadow-lg
    max-w-[230px] sm:max-w-none 
    font-source        
    whitespace-normal sm:whitespace-nowrap
    data-[state=open]:animate-fadeIn
            "
          >
            <span className="tooltip-two-lines block text-left">
              {text}
            </span>

            <TooltipPrimitive.Arrow
              className="fill-black"
              width={12}
              height={6}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}