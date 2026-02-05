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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';

const CATEGORIES = [
  'food',
  'transportation',
  'entertainment',
  'shopping',
  'utilities',
  'rent',
  'groceries',
  'dining_out',
  'travel',
  'other',
];

export default function CreateExpenseModal({ open, onOpenChange, group, members, onSuccess }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'other',
    splitType: 'equal',
    notes: '',
  });
  const [selectedMembers, setSelectedMembers] = useState(
    members.map((m) => m._id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split with');
      return;
    }

    try {
      setLoading(true);

      const amount = parseFloat(formData.amount);
      const splitAmount = amount / selectedMembers.length;

      const splits = selectedMembers.map((memberId) => ({
        member: memberId,
        amount: Math.round(splitAmount * 100) / 100,
        settled: false,
      }));

      const expenseData = {
        firebaseUid: user.uid,
        amount,
        description: formData.description,
        category: formData.category,
        date: new Date(),
        splitType: formData.splitType,
        splits,
        notes: formData.notes,
      };

      const response = await groupsApi.createExpense(group._id, expenseData);

      if (response.success) {
        toast.success('Expense created successfully');
        setFormData({
          amount: '',
          description: '',
          category: 'other',
          splitType: 'equal',
          notes: '',
        });
        setSelectedMembers(members.map((m) => m._id));
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error(error.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const splitAmount = formData.amount
    ? (parseFloat(formData.amount) / selectedMembers.length).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Create a new expense to split with group members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Split With</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member._id);
                const getInitials = (name) => {
                  return name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                };

                return (
                  <div
                    key={member._id}
                    onClick={() => toggleMember(member._id)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/10 shadow-md scale-105'
                        : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                        ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      `}>
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(member.name)
                        )}
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <p className={`text-sm font-medium truncate max-w-full ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {member.name.split(' ')[0]}
                        </p>
                        {isSelected && (
                          <p className="text-xs font-bold text-primary mt-1">
                            ₹{splitAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedMembers.length} member(s) selected · ₹{splitAmount} per person
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
