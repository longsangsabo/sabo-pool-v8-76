import { useRef } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = (priority: 'normal' | 'high' = 'normal') => {
    // Create audio if not exists
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.6;
    }

    // Different sounds for different priorities
    const soundUrl =
      priority === 'high'
        ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wmFYDSJjz/TPfSYGKH3M8OOVQQoWYLTp7KdUFAk+muD4w2JYCBxdv+TLqC4IJG3R8d+TRQwYY7fo7K5YHARb0dHU2aM9AABZ1dH3z6A+AApa1tDNzJ4+AAVXy+HLfTAIIm2u4NanSSMFnVF3uYd9yCsL8BLO09Khxxa2Gf8='
        : 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wmFY';

    audioRef.current.src = soundUrl;

    // Play sound with error handling
    audioRef.current.play().catch(error => {
      console.log('Could not play notification sound:', error);
    });
  };

  return { playNotificationSound };
};
