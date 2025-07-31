import React from 'react';

interface MirrorAvatarProps {
  avatarUrl?: string;
  username: string;
  rank: string;
}

export const MirrorAvatar: React.FC<MirrorAvatarProps> = ({ 
  avatarUrl, 
  username,
  rank 
}) => {
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const displayAvatar = avatarUrl || defaultAvatar;

  return (
    <div className="avatar-mirror-container">
      {/* Left mirror avatars - fading */}
      <div className="avatar-mirror left">
        <img src={displayAvatar} alt={username} className="avatar-fade-3" />
        <img src={displayAvatar} alt={username} className="avatar-fade-2" />
        <img src={displayAvatar} alt={username} className="avatar-fade-1" />
      </div>
      
      {/* Center main avatar */}
      <div className="avatar-main-container">
        <div className="avatar-glow-border"></div>
        <img src={displayAvatar} alt={username} className="avatar-main" />
      </div>
      
      {/* Right mirror avatars - fading */}
      <div className="avatar-mirror right">
        <img src={displayAvatar} alt={username} className="avatar-fade-1" />
        <img src={displayAvatar} alt={username} className="avatar-fade-2" />
        <img src={displayAvatar} alt={username} className="avatar-fade-3" />
      </div>
    </div>
  );
};