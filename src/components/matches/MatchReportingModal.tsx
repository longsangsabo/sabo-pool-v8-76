import React from 'react';
import { DisabledMatchComponent } from './DisabledMatchComponent';

interface MatchReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onReportSubmitted: () => void;
}

export const MatchReportingModal = (props: MatchReportingModalProps) => {
  if (!props.isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full'>
        <DisabledMatchComponent title='Match Reporting Modal' />
        <button
          onClick={props.onClose}
          className='mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300'
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
