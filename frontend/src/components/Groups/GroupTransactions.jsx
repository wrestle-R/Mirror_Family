import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Calendar } from 'lucide-react';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';
import { Money } from '@/components/ui/money';

export default function GroupTransactions({ groupId, refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) fetchTransactions();
  }, [groupId, refreshKey]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupTransactions(groupId, { limit: 100 });
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching group transactions:', error);
      toast.error('Failed to load group transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <Card className="p-8 text-center">
        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No transactions recorded for this group yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map(tx => (
        <Card key={tx._id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{tx.description || (tx.category || tx.type)}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(tx.date).toLocaleDateString('en-IN')}
                </span>
                <span className="capitalize">{tx.type}{tx.category ? ` · ${tx.category.replace('_', ' ')}` : ''}</span>
                {tx.student && (
                  <span className="text-xs">by {tx.student.name}</span>
                )}
              </div>
            </div>

            <div className="text-right ml-4">
              <p className={`text-lg font-bold ${tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-600' : 'text-primary'}`}>
                <Money>{tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}₹{Number(tx.amount).toLocaleString()}</Money>
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
