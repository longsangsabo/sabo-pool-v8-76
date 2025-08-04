import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ClubNavigationDesktop } from '../desktop/ClubNavigationDesktop';
import { ClubNavigationMobile } from '../mobile/ClubNavigationMobile';

interface ClubNavigationProps {
  clubId: string;
}

export const ClubNavigation = ({ clubId }: ClubNavigationProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return <ClubNavigationMobile clubId={clubId} />;
  }

  return <ClubNavigationDesktop clubId={clubId} />;
};
