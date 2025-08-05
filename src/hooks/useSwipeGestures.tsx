import { useState, useRef } from 'react';

interface SwipeGesture {
  LEFT: string;
  RIGHT: string;
  UP: string;
  DOWN: string;
}

interface SwipeCallbacks {
  onSwipeLeft?: (id: string) => void;
  onSwipeRight?: (id: string) => void;
  onSwipeUp?: (id: string) => void;
  onSwipeDown?: (id: string) => void;
}

export const useSwipeGestures = (id: string, callbacks: SwipeCallbacks) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const swipeActions: SwipeGesture = {
    LEFT: 'Pass (bỏ qua)',
    RIGHT: 'Challenge (thách đấu)',
    UP: 'Super Like (quan tâm đặc biệt)',
    DOWN: 'View Profile (xem hồ sơ)',
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setCurrentX(touch.clientX);
    setCurrentY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating) return;

    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    setCurrentY(touch.clientY);
  };

  const handleTouchEnd = () => {
    if (isAnimating) return;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const threshold = 50;

    // Determine swipe direction based on largest delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          handleSwipe('RIGHT');
        } else {
          handleSwipe('LEFT');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY < 0) {
          handleSwipe('UP');
        } else {
          handleSwipe('DOWN');
        }
      }
    }

    // Reset position
    setCurrentX(startX);
    setCurrentY(startY);
  };

  const handleSwipe = (direction: keyof SwipeGesture) => {
    setIsAnimating(true);
    setSwipeDirection(direction);

    // ...removed console.log(`Swiped ${direction}: ${swipeActions[direction]}`)

    setTimeout(() => {
      switch (direction) {
        case 'LEFT':
          callbacks.onSwipeLeft?.(id);
          break;
        case 'RIGHT':
          callbacks.onSwipeRight?.(id);
          break;
        case 'UP':
          callbacks.onSwipeUp?.(id);
          break;
        case 'DOWN':
          callbacks.onSwipeDown?.(id);
          break;
      }

      setIsAnimating(false);
      setSwipeDirection(null);
    }, 300);
  };

  const getSwipeTransform = () => {
    if (isAnimating && swipeDirection) {
      switch (swipeDirection) {
        case 'LEFT':
          return 'translateX(-100%)';
        case 'RIGHT':
          return 'translateX(100%)';
        case 'UP':
          return 'translateY(-100%)';
        case 'DOWN':
          return 'translateY(100%)';
      }
    }

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    return `translate(${deltaX * 0.1}px, ${deltaY * 0.1}px)`;
  };

  return {
    swipeActions,
    isAnimating,
    swipeDirection,
    getSwipeTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleSwipe,
  };
};
