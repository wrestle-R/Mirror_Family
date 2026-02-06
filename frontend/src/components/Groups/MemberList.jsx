import { useUser } from '@/context/UserContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, UserMinus, User } from 'lucide-react';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';
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

export default function MemberList({ group, balances, currentUserId, isOwner, onUpdate, loading }) {
  const { user } = useUser();
  const allMembers = [group.owner, ...(group.members || [])];

  const handleRemoveMember = async (memberId) => {
    try {
      const response = await groupsApi.removeMember(group._id, memberId, user.uid);
      if (response.success) {
        toast.success('Member removed successfully');
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && balances.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allMembers.map((member) => {
        const isMemberOwner = member._id === group.owner._id;
        const isCurrentUser = member._id?.toString() === currentUserId?.toString();
        
        // Find net balance from synchronized backend data
        const memberBalanceEntry = balances.find(b => b.userId === member._id);
        const net = memberBalanceEntry ? memberBalanceEntry.balance : 0;

        return (
          <Card key={member._id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    {isMemberOwner && (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="w-3 h-3" />
                        Owner
                      </Badge>
                    )}
                    {isCurrentUser && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Net Balance</div>
                  <div className={`text-xl font-bold ${net > 0 ? 'text-green-500' : net < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {net > 0 ? '+' : ''}₹{net.toLocaleString('en-IN')}
                  </div>
                </div>

                {isOwner && !isMemberOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {member.name} from the group?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
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
