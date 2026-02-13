import { Link } from "i18n/navigation";
import { Home, ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label?: string;
  href?: string;
  isHome?: boolean;
  isCurrent?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-0" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="flex items-center px-1 py-0 rounded">
            {item.isHome ? (
              !item.isCurrent && item.href ? (
                <Link href={item.href as any} aria-label="Home" className="inline-flex">
                  <Home className="w-4 h-4 text-neutral-900" />
                </Link>
              ) : (
                <Home className="w-4 h-4 text-neutral-900" />
              )
            ) : !item.isCurrent && item.href ? (
              <Link
                href={item.href as any}
                className="text-xs font-source-sans font-normal text-neutral-900 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-xs font-source-sans ${
                  item.isCurrent
                    ? "font-bold text-neutral-900"
                    : "font-normal text-neutral-900"
                }`}
              >
                {item.label}
              </span>
            )}
          </div>
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 text-neutral-900 mx-0" />            
          )}
        </div>
      ))}
    </nav>
  );
}
