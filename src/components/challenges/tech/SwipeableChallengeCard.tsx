import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { TechCard } from '@/components/ui/sabo-tech-global';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  challenger: {
    name: string;
    avatar: string;
    rank: string;
    winRate: number;
    totalMatches: number;
  };
  type: 'ranked' | 'casual' | 'tournament';
  stakes: number;
  handicap: {
    challenger: number;
    opponent: number;
  };
  timeRemaining: string;
  message: string;
}

interface SwipeableChallengeCardProps {
  challenge: Challenge;
  onSwipe: (direction: 'left' | 'right', challengeId: string) => void;
  onAccept: () => void;
  onReject: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const SwipeableChallengeCard: React.FC<SwipeableChallengeCardProps> = ({
  challenge,
  onSwipe,
  onAccept,
  onReject,
  style,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const rotation = newX * 0.1; // Convert drag to rotation

    cardRef.current.style.transform = `translateX(${newX}px) rotate(${rotation}deg)`;

    // Determine swipe direction
    if (Math.abs(newX) > 50) {
      setSwipeDirection(newX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const dragDistance = Math.abs(parseFloat(cardRef.current.style.transform.match(/translateX\(([^)]+)/)?.[1] || '0'));

    if (dragDistance > 100 && swipeDirection) {
      // Complete the swipe
      onSwipe(swipeDirection, challenge.id);
      cardRef.current.classList.add(`swipe-${swipeDirection}`);
    } else {
      // Return to center
      cardRef.current.style.transform = 'translateX(0) rotate(0deg)';
      setSwipeDirection(null);
    }

    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ranked': return 'tech-card-ranked';
      case 'casual': return 'tech-card-casual';
      case 'tournament': return 'tech-card-tournament';
      default: return '';
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'sabo-tech-card tech-card-active tech-card-interactive',
        'tech-challenge-card swipeable',
        getTypeColor(challenge.type),
        isDragging && 'swiping',
        className
      )}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <div className="tech-card-border"></div>
      <div className="tech-card-content">
      {/* Challenge Header */}
      <div className="challenge-card-header">
        <div className="challenger-info">
          <div className="challenger-avatar-tech">
            <img src={challenge.challenger.avatar} alt={challenge.challenger.name} />
            <div className="avatar-rank-badge">{challenge.challenger.rank}</div>
          </div>
          <div className="challenger-details">
            <div className="challenger-name">{challenge.challenger.name}</div>
            <div className="challenger-stats">
              <span className="win-rate">{challenge.challenger.winRate}% thắng</span>
              <span className="total-matches">{challenge.challenger.totalMatches} trận</span>
            </div>
          </div>
        </div>
        
        <div className="challenge-type-badge" data-type={challenge.type}>
          <div className="type-glow"></div>
          <span className="type-text">{challenge.type.toUpperCase()}</span>
        </div>
      </div>

      {/* Challenge Details */}
      <div className="challenge-details-section">
        <div className="challenge-stakes">
          <div className="stakes-label">TIỀN CƯỢC</div>
          <div className="stakes-amount">{challenge.stakes.toLocaleString('vi-VN')} VND</div>
        </div>
        
        <div className="challenge-handicap">
          <div className="handicap-label">HANDICAP</div>
          <div className="handicap-display">
            <span className="handicap-challenger">{challenge.handicap.challenger}</span>
            <span className="handicap-vs">VS</span>
            <span className="handicap-opponent">{challenge.handicap.opponent}</span>
          </div>
        </div>
        
        <div className="challenge-time-limit">
          <Clock className="w-4 h-4" />
          <span>Hết hạn sau {challenge.timeRemaining}</span>
        </div>
      </div>

      {/* Challenge Message */}
      <div className="challenge-message">
        <div className="message-bubble">
          <p>"{challenge.message}"</p>
        </div>
      </div>

      {/* Swipe Hints */}
      <div className="challenge-swipe-actions">
        <div className="swipe-hint-left">
          <X className="w-6 h-6" />
          <span>TỪ CHỐI</span>
        </div>
        <div className="swipe-hint-right">
          <Check className="w-6 h-6" />
          <span>CHẤP NHẬN</span>
        </div>
      </div>
      </div>
      <div className="tech-card-corners"></div>
    </div>
  );
};