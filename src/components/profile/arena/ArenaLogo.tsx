import React from 'react';

export const ArenaLogo: React.FC = () => {
  return (
    <div className="sabo-arena-header-fixed">
      <img 
        src="/lovable-uploads/5edec650-8645-4f77-a54a-e6d9bfc42ee6.png" 
        alt="SABO ARENA"
        className="h-12 w-auto object-contain"
        onError={(e) => {
          console.error('Logo image failed to load');
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden flex items-center gap-3">
        <span className="logo-text">SABO</span>
        <div className="logo-center-icon">
          <div className="sabo-triangle-icon"></div>
        </div>
        <span className="logo-text">ARENA</span>
      </div>
    </div>
  );
};