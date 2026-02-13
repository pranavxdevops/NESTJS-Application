import { cn } from "@/lib/utils/cn";
import { ReactNode } from "react";

interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export default function SidebarSection({
  title,
  children,
  className,
  action,
  ...props
}: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 p-8 rounded-[20px]",
        "border border-wfzo-gold-200 bg-wfzo-gold-50",
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="font-source text-xl font-normal leading-6 text-wfzo-grey-900">
          {title}
        </h3>
      )}

      <div className="flex flex-col gap-4">
        {children}
      </div>

      {action && action}
    </div>
  );
}
