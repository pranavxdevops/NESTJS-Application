import React, { ButtonHTMLAttributes } from "react";

interface SearchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function SearchButton({ children = "Search", ...props }: SearchButtonProps) {
  const wrapperClasses = `
    inline-flex flex-col items-start gap-2 p-0.5 pb-[2px] pt-px rounded-xl 
    bg-[#684F31] cursor-pointer transition-opacity hover:opacity-90
  `;

  const innerClasses = `
    flex items-center justify-center gap-2 px-6 py-[7px] pb-[6px] rounded-[11px]
    border-t border-r border-l border-[#9B7548]
    bg-gradient-to-b from-[#684F31] to-[#9B7548]
    text-white font-source text-base font-semibold leading-6
  `;

  return (
    <button className={wrapperClasses} {...props}>
      <div className={innerClasses}>
        {children}
      </div>
    </button>
  );
}
