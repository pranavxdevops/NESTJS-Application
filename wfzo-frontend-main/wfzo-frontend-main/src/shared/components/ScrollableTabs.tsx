import clsx from 'clsx';
import LightButton from '@/shared/components/LightButton';
import LightPressButton from '@/shared/components/LightPressButton';

type TabOption = {
  label: string;
  value: string;
};

type ScrollableTabsProps = {
  options: TabOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  tabClassName?: string;
};

export default function ScrollableTabs({
  options,
  value,
  onValueChange,
  className,
  tabClassName,
}: ScrollableTabsProps) {
  return (
    <div className={clsx('w-full overflow-x-auto scrollbar-hidden', className)}>
      <div className={clsx('flex gap-2 items-center rounded min-w-max', tabClassName)}>
        {options.map((option) => {
          const isActive = option.value === value;
          if (isActive) {
            return (
              <LightPressButton
                key={option.value}
                onClick={() => onValueChange(option.value)}
                baseClassName="rounded-[11px] px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base whitespace-nowrap flex-shrink-0"
              >
                {option.label}
              </LightPressButton>
            );
          }
          return (
            <LightButton
              key={option.value}
              onClick={() => onValueChange(option.value)}
              className="font-source text-[#4D4D4D] rounded-[11px] px-2 py-1.5 hover:text-wfzo-gold-600 hover:bg-wfzo-gold-100 hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out text-sm md:text-base md:px-3 md:py-2 whitespace-nowrap flex-shrink-0"
            >
              {option.label}
            </LightButton>
          );
        })}
      </div>
    </div>
  );
}
