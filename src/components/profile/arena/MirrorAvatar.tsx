import React from 'react';

interface MirrorAvatarProps {
  avatarUrl?: string;
  username: string;
  rank: string;
}

export const MirrorAvatar: React.FC<MirrorAvatarProps> = ({
  avatarUrl,
  username,
  rank,
}) => {
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const displayAvatar = avatarUrl || defaultAvatar;

  return (
    <div>
      <div className='avatar-mirror-container-fixed'>
        {/* Left mirror avatars - fading */}
        <div className='avatar-mirror-left'>
          <img src={displayAvatar} alt={username} className='mirror-avatar-3' />
          <img src={displayAvatar} alt={username} className='mirror-avatar-2' />
          <img src={displayAvatar} alt={username} className='mirror-avatar-1' />
        </div>

        {/* Center main avatar */}
        <div className='avatar-main-wrapper'>
          <img src={displayAvatar} alt={username} className='avatar-main' />
        </div>

        {/* Right mirror avatars - fading */}
        <div className='avatar-mirror-right'>
          <img src={displayAvatar} alt={username} className='mirror-avatar-1' />
          <img src={displayAvatar} alt={username} className='mirror-avatar-2' />
          <img src={displayAvatar} alt={username} className='mirror-avatar-3' />
        </div>
      </div>

      {/* User Info Section */}
      <div className='user-info-section'>
        <h1 className='username-display'>{username}</h1>
        <div className='rank-badge-display'>
          <span className='rank-text'>{rank}</span>
        </div>
      </div>
    </div>
  );
};
