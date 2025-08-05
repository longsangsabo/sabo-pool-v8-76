import React, { FC } from 'react';
import { MatchCard } from './MatchCard';
import { TournamentMatch } from '@/hooks/useTournamentMatches';

interface WinnersBracket16Props {
  round1Matches: TournamentMatch[];
  round2Matches: TournamentMatch[];
  round3Matches: TournamentMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => void;
  allowInput: boolean;
}

export const WinnersBracket16: FC<WinnersBracket16Props> = ({
  round1Matches,
  round2Matches,
  round3Matches,
  onScoreSubmit,
  allowInput,
}) => {
  return (
    <div className='winners-bracket-grid grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='round round-1'>
        <div className='mb-4'>
          <h3 className='text-lg font-medium text-center'>Round 1 (16→8)</h3>
          <p className='text-sm text-muted-foreground text-center'>
            {round1Matches.length} matches
          </p>
        </div>

        <div className='space-y-3'>
          {round1Matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onScoreSubmit={onScoreSubmit}
              allowInput={allowInput}
              roundType='winners'
              roundName='WB R1'
            />
          ))}
        </div>
      </div>

      <div className='round round-2'>
        <div className='mb-4'>
          <h3 className='text-lg font-medium text-center'>Round 2 (8→4)</h3>
          <p className='text-sm text-muted-foreground text-center'>
            {round2Matches.length} matches
          </p>
        </div>

        <div className='space-y-3'>
          {round2Matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onScoreSubmit={onScoreSubmit}
              allowInput={allowInput}
              roundType='winners'
              roundName='WB R2'
            />
          ))}
        </div>
      </div>

      <div className='round round-3'>
        <div className='mb-4'>
          <h3 className='text-lg font-medium text-center'>Round 3 (4→2)</h3>
          <p className='text-sm text-muted-foreground text-center'>
            {round3Matches.length} matches
          </p>
        </div>

        <div className='space-y-3'>
          {round3Matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onScoreSubmit={onScoreSubmit}
              allowInput={allowInput}
              roundType='winners'
              roundName='WB R3'
            />
          ))}
        </div>
      </div>
    </div>
  );
};
