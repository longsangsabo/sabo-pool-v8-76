import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Save, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MatchData {
  id: string;
  player1_name: string;
  player2_name: string;
  player1_id: string;
  player2_id: string;
  round_number: number;
  match_number: number;
  bracket_type: string;
  status: string;
  score_player1?: number;
  score_player2?: number;
  winner_id?: string;
}

interface MatchInputValidatorProps {
  match: MatchData;
  onSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export const MatchInputValidator: React.FC<MatchInputValidatorProps> = ({
  match,
  onSubmit,
  isSubmitting = false,
}) => {
  const [player1Score, setPlayer1Score] = useState(
    match.score_player1?.toString() || ''
  );
  const [player2Score, setPlayer2Score] = useState(
    match.score_player2?.toString() || ''
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateInput = () => {
    const errors: string[] = [];

    // Check if scores are numbers
    const p1Score = parseInt(player1Score);
    const p2Score = parseInt(player2Score);

    if (isNaN(p1Score) || isNaN(p2Score)) {
      errors.push('Both scores must be valid numbers');
    }

    // Check for negative scores
    if (p1Score < 0 || p2Score < 0) {
      errors.push('Scores cannot be negative');
    }

    // Check for tie
    if (p1Score === p2Score) {
      errors.push('Scores cannot be equal - one player must win');
    }

    // Check for reasonable score ranges (billiards typically 0-15)
    if (p1Score > 15 || p2Score > 15) {
      errors.push('Scores seem unusually high (max 15 for billiards)');
    }

    // Check if both players exist
    if (!match.player1_id || !match.player2_id) {
      errors.push('Both players must be assigned to this match');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      toast({
        title: '❌ Validation Failed',
        description:
          'Please fix the errors before submitting the match result.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(match.id, {
        player1: parseInt(player1Score),
        player2: parseInt(player2Score),
      });

      toast({
        title: '✅ Match Updated',
        description: 'Match result has been saved successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: '❌ Save Failed',
        description: `Failed to save match result: ${error}`,
        variant: 'destructive',
      });
    }
  };

  const getBracketTypeColor = (type: string) => {
    switch (type) {
      case 'winner':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'loser':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'semifinal':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'final':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const isValid = validationErrors.length === 0;
  const hasChanges =
    player1Score !== (match.score_player1?.toString() || '') ||
    player2Score !== (match.score_player2?.toString() || '');

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>
            Round {match.round_number} - Match {match.match_number}
          </CardTitle>
          <div className='flex gap-2'>
            <Badge className={getBracketTypeColor(match.bracket_type)}>
              {match.bracket_type}
            </Badge>
            <Badge className={getStatusColor(match.status)}>
              {match.status}
            </Badge>
          </div>
        </div>
        <CardDescription>Enter match scores with validation</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Players and Scores */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{match.player1_name || 'TBD'}</span>
            </div>
            <div className='w-20'>
              <Input
                type='number'
                value={player1Score}
                onChange={e => {
                  setPlayer1Score(e.target.value);
                  // Validate on change
                  setTimeout(validateInput, 100);
                }}
                placeholder='0'
                min='0'
                max='15'
                className='text-center'
              />
            </div>
          </div>

          <div className='flex items-center justify-center'>
            <div className='w-8 h-px bg-border' />
            <span className='px-2 text-xs text-muted-foreground'>VS</span>
            <div className='w-8 h-px bg-border' />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{match.player2_name || 'TBD'}</span>
            </div>
            <div className='w-20'>
              <Input
                type='number'
                value={player2Score}
                onChange={e => {
                  setPlayer2Score(e.target.value);
                  // Validate on change
                  setTimeout(validateInput, 100);
                }}
                placeholder='0'
                min='0'
                max='15'
                className='text-center'
              />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant='destructive' className='py-2'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription className='text-sm'>
              <ul className='list-disc list-inside space-y-1'>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success indicator */}
        {isValid && hasChanges && (
          <Alert className='border-green-200 bg-green-50 py-2'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-sm text-green-700'>
              Input is valid and ready to submit
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || !hasChanges || isSubmitting}
          className='w-full'
          variant={isValid && hasChanges ? 'default' : 'secondary'}
        >
          {isSubmitting ? (
            <>
              <Save className='h-4 w-4 mr-2 animate-pulse' />
              Saving...
            </>
          ) : (
            <>
              <Save className='h-4 w-4 mr-2' />
              Save Match Result
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
