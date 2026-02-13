// import React from "react";

// interface LightPressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   children: React.ReactNode;
// }

// const LightPressButton = ({ children, ...props }: LightPressButtonProps) => {
//   const wrapperClasses = `group flex flex-col items-start gap-2 p-0.5 cursor-pointer rounded-xl bg-wfzo-gold-100 transition-colors duration-200 shadow-sm hover:from-wfzo-gold-100 hover:bg-wfzo-gold-100 cursor-pointer`;
//   const baseClasses = `flex items-center justify-center gap-1 px-4 py-1 rounded-[11px] border-t border-r border-l border-wfzo-gold-25 bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25 hover:from-wfzo-gold-200 group-hover:to-wfzo-gold-50`;
//   const textClasses = `font-source text-base leading-6 text-wfzo-gold-600 font-semibold group-hover:text-wfzo-gold-800`;

//   return (
//     <button className={wrapperClasses} {...props}>
//       <div className={baseClasses}>
//         <span className={`${textClasses} flex items-center`}>{children}</span>
//       </div>
//     </button>
//   );
// };

// export default LightPressButton;
import React from "react";
import clsx from "clsx";

interface LightPressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;       
  baseClassName?: string;  
  textClassName?: string;   
}

const LightPressButton = ({ children, className,
  baseClassName,
  textClassName,...props }: LightPressButtonProps) => {
  const wrapperClasses = clsx(`group gap-1 p-0.5 cursor-pointer rounded-xl bg-wfzo-gold-100 transition-colors duration-200 shadow-sm hover:from-wfzo-gold-100 hover:bg-wfzo-gold-100 cursor-pointer`,className)
  const baseClasses = clsx(`flex items-center justify-center gap-1 px-3.5 py-1 rounded-[11px] border-t border-r border-l border-wfzo-gold-25 bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25 group-hover:from-wfzo-gold-200 group-hover:to-wfzo-gold-50`,baseClassName)
  const textClasses = clsx(`font-source text-base leading-6 text-wfzo-gold-600 font-semibold group-hover:text-wfzo-gold-800`,textClassName)

  return (
    <button className={wrapperClasses} {...props}>
      <div className={baseClasses}>
        <span className={`${textClasses} flex items-center`}>{children}</span>
      </div>
    </button>
  );
};

export default LightPressButton;
