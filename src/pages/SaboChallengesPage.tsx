import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trophy } from 'lucide-react';
import UnifiedChallengeCard from '@/components/challenges/UnifiedChallengeCard';
import type { SaboChallenge } from '@/types/sabo-challenge';

// Mock data based on SABO challenge system
const mockChallenges: SaboChallenge[] = [
  {
    id: '1',
    challenger_id: 'user1',
    opponent_id: 'user2',
    challenger: {
      id: 'user1',
      username: 'player1',
      display_name: 'Nguyễn Văn A',
      current_rank: 'I+',
      current_elo: 1350,
      spa_points: 450,
      avatar_url: null,
    },
    opponent: {
      id: 'user2',
      username: 'player2',
      display_name: 'Trần Văn B',
      current_rank: 'H',
      current_elo: 1420,
      spa_points: 380,
      avatar_url: null,
    },
    stake_amount: 300,
    race_to: 14,
    handicap_challenger: 0,
    handicap_opponent: 1.5,
    status: 'in_progress',
    challenger_final_score: 8,
    opponent_final_score: 6,
    created_at: '2025-07-12T10:00:00Z',
    expires_at: '2025-07-14T10:00:00Z',
    started_at: '2025-07-12T10:30:00Z',
    rack_history: [
      {
        rack_number: 1,
        winner_id: 'user2',
        challenger_total: 0,
        opponent_total: 2.5,
        timestamp: '2025-07-12T10:35:00Z',
      },
      {
        rack_number: 2,
        winner_id: 'user1',
        challenger_total: 1,
        opponent_total: 2.5,
        timestamp: '2025-07-12T10:42:00Z',
      },
      {
        rack_number: 3,
        winner_id: 'user1',
        challenger_total: 2,
        opponent_total: 2.5,
        timestamp: '2025-07-12T10:48:00Z',
      },
      {
        rack_number: 4,
        winner_id: 'user2',
        challenger_total: 2,
        opponent_total: 3.5,
        timestamp: '2025-07-12T10:55:00Z',
      },
      {
        rack_number: 5,
        winner_id: 'user1',
        challenger_total: 3,
        opponent_total: 3.5,
        timestamp: '2025-07-12T11:02:00Z',
      },
      {
        rack_number: 6,
        winner_id: 'user1',
        challenger_total: 4,
        opponent_total: 3.5,
        timestamp: '2025-07-12T11:08:00Z',
      },
      {
        rack_number: 7,
        winner_id: 'user1',
        challenger_total: 5,
        opponent_total: 3.5,
        timestamp: '2025-07-12T11:15:00Z',
      },
      {
        rack_number: 8,
        winner_id: 'user2',
        challenger_total: 5,
        opponent_total: 4.5,
        timestamp: '2025-07-12T11:22:00Z',
      },
      {
        rack_number: 9,
        winner_id: 'user1',
        challenger_total: 6,
        opponent_total: 4.5,
        timestamp: '2025-07-12T11:28:00Z',
      },
      {
        rack_number: 10,
        winner_id: 'user1',
        challenger_total: 7,
        opponent_total: 4.5,
        timestamp: '2025-07-12T11:35:00Z',
      },
      {
        rack_number: 11,
        winner_id: 'user1',
        challenger_total: 8,
        opponent_total: 4.5,
        timestamp: '2025-07-12T11:42:00Z',
      },
      {
        rack_number: 12,
        winner_id: 'user2',
        challenger_total: 8,
        opponent_total: 5.5,
        timestamp: '2025-07-12T11:48:00Z',
      },
      {
        rack_number: 13,
        winner_id: 'user2',
        challenger_total: 8,
        opponent_total: 6.5,
        timestamp: '2025-07-12T11:55:00Z',
      },
    ],
  },
  {
    id: '2',
    challenger_id: 'user3',
    opponent_id: 'user4',
    challenger: {
      id: 'user3',
      username: 'player3',
      display_name: 'Lê Thị C',
      current_rank: 'K+',
      current_elo: 1150,
      spa_points: 280,
      avatar_url: null,
    },
    opponent: {
      id: 'user4',
      username: 'player4',
      display_name: 'Phạm Văn D',
      current_rank: 'I',
      current_elo: 1250,
      spa_points: 520,
      avatar_url: null,
    },
    stake_amount: 200,
    race_to: 12,
    handicap_challenger: 1.5,
    handicap_opponent: 0,
    status: 'pending',
    challenger_final_score: 1.5,
    opponent_final_score: 0,
    created_at: '2025-07-12T14:20:00Z',
    expires_at: '2025-07-14T14:20:00Z',
    rack_history: [],
  },
];

const CURRENT_USER_ID = 'user1'; // Mock current user

export default function SaboChallengesPage() {
  const [challenges, setChallenges] = useState<SaboChallenge[]>(mockChallenges);

  const handleScoreRack = (challengeId: string, winnerId: string) => {
    setChallenges(prev =>
      prev.map(challenge => {
        if (challenge.id === challengeId) {
          const newChallengerScore =
            winnerId === challenge.challenger_id
              ? challenge.challenger_final_score + 1
              : challenge.challenger_final_score;
          const newOpponentScore =
            winnerId === challenge.opponent_id
              ? challenge.opponent_final_score + 1
              : challenge.opponent_final_score;

          const newRack = {
            rack_number: challenge.rack_history.length + 1,
            winner_id: winnerId,
            challenger_total: newChallengerScore,
            opponent_total: newOpponentScore,
            timestamp: new Date().toISOString(),
          };

          // Check if match is complete
          const isComplete =
            newChallengerScore >= challenge.race_to ||
            newOpponentScore >= challenge.race_to;
          const winnerId_final =
            newChallengerScore >= challenge.race_to
              ? challenge.challenger_id
              : challenge.opponent_id;

          return {
            ...challenge,
            challenger_final_score: newChallengerScore,
            opponent_final_score: newOpponentScore,
            rack_history: [...challenge.rack_history, newRack],
            status: isComplete ? ('completed' as const) : challenge.status,
            score_confirmation_timestamp: isComplete
              ? new Date().toISOString()
              : challenge.score_confirmation_timestamp,
          };
        }
        return challenge;
      })
    );
  };

  const handleAccept = (challengeId: string) => {
    setChallenges(prev =>
      prev.map(challenge =>
        challenge.id === challengeId
          ? {
              ...challenge,
              status: 'accepted' as const,
              accepted_at: new Date().toISOString(),
            }
          : challenge
      )
    );
  };

  const handleDecline = (challengeId: string) => {
    setChallenges(prev =>
      prev.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, status: 'declined' as const }
          : challenge
      )
    );
  };

  const handleStart = (challengeId: string) => {
    setChallenges(prev =>
      prev.map(challenge =>
        challenge.id === challengeId
          ? {
              ...challenge,
              status: 'in_progress' as const,
              started_at: new Date().toISOString(),
            }
          : challenge
      )
    );
  };

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold mb-2'>SABO Challenge System</h1>
        <p className='text-muted-foreground'>
          Stake-based challenges with handicap system
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {challenges.map(challenge => (
          <UnifiedChallengeCard
            key={challenge.id}
            challenge={
              {
                id: challenge.id,
                challenger_id: challenge.challenger_id,
                opponent_id: challenge.opponent_id,
                bet_points: challenge.stake_amount,
                race_to: challenge.race_to,
                status: challenge.status as any,
                created_at: challenge.created_at,
                expires_at: challenge.expires_at,
                challenger_score: challenge.challenger_final_score,
                opponent_score: challenge.opponent_final_score,
                winner_id: challenge.winner_id,
              } as any
            }
            variant='default'
          />
        ))}
      </div>

      {challenges.length === 0 && (
        <div className='text-center py-12'>
          <Trophy className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
          <h3 className='text-lg font-medium mb-2'>No challenges yet</h3>
          <p className='text-muted-foreground mb-4'>
            Create your first SABO challenge to get started!
          </p>
          <Button className='hover-scale'>
            <Plus className='h-4 w-4 mr-2' />
            Create Challenge
          </Button>
        </div>
      )}
    </div>
  );
}
