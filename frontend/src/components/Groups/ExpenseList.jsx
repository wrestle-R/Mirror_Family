import { useUser } from '@/context/UserContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';
import { Money } from '@/components/ui/money';
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

export default function ExpenseList({ expenses, loading, currentUserId, groupId, onExpenseDeleted }) {
  const { user } = useUser();

  const handleDeleteExpense = async (expenseId) => {
    try {
      const response = await groupsApi.deleteExpense(groupId, expenseId, user.uid);
      if (response.success) {
        toast.success('Expense deleted successfully');
        onExpenseDeleted();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleSettleExpense = async (expenseId) => {
    try {
      const response = await groupsApi.settleExpense(groupId, expenseId);
      if (response.success) {
        toast.success('Expense marked as settled');
        onExpenseDeleted(); // Refresh list via the same callback
      }
    } catch (error) {
      console.error('Error settling expense:', error);
      toast.error('Failed to settle expense');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No expenses yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first expense to start splitting costs
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const canDelete = expense.paidBy._id === currentUserId;
        const canSettle = !expense.isSettled && (expense.paidBy._id === currentUserId || user.isOwner);

        return (
          <Card key={expense._id} className={`p-4 ${expense.isSettled ? 'bg-muted/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{expense.description}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {expense.category}
                      </Badge>
                      {expense.isSettled && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Settled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      <Money>₹{expense.amount.toLocaleString('en-IN')}</Money>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(expense.date)}
                  </div>
                  <div>
                    Paid by <span className="font-medium text-foreground">{expense.paidBy.name}</span>
                  </div>
                </div>

                {expense.splits && expense.splits.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Split between:</p>
                    <div className="flex flex-wrap gap-2">
                      {expense.splits.map((split) => (
                        <Badge key={split.member._id} variant="secondary" className="text-xs">
                          {split.member.name}: <Money>₹{split.amount.toLocaleString('en-IN')}</Money>
                          {split.settled ? (
                            <span className="ml-2 text-xs text-green-500 font-medium">(Paid)</span>
                          ) : (
                            <span className="ml-2 text-xs text-muted-foreground">(Pending)</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {expense.notes && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p className="font-medium">Notes</p>
                    <p>{expense.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {canSettle && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Settle
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Settled?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will mark the entire expense as settled for all members involved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSettleExpense(expense._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this expense? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
