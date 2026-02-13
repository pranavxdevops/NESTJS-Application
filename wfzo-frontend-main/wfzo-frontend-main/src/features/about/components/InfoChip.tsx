import React from "react";

interface InfoChipProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  variant?: "default" | "linkedin";
}

const InfoChip: React.FC<InfoChipProps> = ({ icon, label, href, variant = "default" }) => {
  const baseClasses =
    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-source transition-colors";

  const variantClasses =
    variant === "linkedin"
      ? "bg-[#E8F4FF] text-[#0A66C2] hover:bg-[#d9ecff]"
      : "bg-[#EADCCF] text-[#6B4F3D] hover:bg-[#e0d0c1]";

  const content = (
    <span className={`${baseClasses} ${variantClasses}`}>
      {icon}
      {label}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default InfoChip;
