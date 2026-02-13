import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>  {
  children: ReactNode; // anything inside the button
}

export default function GoldButton({ children, ...props }: GoldButtonProps) {
  const baseClasses = `
    flex items-center justify-center gap-2 px-1.5 py-1.5 rounded-[11px] 
    border-t border-r border-l border-wfzo-gold-500 
    bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500
    hover:from-wfzo-gold-800 hover:to-wfzo-gold-600 cursor-pointer
  `;

  const wrapperClasses = `
    inline-flex flex-col items-start gap-2 p-0.5 rounded-[14px]  bg-wfzo-gold-700 text-white font-source text-base font-semibold leading-6
  `;

  return (
    <button className={wrapperClasses}  {...props}>
      <div className={baseClasses}>{children}</div>
    </button>
  );
}