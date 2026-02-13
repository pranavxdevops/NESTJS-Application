'use client';

import { Plus, PlusIcon } from 'lucide-react';
import { CustomFileUploadField } from '../DynamicForm/CustomFileUploadField';
import { on } from 'events';
import GoldButton from '../GoldButton';

interface Section {
  id: string 
  title: string;
  description: string;
  imageFile: File | null;
  imagePreviewUrl: string;
  imagePosition: 'left' | 'right';
  image: number | null;
}
interface CompanyPageErrors {
  shortIntro?: string;
  companyImage?: string;
  sections?: string;
}

interface Props {
  
onChange: () => void;
  shortIntro: string;
  setShortIntro: (v: string) => void;

  companyImageFile: File | null;
  companyImagePreviewUrl: string;
  companyImageFileName: string;
  onCompanyImageSelect: (file: File) => void;
  onCompanyImageRemove: () => void;

  sections: Section[];
 setSections: React.Dispatch<React.SetStateAction<Section[]>>;
 errors?: CompanyPageErrors;
  allowPrefill?: boolean;
   isDisabled?: boolean;
}

export default function CompanyPageTab({

  shortIntro,
  setShortIntro,
  companyImageFile,
  companyImagePreviewUrl,
  companyImageFileName,
  onCompanyImageSelect,
  onCompanyImageRemove,
  sections,
  setSections,
   onChange,
   errors = {},
    isDisabled=false,
}: Props) {
  const addSection = () => {
     if (isDisabled) return;
    setSections(
      prev => [
  ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        imageFile: null,
        imagePreviewUrl: '',
        imagePosition: 'right',
        image: null,
      },
    ]);
  };

  const updateSection = (id: string | number, data: Partial<Section>) => {
    if (isDisabled) return;
    setSections(sections.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSection = (id: string | number) => {
      if (isDisabled) return;
  setSections((prev) => prev.filter((s) => s.id !== id));
  onChange();
};

  return (
    
   <div
  className={`flex flex-col gap-8 ${
    isDisabled ? 'opacity-70' : ''
  }`}
>



      {/* Page Text */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[#1A1A1A] font-montserrat text-2xl font-extrabold leading-8">
          Page Text
        </h2>

        <div className="flex flex-col gap-6">
          {/* Short Intro */}
          <div className="flex flex-col gap-1">
            <label className="text-[#333] font-source text-sm font-source leading-5">
              Short Intro*
            </label>
            <textarea
            disabled={isDisabled}
              value={shortIntro}
              onChange={(e) => {
  if (isDisabled) return;
  setShortIntro(e.target.value);
  onChange();
}}
              
              maxLength={256}
             className={`flex min-h-[120px] font-source p-3 rounded-[9px] border ${
      errors.shortIntro ? 'border-red-500' : 'border-[#DADADA]'
    }  ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
             {errors.shortIntro && (
    <p className="mt-1 text-sm text-red-500 font-source">
      {errors.shortIntro}
    </p>
  )}

            <span className="text-xs">{256 - shortIntro.length} characters left</span>
          </div>
        </div>
        <div className={`flex flex-col gap-6  
        ${isDisabled ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}
          `}>
          <label className="text-[#333] font-source text-sm font-normal leading-5">
            Upload Image*
          </label>
          <CustomFileUploadField
            disabled={isDisabled}
            label="Upload Company Image"
            previewUrl={companyImagePreviewUrl}
            fileName={companyImageFileName}
            onSelect={(file) => {
  if (isDisabled) return;
  onCompanyImageSelect(file);
}}
            onRemove={() => {
  if (isDisabled) return;
  onCompanyImageRemove();
}}
          />
          {errors.companyImage && (
  <p className="mt-1 text-sm text-red-500 font-source">
    {errors.companyImage}
  </p>
)}
        </div>
      </div>
{errors.sections && (
  <p className="text-sm text-red-500 mb-2 font-source">
    {errors.sections}
  </p>
)}
      {/* Sections */}
      {sections.map((section, index) => (
        <div key={section.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[#333] font-source text-base font-bold leading-5">
              Section {index + 1}
            </h3>

            {index > 0 && (
              <button
                disabled={isDisabled}
                type="button"
                onClick={() => {
  if (isDisabled) return;
  deleteSection(section.id);
}}
                className={`font-source text-base font-bold leading-5 cursor-pointer h-[40px] rounded-[12px] py-2 px-6 flex items-center justify-center gap-[10px] border-2 text-red-600 border-red-600 hover:bg-red-50
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}
                  `}
              >
                Delete Section
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Title */}
            <label className="text-[#333] font-source text-sm font-normal leading-5">Title</label>
            <input
            disabled={isDisabled}
              type="text"
              placeholder="Title"
              value={section.title || ''}
              onChange={(e) => {
  if (isDisabled) return;
  updateSection(section.id, { title: e.target.value });
  onChange();
}}
              className={`flex h-12 px-4 rounded-[9px] border border-[#DADADA] font-source 
                ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />

            {/* Description */}
            <label className="text-[#333] font-source text-sm font-normal leading-5 ">
              Paragraph Text*
            </label>
            <textarea
              disabled={isDisabled}
              value={section.description || ''}
              onChange={(e) => {
                 if (isDisabled) return;
                updateSection(section.id, { description: e.target.value })
            onChange();}}
              maxLength={2048}
              className={`flex min-h-[120px] p-3 rounded-[9px] border border-[#DADADA] font-source 
                ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
            />
            <span className="text-xs">
              {2048 - (section.description || '').length} characters left
            </span>

            {/* Upload Image */}
            <div  className={`flex flex-col gap-2 
    ${isDisabled ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}
  `}>
            <label className="text-[#333] font-source text-sm font-normal leading-5">
              Upload Image*
            </label>
            
            <CustomFileUploadField
            disabled={isDisabled}
              label="Upload Image"
              previewUrl={section.imagePreviewUrl}
              fileName={section.imageFile?.name ?? ''}
              onSelect={(file) =>{
                if (isDisabled) return; 
                updateSection(section.id, {
                  imageFile: file,
                  imagePreviewUrl: URL.createObjectURL(file),
                })
                onChange();
              }}

              onRemove={() =>{
                if (isDisabled) return; 
                updateSection(section.id, {
                  imageFile: null,
                  imagePreviewUrl: '',
                   image: null, 
                })
                onChange();
              }}
              
            /></div>

            {/* Image Position */}
            <div className="flex flex-col gap-1">
              <label className="text-[#333] font-source text-sm font-normal leading-5">
                Image Position
              </label>
              <select
                disabled={isDisabled}
                value={section.imagePosition ?? 'right'}
                onChange={(e) =>{
                   if (isDisabled) return;
                  updateSection(section.id, { imagePosition: e.target.value as 'left' | 'right' })
                  onChange();
                }}
                className={`flex h-12 px-4 rounded-[9px] border border-[#DADADA] font-source *
                  ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                  `}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      ))}

    {/* Add Section Button */}
      <div className={`flex-shrink-0 ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={() => {
    if (isDisabled) return;
    addSection();
  }}>
                        <GoldButton>Add Section
                          <PlusIcon className="w-6 h-6" />
                        </GoldButton>
                      </div>

{/* Review Process Text – Bottom of Page */}
<div className="font-source text-sm leading-5 text-wfzo-grey-700">
            <span className="font-bold text-wfzo-grey-800">Approval Process - </span>
            Upon submission, your company information will be reviewed by our admin team within 3-5 business days. You will be notified via email regarding the status of your submission.
          </div>

</div>
    
  );


  
}
