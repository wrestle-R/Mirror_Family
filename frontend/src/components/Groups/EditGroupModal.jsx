import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';

export default function EditGroupModal({ open, onOpenChange, group, onSuccess }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (group && open) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
      });
    }
  }, [group, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setLoading(true);
      const response = await groupsApi.updateGroup(group._id, {
        ...formData,
        firebaseUid: user.uid,
      });

      if (response.success) {
        toast.success('Group updated successfully');
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update group details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Group Name *</Label>
            <Input
              id="edit-name"
              placeholder="e.g., Weekend Trip"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="What's this group for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              rows={3}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Save Changes' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
