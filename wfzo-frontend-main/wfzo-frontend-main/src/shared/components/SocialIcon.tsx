interface SocialIconProps {
  icon: React.ReactNode;
}

export default function SocialIcon({ icon }: SocialIconProps) {
  return (
    <div className="w-6 h-6  rounded-sm flex items-center justify-center hover:text-zinc-800 transition-colors cursor-pointer">
      {icon}
    </div>
  );
}