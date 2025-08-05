import React from 'react';

interface RegistrationStatusBadgeProps {
  registration: {
    registration_status: string;
  };
}

export const RegistrationStatusBadge: React.FC<
  RegistrationStatusBadgeProps
> = ({ registration }) => {
  const statusConfig = {
    pending: {
      text: 'Đợi xác nhận',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⏳',
    },
    confirmed: {
      text: 'Đã xác nhận',
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: '✅',
    },
    cancelled: {
      text: 'Đã hủy',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '❌',
    },
  };

  const config =
    statusConfig[
      registration.registration_status as keyof typeof statusConfig
    ] || statusConfig.pending;

  return (
    <span
      className={`
      inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border
      ${config.color}
    `}
    >
      <span className='mr-1'>{config.icon}</span>
      {config.text}
    </span>
  );
};
