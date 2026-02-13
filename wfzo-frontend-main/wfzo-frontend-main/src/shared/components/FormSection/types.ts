export interface FieldTranslation {
  language: string;
  label: string;
  placeholder?: string;
  helpText?: string;
}

export type FieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'phone'
  | 'dropdown'
  | 'checkbox';

export interface FormField {
  fieldKey: string;
  fieldType: FieldType;
  section: string;
  subSection?: string;
  translations: FieldTranslation[];
  dropdownCategory?: string;
  displayOrder: number;
  fieldsPerRow?: number;
}

export interface DropdownValue {
  category: string;
  code: string;
  label: string;
  displayOrder: number;
}

export type FormValue = string | boolean |string[];

export interface FormFieldGroup {
  key: string;
  label: string;
  fields: FormField[];
  fieldsPerRow: number;
}

export interface FormSectionData {
  key: string;
  label: string;
  groups: FormFieldGroup[];
}

export interface FormSectionProps {
  fields: FormField[];
  values: Record<string, FormValue>;
  dropdownOptions?: Record<string, DropdownValue[]>;
  locale?: string;
  sectionLabelOverrides?: Record<string, string>;
  subsectionLabels?: Record<string, string>;
  readOnly?: boolean;
  errors?: Record<string, string>;
  touchedFields?: Record<string, boolean>;
  onValueChange?: (fieldKey: string, value: FormValue) => void;
  onBlur?: (fieldKey: string) => void;
}
