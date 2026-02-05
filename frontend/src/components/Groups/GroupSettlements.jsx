import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import groupsApi from '@/config/groupsApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function GroupSettlements({ groupId, group, currentUserId, onUpdate, refreshKey }) {
  const { user } = useUser();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, [groupId, refreshKey]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupBalances(groupId);
      if (response.success) {
        setBalances(response.data);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast.error('Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (settlement) => {
    try {
      setSettling(true);
      const response = await groupsApi.settleBalance(groupId, {
        fromUserId: settlement.from.userId,
        toUserId: settlement.to.userId,
        amount: settlement.amount,
        firebaseUid: user.uid,
      });

      if (response.success) {
        toast.success('Settlement recorded successfully!');
        fetchBalances();
        onUpdate();
      }
    } catch (error) {
      console.error('Error settling balance:', error);
      toast.error(error.response?.data?.message || 'Failed to record settlement');
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mt-2">All Settled Up!</h3>
          <p className="text-sm text-muted-foreground">
            No pending balances in this group
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Settlement Suggestions</h3>
        <p className="text-sm text-muted-foreground">
          {balances.length} settlement{balances.length !== 1 ? 's' : ''} needed
        </p>
      </div>

      <div className="space-y-3">
        {balances.map((settlement, index) => {
          const isCurrentUserDebtor = settlement.from.userId === currentUserId;

          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* From User */}
                  <div className="flex-1">
                    <p className="font-semibold">{settlement.from.name}</p>
                    <p className="text-xs text-muted-foreground">{settlement.from.email}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-6 h-6 text-primary" />
                    <p className="text-xs text-muted-foreground">owes</p>
                  </div>

                  {/* To User */}
                  <div className="flex-1">
                    <p className="font-semibold">{settlement.to.name}</p>
                    <p className="text-xs text-muted-foreground">{settlement.to.email}</p>
                  </div>
                </div>

                {/* Amount and Action */}
                <div className="ml-6 flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₹{settlement.amount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={settling} variant="default">
                        Settle Up
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Settlement</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to record a settlement of ₹{settlement.amount.toLocaleString('en-IN')} from {settlement.from.name} to {settlement.to.name}?
                          <br /><br />
                          This will create a transaction record and mark the relevant expenses as settled.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSettle(settlement)}>
                          Confirm Settlement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          💡 These settlements are optimized to minimize the number of transactions needed
        </p>
      </Card>
    </div>
  );
}
