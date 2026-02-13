'use client';

import Modal from '../../../../shared/components/Modal';
import { Calendar, Network } from 'lucide-react';

interface CreateEventWebinarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent?: () => void;
  onSelectWebinar?: () => void;
}

export default function CreateEventWebinarModal({
  isOpen,
  onClose,
  onSelectEvent,
  onSelectWebinar,
}: CreateEventWebinarModalProps) {
  const handleEventClick = () => {
    onSelectEvent?.();
    onClose();
  };

  const handleWebinarClick = () => {
    onSelectWebinar?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[379px]">
      <div className="flex w-full px-8 pb-8 pt-4 flex-col justify-center items-start gap-6 bg-white rounded-b-[25px]">
        <div className="flex items-center gap-6 self-stretch">
          <button
            onClick={handleEventClick}
            className="flex flex-1 px-3 py-4 flex-col justify-center items-center rounded-xl bg-wfzo-gold-100 hover:bg-wfzo-gold-200 transition-colors"
          >
            <Calendar className="w-6 h-6 text-wfzo-gold-600" />
            <span className="font-source text-base font-semibold leading-6 text-wfzo-gold-600 mt-2">
              Advertise Event
            </span>
          </button>

          <button
            onClick={handleWebinarClick}
            className="flex flex-1 px-3 py-4 flex-col justify-center items-center rounded-xl bg-wfzo-gold-100 hover:bg-wfzo-gold-200 transition-colors"
          >
            <Network className="w-6 h-6 text-wfzo-gold-600" />
            <span className="font-source text-base font-semibold leading-6 text-wfzo-gold-600 mt-2">
              Post Webinar
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
