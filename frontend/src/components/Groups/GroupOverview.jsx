import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Receipt, DollarSign } from 'lucide-react';
import MemberList from './MemberList';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';

export default function GroupOverview({ group, isOwner, currentUserId, onUpdate, refreshKey }) {
  const allMembers = [group.owner, ...(group.members || [])];
  const memberCount = allMembers.length;
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [group._id, refreshKey]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expResponse, balResponse] = await Promise.all([
        groupsApi.getGroupExpenses(group._id),
        groupsApi.getGroupBalances(group._id)
      ]);

      if (expResponse.success) setExpenses(expResponse.data);
      if (balResponse.success) setBalances(balResponse.data);
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Failed to load group summary');
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = expenses.length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">{memberCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold">{expenseCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Members Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Members</h3>
          {isOwner && (
            <Badge variant="secondary">Owner</Badge>
          )}
        </div>
        <MemberList
          group={group}
          balances={balances}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onUpdate={onUpdate}
          loading={loading}
        />
      </div>
    </div>
  );
}
