// "use client";

// import React, { useState } from 'react';
// import Modal from '@/shared/components/Modal';

// interface ReportBlockModalProps {
//   isOpen: boolean;
//   isBlocked: boolean;
//   isOrganization: boolean;
//   onClose: () => void;
//   onSubmit: (type: 'report' | 'block' | 'unblock', reason?: string) => void;
// }

// const REPORT_REASONS = [
//   'Spam or misleading content',
//   'Harassment or bullying',
//   'Inappropriate content',
//   'Fake profile or impersonation',
//   'Other',
// ];

// const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
//   isOpen,
//   isBlocked,
//   isOrganization,
//   onClose,
//   onSubmit,
// }) => {
//   const [currentStep, setCurrentStep] = useState<'initial' | 'report'>('initial');
//   const [selectedReason, setSelectedReason] = useState('');

//   const handleClose = () => {
//     setCurrentStep('initial');
//     setSelectedReason('');
//     onClose();
//   };

//   const handleReport = () => {
//     setCurrentStep('report');
//   };

//   const handleBlock = () => {
//     onSubmit('block');
//     handleClose();
//   };

//   const handleUnblock = () => {
//     onSubmit('unblock');
//     handleClose();
//   };

//   const handleSubmitReport = () => {
//     if (selectedReason.trim()) {
//       onSubmit('report', selectedReason.trim());
//       handleClose();
//     }
//   };

//   if (currentStep === 'report') {
//     return (
//       <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[700px]">
//         <div className="flex flex-col gap-6 p-8 w-full">
//           <div>
//             <h2 className="font-source text-2xl font-bold leading-7 text-wfzo-grey-900 mb-2">
//               Report
//             </h2>
//             <p className="font-source text-base font-normal leading-6 text-wfzo-grey-700">
//              Reason for reporting {isOrganization ? 'organization' : 'user'}?
//             </p>
//           </div>

//           {/* Text Area */}
//           <div className="relative">
//             <textarea
//               value={selectedReason}
//               onChange={(e) => setSelectedReason(e.target.value)}
//               maxLength={256}
//               placeholder="Please describe the reason for reporting..."
//               rows={5}
//               className="w-full px-4 py-3 border border-wfzo-gold-400 rounded-xl font-source text-base text-wfzo-grey-900 placeholder:text-wfzo-grey-500 focus:outline-none focus:ring-2 focus:ring-wfzo-gold-500 focus:border-wfzo-gold-500 resize-none"
//             />
//             <div className="absolute bottom-3 right-4 text-xs text-wfzo-grey-500 font-source">
//               {256 - selectedReason.length} characters left
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-3 pt-2 ">
//             <button
//               onClick={handleSubmitReport}
//               disabled={!selectedReason.trim()}
//               className="flex-1 px-6 py-3 rounded-xl bg-wfzo-gold-600 font-source text-base font-semibold leading-6 text-white hover:bg-wfzo-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[150px]"
//             >
//               Report & Block
//             </button>
//           </div>
//         </div>
//       </Modal>
//     );
//   }

//   // Initial screen with Report/Block or Report/Unblock options
//   return (
//     <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[500px]">
//       <div className="flex flex-col gap-6 p-8">
//         <div>
//           <h2 className="font-source text-2xl font-bold leading-7 text-wfzo-grey-900 mb-2">
//             {isBlocked ? 'Report or Unblock' : 'Report or Block'}
//           </h2>
//           <p className="font-source text-base font-normal leading-6 text-wfzo-grey-700">
//             Choose an action for this {isOrganization ? 'organization' : 'user'}
//           </p>
//         </div>

//         {/* Actions */}
//         <div className="flex gap-3 pt-2">
//           <button
//             onClick={handleReport}
//             className="flex-1 px-6 py-3 rounded-xl border-2 border-wfzo-gold-600 bg-transparent font-source text-base font-semibold leading-6 text-wfzo-gold-600 hover:bg-wfzo-gold-50 transition-colors"
//           >
//             Report
//           </button>
//           <button
//             onClick={isBlocked ? handleUnblock : handleBlock}
//             className={`flex-1 px-6 py-3 rounded-xl font-source text-base font-semibold leading-6 text-white transition-colors ${
//               isBlocked
//                 ? 'bg-wfzo-gold-600 hover:bg-wfzo-gold-700'
//                 : 'bg-red-600 hover:bg-red-700'
//             }`}
//           >
//             {isBlocked ? 'Unblock' : 'Block'}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default ReportBlockModal;
"use client";

import React, { useState } from 'react';
import Modal from '@/shared/components/Modal';
import GoldButton from '@/shared/components/GoldButton';

interface ReportBlockModalProps {
  isOpen: boolean;
  isBlocked: boolean;
  isOrganization: boolean;
  name?: string; // Organization name or user name
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (type: 'report' | 'block' | 'unblock', reason?: string) => void;
}

const REPORT_REASONS = [
  'Spam or misleading content',
  'Harassment or bullying',
  'Inappropriate content',
  'Fake profile or impersonation',
  'Other',
];

const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
  isOpen,
  isBlocked,
  isOrganization,
  name,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [currentStep, setCurrentStep] = useState<'initial' | 'report'>('initial');
  const [selectedReason, setSelectedReason] = useState('');

  const handleClose = () => {
    setCurrentStep('initial');
    setSelectedReason('');
    onClose();
  };

  const handleReport = () => {
    setCurrentStep('report');
  };

  const handleBlock = () => {
    onSubmit('block');
    handleClose();
  };

  const handleUnblock = () => {
    onSubmit('unblock');
    handleClose();
  };

  const handleSubmitReport = () => {
    if (selectedReason.trim()) {
      onSubmit('report', selectedReason.trim());
     
    }
  };

  if (currentStep === 'report') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Report & Block" className="w-full max-w-[800px]">
        <div className="flex flex-col gap-6 p-8 w-full">
          <div>
            <h2 className="font-source text-2xl font-bold leading-7 text-wfzo-grey-900 mb-2">
              Report
            </h2>
            <p className="font-source text-base font-normal leading-6 text-wfzo-grey-700">
             Reason for reporting <span className="font-bold">{name || (isOrganization ? 'this organization' : 'this user')} </span>*?
            </p>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              maxLength={256}
              placeholder="Why do you want to repost this user?"
              rows={5}
              className="w-full px-4 py-3 border border-wfzo-gold-400 rounded-xl font-source text-base text-wfzo-grey-900 placeholder:text-wfzo-grey-500 focus:outline-none focus:ring-2 focus:ring-wfzo-gold-500 focus:border-wfzo-gold-500 resize-none"
            />
            <div className="absolute  left-4 text-xs text-wfzo-grey-500 font-source">
              {256 - selectedReason.length} characters left
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 ">
            <GoldButton
            
              onClick={handleSubmitReport}
              disabled={!selectedReason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Report & Block User'}
            </GoldButton>
          </div>
        </div>
      </Modal>
    );
  }

  // ────────────────────────────────────────────────
  // Updated INITIAL screen — matching the latest screenshot
  // ────────────────────────────────────────────────
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Report / Block"
      className="w-full max-w-[853px] bg-transparent"
    >
      <div className="
        bg-white 
        rounded-xl 
        shadow-xl 
        w-full
        border border-gray-200/70 
        overflow-hidden
        pb-6
      ">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="font-source text-xl font-bold text-gray-900">
            Report or Block
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Block option */}
            <button
              onClick={isBlocked ? handleUnblock : handleBlock}
              className="
                w-full 
                text-left 
                px-5 py-4 
              border-b
              border-wfzo-gold-100

                rounded-lg 
                 hover:bg-gray-50 
                transition-colors 
                group
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-source font-medium text-base text-gray-900">
                    {isBlocked ? `Unblock ${name || (isOrganization ? 'Organization' : 'User')}` : `Block ${name || (isOrganization ? 'Organization' : 'User')}`}
                  </div>
                  <div className="font-source text-sm text-gray-600 mt-0.5">
                    {isBlocked 
                      ? 'Remove block restriction' 
                      : `Prevent ${name ? 'them' : (isOrganization ? 'this organization' : 'this user')} from interacting with you`}
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  →
                </span>
              </div>
            </button>

            {/* Report option */}
            <button
              onClick={handleReport}
              className="
                w-full 
                text-left 
                px-5 py-4 
                
                rounded-lg 
                hover:bg-gray-50 
                transition-colors 
                group
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-source font-medium text-base text-gray-900">
                    Report {name || (isOrganization ? 'Organization' : 'User')}
                  </div>
                  <div className="font-source text-sm text-gray-600 mt-0.5">
                    Submit a report about {name ? 'them' : (isOrganization ? 'this organization' : 'this user')}
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  →
                </span>
              </div>
            </button>
          </div>

        
        </div>
      </div>
    </Modal>
  );
};

export default ReportBlockModal;