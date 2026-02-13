import React from "react";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export function CustomButton({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  children,
  className = "",
  ...props
}: CustomButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200";

  const variantClasses = {
    primary:
      "bg-gradient-to-b from-gold-700 to-gold-500 border-t border-l border-r border-gold-500 text-white shadow-md hover:shadow-lg",
    secondary:
      "bg-gradient-to-b from-gold-100 to-gold-25 border-t border-l border-r border-gold-25 text-gold-600 shadow-md hover:shadow-lg",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const wrapperClass =
    variant === "primary" ? "p-0.5 rounded-xl bg-gold-700" : "p-0.5 rounded-xl bg-gold-100";

  const buttonClass = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  return (
    <div className="relative">
      <div className={wrapperClass}>
        <button className={buttonClass} {...props}>
          {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
        </button>
      </div>
    </div>
  );
}
