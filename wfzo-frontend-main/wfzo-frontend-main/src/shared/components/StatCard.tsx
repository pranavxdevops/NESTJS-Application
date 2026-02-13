import AnimatedCounter from "./AnimatedCounter";

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  isMobile?: boolean;
}

export default function StatCard({ icon, value, label, suffix, isMobile = false }: StatCardProps) {
  return (
    <div className={isMobile ? 'flex flex-col items-center gap-2 text-center' : 'flex items-center gap-4'}>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl border-4 border-wfzo-gold-200 bg-wfzo-gold-100 text-wfzo-gold-500 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-montserrat font-extrabold text-wfzo-grey-900">
          <AnimatedCounter end={value} duration={5000} />{suffix ?? ''}
        </div>
        <div className="text-lg font-source text-wfzo-grey-700">
          {label}
        </div>
      </div>
    </div>
  );
}