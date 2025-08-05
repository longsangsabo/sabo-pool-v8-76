import React from 'react';
import ClubTournamentManagement from '@/components/club/ClubTournamentManagement';
import { TournamentSection } from '@/components/error-boundary/SectionWrappers';
import { AppProviders } from '@/contexts/AppProviders';

interface ClubTournamentsAndBracketsProps {
  clubId: string;
}

const ClubTournamentsAndBrackets: React.FC<ClubTournamentsAndBracketsProps> = ({
  clubId,
}) => {
  return (
    <AppProviders clubId={clubId}>
      <TournamentSection>
        <ClubTournamentManagement clubId={clubId} />
      </TournamentSection>
    </AppProviders>
  );
};

export default ClubTournamentsAndBrackets;
