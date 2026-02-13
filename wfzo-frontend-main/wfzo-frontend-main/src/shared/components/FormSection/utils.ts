import type { FormField, FormSectionData, FormFieldGroup } from './types';

const SECTION_LABELS: Record<string, string> = {
  organizationInformation: 'Organization Details',
  userInformation: 'Personal Details',
  consent: '',
};

const SUBSECTION_LABELS: Record<string, string> = {
  primaryContact: 'Primary Contact',
  organizationInformation: 'Organization Contact',
};

function formatKeyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function buildSections(
  fields: FormField[],
  labelOverrides?: Record<string, string>
): FormSectionData[] {
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  const sections = new Map<
    string,
    { label: string; groups: Map<string, FormFieldGroup> }
  >();

  sortedFields.forEach((field) => {
    const sectionKey = field.section || 'general';
    if (!sections.has(sectionKey)) {
      sections.set(sectionKey, {
        label:
          (labelOverrides && labelOverrides[sectionKey]) ||
          SECTION_LABELS[sectionKey] ||
          formatKeyToLabel(sectionKey),
        groups: new Map<string, FormFieldGroup>(),
      });
    }

    const section = sections.get(sectionKey)!;
    const groupKey = field.subSection ?? '_root';
    if (!section.groups.has(groupKey)) {
      section.groups.set(groupKey, {
        key: groupKey,
        label:
          groupKey === '_root'
            ? ''
            : SUBSECTION_LABELS[groupKey] || formatKeyToLabel(groupKey),
        fields: [],
        fieldsPerRow: field.fieldsPerRow || 1,
      });
    }
    section.groups.get(groupKey)!.fields.push(field);
  });

  return Array.from(sections.entries())
    .map<FormSectionData>(([key, value]) => ({
      key,
      label: value.label,
      groups: Array.from(value.groups.values()).map((group) => ({
        ...group,
        fields: [...group.fields].sort((a, b) => a.displayOrder - b.displayOrder),
      })),
    }))
    .sort((a, b) => {
      const aOrder = a.groups[0]?.fields[0]?.displayOrder ?? 0;
      const bOrder = b.groups[0]?.fields[0]?.displayOrder ?? 0;
      return aOrder - bOrder;
    })
    .map((section) => ({
      ...section,
      groups: section.groups.sort((a, b) => {
        const aOrder = a.fields[0]?.displayOrder ?? 0;
        const bOrder = b.fields[0]?.displayOrder ?? 0;
        return aOrder - bOrder;
      }),
    }));
}

export { SECTION_LABELS, SUBSECTION_LABELS, formatKeyToLabel };
