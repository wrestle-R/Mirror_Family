import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GroupCard({ group, onClick, currentUserId }) {
  const isOwner = group.owner._id === currentUserId;
  const totalMembers = (group.members?.length || 0) + 1; // +1 for owner
  const totalExpenses = group.stats?.totalExpenses || 0;
  const expenseCount = group.stats?.expenseCount || 0;

  return (
    <Card
      className={cn(
        "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        "border-2 hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          {isOwner && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="w-3 h-3" />
              Owner
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3 h-3" />
              Members
            </div>
            <div className="text-xl font-bold">{totalMembers}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Expenses
            </div>
            <div className="text-xl font-bold">{expenseCount}</div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Spent</span>
            <span className="text-lg font-semibold">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
