
import React, { useEffect } from 'react';
import { TechTournamentPage } from '@/components/tournament/tech/TechTournamentPage';

const TournamentsPage = () => {
  useEffect(() => {
    // Apply tech theme to body when component mounts
    document.body.classList.add('tech-theme');
    console.log('🎯 Tech theme applied to TournamentsPage');

    return () => {
      // Clean up - remove tech theme when component unmounts
      document.body.classList.remove('tech-theme');
      console.log('🔧 Tech theme removed from TournamentsPage');
    };
  }, []);

  return <TechTournamentPage />;
};

export default TournamentsPage;
