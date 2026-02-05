import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import groupsApi from '@/config/groupsApi';
import ExpenseList from './ExpenseList';
import CreateExpenseModal from './CreateExpenseModal';

export default function GroupExpenses({ groupId, group, currentUserId, onUpdate, refreshKey }) {
  const { user } = useUser();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [groupId, refreshKey]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupExpenses(groupId);
      if (response.success) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseCreated = () => {
    fetchExpenses();
    setCreateExpenseOpen(false);
    onUpdate();
  };

  const handleExpenseDeleted = () => {
    fetchExpenses();
    onUpdate();
  };

  const allMembers = [group.owner, ...(group.members || [])];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <Button onClick={() => setCreateExpenseOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <ExpenseList
        expenses={expenses}
        loading={loading}
        currentUserId={currentUserId}
        groupId={groupId}
        onExpenseDeleted={handleExpenseDeleted}
      />

      <CreateExpenseModal
        open={createExpenseOpen}
        onOpenChange={setCreateExpenseOpen}
        group={group}
        members={allMembers}
        onSuccess={handleExpenseCreated}
      />
    </div>
  );
}
