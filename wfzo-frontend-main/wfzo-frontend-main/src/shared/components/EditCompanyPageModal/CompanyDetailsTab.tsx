'use client';

import { FormSection } from '@/shared/components/FormSection';
import type { FormField, DropdownValue, FormValue } from '@/shared/components/FormSection/types';
import { CustomFileUploadField } from '../DynamicForm/CustomFileUploadField';

import type { Dispatch, SetStateAction } from 'react';


const READ_ONLY_KEYS = [
  'fullLegalNameOfTheOrganization',
  'primaryContactEmail',
  'primaryContactFirstName',
  'primaryContactLastName',
];

interface Props {


 onChange: () => void;
  sections: Record<string, FormField[]>;
  values: Record<string, FormValue>;
  setValues: Dispatch<SetStateAction<Record<string, FormValue>>>;
  dropdownOptions: Record<string, DropdownValue[]>;
  previewUrl: string;
  fileName: string;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;

socialLinks: {
    facebook: string;
    x: string;
    linkedin: string;
    youtube: string;
  };
setSocialLinks: (v: Props['socialLinks']) => void;

 errors?: Record<string, string>;
  touchedFields?: Record<string, boolean>;
  onBlur?: (fieldKey: string) => void;
  isDisabled?: boolean;
}

export default function CompanyDetailsTab({
  sections,
  values,
  setValues,
  dropdownOptions,
  previewUrl,
  fileName,
  onFileSelect,
  onRemoveFile,
   socialLinks,
  setSocialLinks,
  onChange,  errors = {},
  touchedFields = {},
  onBlur,
  isDisabled = false,
}: Props) {
  return (
    <div className="flex flex-col gap-8">

 {/* 🔹 FORM SECTIONS (ORDER PRESERVED) */}
      {Object.entries(sections).map(([sectionKey, sectionFields]) => {
  return (
    <div key={sectionKey} className="relative">
      <FormSection
        fields={sectionFields}
        values={values}
        errors={errors}
  touchedFields={touchedFields}
    onBlur={onBlur}
    readOnly={isDisabled}
        dropdownOptions={dropdownOptions}
       
        onValueChange={(key, value) => {
          if (READ_ONLY_KEYS.includes(key)) return; // 🔒 ignore changes
          setValues((prev) => ({ ...prev, [key]: value }));
          onChange();
          
        }}
      />

      
      
          
        </div>
     
    
  );
})}


      {/* Logo Upload */}
      <div  className={`flex flex-col gap-2 
    ${isDisabled ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}
  `}>
        <label className="text-lg font-bold">Upload Logo</label>
        <CustomFileUploadField
          label="Upload Image"
          previewUrl={previewUrl}
          fileName={fileName}
            disabled={isDisabled}
          onSelect={(file) => {
             if (isDisabled) return; 
            onFileSelect(file);
            onChange(); 
          }}
          onRemove={() => {
             if (isDisabled) return; 
            onRemoveFile();
            onChange(); 
          }}
           
        />
        
        {/* ✅ LOGO ERROR MESSAGE */}
        {touchedFields?.organizationLogo && errors?.organizationLogo && (
          <p className="text-red-500 text-xs font-source">{errors.organizationLogo}</p>
        )}
        
      </div>

{/* Company Social Links */}
      <div className="flex flex-col gap-4 font-source">
        <h3 className="text-[#333] font-source text-base font-bold leading-5">
          Company Social Links
        </h3>

        <div className="flex flex-col gap-6">
          {(['facebook', 'x', 'linkedin', 'youtube'] as const).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[#333] font-source text-sm font-normal leading-5">{key}</label>
              <input
                type="text"
                placeholder="Enter link"
                value={socialLinks[key]}
                onChange={(e) => {
                  setSocialLinks({ ...socialLinks, [key]: e.target.value });
                  onChange(); 
                }}
                onBlur={() => {
                  onBlur?.(key); 
                }}
                disabled={isDisabled} 
                 className={`flex h-12 px-4 py-1 items-center gap-2 rounded-[9px] border 
        ${touchedFields[key] && errors[key] 
          ? 'border-red-500' 
          : 'border-[#DADADA]'
        }
          ${isDisabled ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}
          `}
              />
              {touchedFields[key] && errors[key] && (
  <p className="text-red-500 text-xs font-source">
    {errors[key]}
  </p>
)}
            </div>
          ))}
          
        </div>
      </div>

    </div>
  );
}
