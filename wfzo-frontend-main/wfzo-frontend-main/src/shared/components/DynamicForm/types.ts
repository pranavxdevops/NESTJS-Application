export interface FormFieldTranslation {
  language: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  value?: string;
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'phone'
  | 'dropdown'
  | 'checkbox'
  | 'button'
  | 'textarea'
  | 'file'
  | 'infoSection';

export interface FormField {
  fieldKey: string;
  fieldType: FormFieldType;
  section: string;
  subSection?: string;
  translations: FormFieldTranslation[];
  dropdownCategory?: string;
  displayOrder: number;
  fieldsPerRow?: number;
  value?: string;
  helpText?: string;
  required?: boolean;
}

export interface DropdownValue {
  category: string;
  code: string;
  label: string;
  displayOrder: number;
}

export type FormValue = string | boolean | File | null;

export interface FormFieldGroup {
  key: string;
  label: string;
  fields: FormField[];
  fieldsPerRow: number;
}

export interface FormSection {
  key: string;
  label: string;
  groups: FormFieldGroup[];
}

export interface DynamicFormProps {
  fields: FormField[];
  dropdownOptions: Record<string, DropdownValue[]>;
  initialValues?: Record<string, FormValue>;
  onSubmit: (values: Record<string, FormValue>) => Promise<void>;
  submitButtonText?: string;
  isSubmitting?: boolean;
  locale?: string;
  sectionLabels?: Record<string, string>;
  subsectionLabels?: Record<string, string>;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  isDisabled?: boolean;
  onSave?: (values: Record<string, any>) => void;
  saveButtonText?: string;
  isSaving?:boolean;
  externalErrors?: Record<string, string>;
  onExternalErrorClear?: (key: string) => void;
  admissionCriteriaContent?: string;
  onFieldChange?: (fieldKey: string, value: FormValue) => void;
  memberId?: string;
}

export interface FieldRendererProps {
  field: FormField;
  value: FormValue;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  dropdownOptions?: DropdownValue[];
  onChange: (value: FormValue) => void;
  onBlur: () => void;
  translation: FormFieldTranslation;
  onExternalErrorClear?: (key: string) => void;
  required?: boolean;
  admissionCriteriaContent?: string;
  memberId?: string;
}
