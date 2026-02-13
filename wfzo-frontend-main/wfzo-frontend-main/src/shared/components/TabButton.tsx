interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-source transition-colors whitespace-nowrap ${
        isActive
          ? 'bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25 border border-wfzo-gold-25 text-wfzo-gold-600 font-semibold'
          : 'text-wfzo-grey-700 hover:text-wfzo-gold-600'
      }`}
    >
      {label}
    </button>
  );
}