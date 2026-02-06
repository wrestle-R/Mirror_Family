import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';

export default function JoinGroupModal({ open, onOpenChange, onSuccess }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      setLoading(true);
      const response = await groupsApi.joinGroup(inviteCode.trim(), user.uid);

      if (response.success) {
        toast.success(`Successfully joined ${response.data.name}!`);
        setInviteCode('');
        onSuccess();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error(error.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
          <DialogDescription>
            Enter the 6-character invite code to join a group
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Ask the group owner for the invite code
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || inviteCode.length !== 6}>
              {loading ? 'Joining...' : 'Join Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
