import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  DollarSign, 
  Award, 
  Gift,
  Users,
  Calculator,
  Download,
  Save
} from 'lucide-react';
import { AdminTournament } from '@/hooks/admin/useAdminData';

interface TournamentPrizeManagerProps {
  tournament: AdminTournament;
  onClose: () => void;
  onSave: (prizeStructure: PrizeStructure) => void;
}

interface PrizeItem {
  id: string;
  position: number;
  title: string;
  amount: number;
  type: 'cash' | 'trophy' | 'gift';
  description?: string;
}

interface PrizeStructure {
  totalPrizePool: number;
  currency: string;
  distribution: PrizeItem[];
  sponsorContributions: SponsorContribution[];
  additionalRewards: AdditionalReward[];
}

interface SponsorContribution {
  id: string;
  sponsorName: string;
  amount: number;
  type: 'cash' | 'product' | 'service';
  description: string;
}

interface AdditionalReward {
  id: string;
  title: string;
  description: string;
  criteria: string;
  value: number;
}

const TournamentPrizeManager: React.FC<TournamentPrizeManagerProps> = ({
  tournament,
  onClose,
  onSave
}) => {
  // Mock initial prize structure
  const [prizeStructure, setPrizeStructure] = useState<PrizeStructure>({
    totalPrizePool: 50000000,
    currency: 'VND',
    distribution: [
      { id: '1', position: 1, title: 'Champion', amount: 20000000, type: 'cash' },
      { id: '2', position: 2, title: 'Runner-up', amount: 12000000, type: 'cash' },
      { id: '3', position: 3, title: 'Third Place', amount: 8000000, type: 'cash' },
      { id: '4', position: 4, title: 'Fourth Place', amount: 5000000, type: 'cash' }
    ],
    sponsorContributions: [
      { id: '1', sponsorName: 'Sabo Pool Center', amount: 25000000, type: 'cash', description: 'Main sponsor' },
      { id: '2', sponsorName: 'Vietnam Billiards', amount: 15000000, type: 'cash', description: 'Equipment sponsor' }
    ],
    additionalRewards: [
      { id: '1', title: 'Best Break', description: 'Highest break shot', criteria: 'Technical skill', value: 2000000 },
      { id: '2', title: 'Fair Play Award', description: 'Best sportsmanship', criteria: 'Behavior', value: 1000000 }
    ]
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const addPrizePosition = () => {
    const newPosition = prizeStructure.distribution.length + 1;
    const newPrize: PrizeItem = {
      id: Date.now().toString(),
      position: newPosition,
      title: `Position ${newPosition}`,
      amount: 1000000,
      type: 'cash'
    };
    
    setPrizeStructure(prev => ({
      ...prev,
      distribution: [...prev.distribution, newPrize]
    }));
  };

  const updatePrizeItem = (id: string, updates: Partial<PrizeItem>) => {
    setPrizeStructure(prev => ({
      ...prev,
      distribution: prev.distribution.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const removePrizeItem = (id: string) => {
    setPrizeStructure(prev => ({
      ...prev,
      distribution: prev.distribution.filter(item => item.id !== id)
    }));
  };

  const addSponsorContribution = () => {
    const newSponsor: SponsorContribution = {
      id: Date.now().toString(),
      sponsorName: 'New Sponsor',
      amount: 5000000,
      type: 'cash',
      description: 'Sponsor contribution'
    };
    
    setPrizeStructure(prev => ({
      ...prev,
      sponsorContributions: [...prev.sponsorContributions, newSponsor]
    }));
  };

  const updateSponsorContribution = (id: string, updates: Partial<SponsorContribution>) => {
    setPrizeStructure(prev => ({
      ...prev,
      sponsorContributions: prev.sponsorContributions.map(sponsor => 
        sponsor.id === id ? { ...sponsor, ...updates } : sponsor
      )
    }));
  };

  const removeSponsorContribution = (id: string) => {
    setPrizeStructure(prev => ({
      ...prev,
      sponsorContributions: prev.sponsorContributions.filter(sponsor => sponsor.id !== id)
    }));
  };

  const calculateTotalDistribution = () => {
    return prizeStructure.distribution.reduce((total, item) => total + item.amount, 0);
  };

  const calculateSponsorTotal = () => {
    return prizeStructure.sponsorContributions.reduce((total, sponsor) => total + sponsor.amount, 0);
  };

  const remainingPrizePool = prizeStructure.totalPrizePool - calculateTotalDistribution();

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prize Management</h2>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Structure
          </Button>
          <Button onClick={() => onSave(prizeStructure)}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Prize Pool Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Prize Pool Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(prizeStructure.totalPrizePool)}
              </div>
              <div className="text-sm text-muted-foreground">Total Prize Pool</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateTotalDistribution())}
              </div>
              <div className="text-sm text-muted-foreground">Distributed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(remainingPrizePool)}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {prizeStructure.distribution.length}
              </div>
              <div className="text-sm text-muted-foreground">Prize Positions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prize Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Prize Distribution
          </CardTitle>
          <Button onClick={addPrizePosition} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prizeStructure.distribution
              .sort((a, b) => a.position - b.position)
              .map((prize) => (
              <div key={prize.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full font-bold text-sm">
                  {prize.position}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Position Title</Label>
                    <Input
                      value={prize.title}
                      onChange={(e) => updatePrizeItem(prize.id, { title: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Amount (VND)</Label>
                    <Input
                      type="number"
                      value={prize.amount}
                      onChange={(e) => updatePrizeItem(prize.id, { amount: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Type</Label>
                    <select
                      value={prize.type}
                      onChange={(e) => updatePrizeItem(prize.id, { type: e.target.value as 'cash' | 'trophy' | 'gift' })}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    >
                      <option value="cash">Cash</option>
                      <option value="trophy">Trophy</option>
                      <option value="gift">Gift</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePrizeItem(prize.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Contributions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sponsor Contributions
          </CardTitle>
          <Button onClick={addSponsorContribution} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Sponsor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prizeStructure.sponsorContributions.map((sponsor) => (
              <div key={sponsor.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Sponsor Name</Label>
                    <Input
                      value={sponsor.sponsorName}
                      onChange={(e) => updateSponsorContribution(sponsor.id, { sponsorName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Amount (VND)</Label>
                    <Input
                      type="number"
                      value={sponsor.amount}
                      onChange={(e) => updateSponsorContribution(sponsor.id, { amount: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Type</Label>
                    <select
                      value={sponsor.type}
                      onChange={(e) => updateSponsorContribution(sponsor.id, { type: e.target.value as 'cash' | 'product' | 'service' })}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    >
                      <option value="cash">Cash</option>
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSponsorContribution(sponsor.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Total Sponsor Contributions:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(calculateSponsorTotal())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Additional Rewards & Special Prizes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prizeStructure.additionalRewards.map((reward) => (
              <div key={reward.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-purple-600">
                    <Gift className="h-3 w-3 mr-1" />
                    {reward.title}
                  </Badge>
                  <span className="font-bold text-green-600">
                    {formatCurrency(reward.value)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{reward.description}</p>
                <p className="text-xs text-blue-600">Criteria: {reward.criteria}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prize Calculation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Prize Calculation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Prize Pool:</span>
              <span className="font-bold">{formatCurrency(prizeStructure.totalPrizePool)}</span>
            </div>
            <div className="flex justify-between">
              <span>Main Prizes Distributed:</span>
              <span>{formatCurrency(calculateTotalDistribution())}</span>
            </div>
            <div className="flex justify-between">
              <span>Additional Rewards:</span>
              <span>{formatCurrency(prizeStructure.additionalRewards.reduce((total, reward) => total + reward.value, 0))}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Remaining Budget:</span>
              <span className={remainingPrizePool >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(remainingPrizePool)}
              </span>
            </div>
            {remainingPrizePool < 0 && (
              <p className="text-sm text-red-600">
                ⚠️ Prize distribution exceeds available budget
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentPrizeManager;
