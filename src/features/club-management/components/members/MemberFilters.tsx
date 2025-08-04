import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MembershipStatus } from '../../types/club.types';

interface MemberFiltersProps {
  onFilterChange: (filters: MemberFilters) => void;
}

interface MemberFilters {
  search: string;
  status: MembershipStatus | 'all';
  membershipType: string;
}

export function MemberFilters({ onFilterChange }: MemberFiltersProps) {
  const [filters, setFilters] = React.useState<MemberFilters>({
    search: '',
    status: 'all',
    membershipType: 'all',
  });

  const handleFilterChange = (key: keyof MemberFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by name or phone..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="flex gap-4">
        <div className="w-[180px]">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Label htmlFor="membershipType">Membership Type</Label>
          <Select
            value={filters.membershipType}
            onValueChange={(value) => handleFilterChange('membershipType', value)}
          >
            <SelectTrigger id="membershipType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
