import React from 'react';
import { DisabledMatchComponent } from './DisabledMatchComponent';

interface MatchVerificationCardProps {
  matchResult: any;
  onVerificationChange: () => void;
}

export const MatchVerificationCard = (props: MatchVerificationCardProps) => {
  return <DisabledMatchComponent title='Match Verification Card' />;
};
