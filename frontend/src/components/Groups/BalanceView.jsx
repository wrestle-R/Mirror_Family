import { Card } from '@/components/ui/card';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function BalanceView({ balances, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <p className="font-medium">All settled up!</p>
          <p className="text-sm text-muted-foreground">
            No pending balances in this group
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {balances.map((settlement, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <p className="font-medium">{settlement.from.name}</p>
                  <p className="text-xs text-muted-foreground">{settlement.from.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <p className="font-medium">{settlement.to.name}</p>
                  <p className="text-xs text-muted-foreground">{settlement.to.email}</p>
                </div>
              </div>
            </div>

            <div className="ml-4">
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  ₹{settlement.amount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">owes</p>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          💡 Tip: These are simplified settlements to minimize transactions
        </p>
      </Card>
    </div>
  );
}
