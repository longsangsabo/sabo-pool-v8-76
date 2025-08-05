import React, { FC } from 'react';
import { MatchCard } from './MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { TournamentMatch } from '@/hooks/useTournamentMatches';

interface LosersBranchBProps {
  title: string;
  matches: TournamentMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => void;
  allowInput: boolean;
}

export const LosersBranchB: FC<LosersBranchBProps> = ({
  title,
  matches,
  onScoreSubmit,
  allowInput,
}) => {
  // Group matches by rounds
  const groupMatchesByRound = (matches: TournamentMatch[]) => {
    return matches.reduce(
      (groups: { [key: number]: TournamentMatch[] }, match) => {
        const round = match.round_number;
        if (!groups[round]) {
          groups[round] = [];
        }
        groups[round].push(match);
        return groups;
      },
      {}
    );
  };

  const roundGroups = groupMatchesByRound(matches);
  const roundNumbers = Object.keys(roundGroups).map(Number).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{title}</CardTitle>
        <p className='text-sm text-muted-foreground'>
          {matches.length} matches total
        </p>
      </CardHeader>

      <CardContent>
        <div className='losers-branch-b'>
          <div className='branch-progression space-y-6'>
            {roundNumbers.map((roundNum, index) => (
              <div key={roundNum} className={`branch-round round-${index + 1}`}>
                <div className='mb-3'>
                  <h4 className='font-medium'>
                    Round {roundNum}
                    {roundNum === 1 && ' (4→2)'}
                    {roundNum === 2 && ' (2→1)'}
                    {roundNum === 3 && ' (Finals)'}
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    {roundGroups[roundNum].length} matches
                  </p>
                </div>

                <div className='space-y-3'>
                  {roundGroups[roundNum].map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onScoreSubmit={onScoreSubmit}
                      allowInput={allowInput}
                      roundType='losers'
                      roundName={`LB-B R${roundNum}`}
                      branch='B'
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
