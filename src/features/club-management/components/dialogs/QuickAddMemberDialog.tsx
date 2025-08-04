import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuickActions } from '../../hooks/useQuickActions';
import { toast } from '@/components/ui/use-toast';

export function QuickAddMemberDialog() {
  const { addNewMember, loading } = useQuickActions();
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addNewMember(formData);
      toast({
        title: 'Success',
        description: 'Member added successfully',
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
