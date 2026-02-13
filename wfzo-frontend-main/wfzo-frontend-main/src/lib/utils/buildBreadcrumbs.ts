import { BreadcrumbItem } from "@/shared/components/Breadcrumb";

function titleize(segment: string): string {
  return decodeURIComponent(segment)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
export function buildBreadcrumbs(
  fullPath: string,
  options?: {
    includeHome?: boolean;
    homeLabel?: string;
    basePrefix?: string; // e.g. "/en"
    currentLabelOverride?: string; // if provided, replaces last label
    trailingItem?: {
      label: string;
      href?: string;
    };
  }

): BreadcrumbItem[] {
  const includeHome = options?.includeHome ?? true;
  const homeLabel = options?.homeLabel ?? 'Home';
  const basePrefix = options?.basePrefix ?? '';
  const currentLabelOverride = options?.currentLabelOverride;
  const trailingItem = options?.trailingItem;

  const sanitized = (fullPath || '/').trim();
  const parts = sanitized.split('/').filter(Boolean); // remove empty segments

  const items: BreadcrumbItem[] = [];
  if (includeHome) {
    items.push({ isHome: true, label: homeLabel, href: basePrefix || '/' });
  }

  let accum = '';
  const noLinkLabels = ['About Us', 'Membership', 'Events', 'Knowledge', 'News and Publications']; // Labels you don't want to link

  parts.forEach((seg, idx) => {
    accum += `/${seg}`;
    const isLast = idx === parts.length - 1 && !trailingItem; // last only if not adding extra
    const label = isLast && currentLabelOverride ? currentLabelOverride : titleize(seg);

    const shouldLink = !isLast && !noLinkLabels.includes(label); // Only link if not last and not excluded

    items.push({
      label,
      href: shouldLink ? `${basePrefix}${accum}` : undefined,
      isCurrent: isLast,
    });
  });

  if (trailingItem) {
    items.push({
      label: trailingItem.label,
      href: trailingItem.href,
      isCurrent: true,
    });
  }

  return items;
}
