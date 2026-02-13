import React, { ReactNode } from "react";

interface LightButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode; // anything inside
}

export default function LightButton({ children,...props }: LightButtonProps) {
  const baseClasses = ` inline-flex gap-1
    font-source text-base leading-6 font-semibold text-wfzo-gold-600
    px-4 py-1.5 rounded-[11px]
    border-t border-r border-l border-wfzo-gold-25
    bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25
    transition-colors duration-200
    hover:from-wfzo-gold-200 hover:to-wfzo-gold-50 cursor-pointer
    disabled:cursor-not-allowed
  `;

  return <button className={baseClasses}{...props}>{children}</button>;
}
