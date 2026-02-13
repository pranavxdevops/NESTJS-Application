import React from 'react';

export interface DisabledButtonProps {
  children: React.ReactNode;
  [key: string]: any;
}

export default function DisabledButton({ children, ...props }: DisabledButtonProps) {
  const baseClasses = `
    flex items-center justify-center gap-2 px-6 py-1.5 rounded-[11px]
    border-t border-r border-l border-gray-300
    bg-gradient-to-b from-gray-400 to-gray-300
  `;

  const wrapperClasses = `
    inline-flex flex-col items-start gap-2 p-0.5 rounded-xl bg-gray-400 text-gray-600 font-source text-base font-semibold leading-6
  `;

  return (
    <button className={wrapperClasses} disabled {...props}>
      <div className={baseClasses}>{children}</div>
    </button>
  );
}
