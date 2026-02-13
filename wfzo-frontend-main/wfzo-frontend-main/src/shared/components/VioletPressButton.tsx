import React from "react";
import clsx from "clsx";

interface VioletPressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disableWrapperBg?: boolean; // optional to remove wrapper bg/shadow
  hoverBg?: string;           // optional hover for inactive highlight
  baseClassName?: string;     // optional inner div class override
  textClassName?: string;     // optional text class override
}

const VioletPressButton = ({
  children,
  disableWrapperBg,
  hoverBg = "hover:bg-[#4A1F91]", // violet hover like your Back to Top button
  className,
  baseClassName,
  textClassName,
  ...props
}: VioletPressButtonProps) => {
  const wrapperClasses = clsx(
    "flex items-center justify-center rounded-[19px] transition-all cursor-pointer",
    !disableWrapperBg && "bg-[#5527A5] shadow-[1px_0px_1px_#8959D9] border border-[#8959D9]",
    hoverBg,
    className
  );

  const innerBaseClasses = clsx(
    "flex items-center justify-center px-3.5 py-1 rounded-[19px] border-t border-r border-l border-[#8959D9] bg-gradient-to-b from-[#5527A5] to-[#8959D9]",
    baseClassName
  );

  const textClasses = clsx(
    "font-source text-sm font-normal leading-6 text-white",
    textClassName
  );

  return (
    <button className={wrapperClasses} {...props}>
      <div className={innerBaseClasses}>
        <span className={`flex items-center ${textClasses}`}>{children}</span>
      </div>
    </button>
  );
};

export default VioletPressButton;
 