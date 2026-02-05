import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Copy,
  Crown,
  Edit,
  Trash2,
  UserPlus,
  Plus,
  Users,
  Receipt,
  Scale,
} from 'lucide-react';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';
import MemberList from './MemberList';
import ExpenseList from './ExpenseList';
import BalanceView from './BalanceView';
import CreateExpenseModal from './CreateExpenseModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function GroupDetailsModal({ open, onOpenChange, group, onUpdate, currentUserId }) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = group?.owner?._id === currentUserId;
  const allMembers = group ? [group.owner, ...(group.members || [])] : [];

  useEffect(() => {
    if (open && group) {
      if (activeTab === 'expenses') {
        fetchExpenses();
      } else if (activeTab === 'balances') {
        fetchBalances();
      }
    }
  }, [open, group, activeTab]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupExpenses(group._id);
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

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupBalances(group._id);
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

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  const handleDeleteGroup = async () => {
    try {
      const response = await groupsApi.deleteGroup(group._id, user.uid);
      if (response.success) {
        toast.success('Group deleted successfully');
        onUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await groupsApi.leaveGroup(group._id, user.uid);
      if (response.success) {
        toast.success('Left group successfully');
        onUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleExpenseCreated = () => {
    fetchExpenses();
    fetchBalances();
    onUpdate();
    setExpenseModalOpen(false);
  };

  const handleExpenseDeleted = () => {
    fetchExpenses();
    fetchBalances();
    onUpdate();
  };

  if (!group) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{group.name}</DialogTitle>
                {group.description && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {group.description}
                  </p>
                )}
              </div>
              {isOwner && (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="w-3 h-3" />
                  Owner
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">
                <Users className="w-4 h-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="expenses">
                <Receipt className="w-4 h-4 mr-2" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="balances">
                <Scale className="w-4 h-4 mr-2" />
                Balances
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="overview" className="space-y-4 m-0">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Invite Code</h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-4 py-3 rounded-lg text-2xl font-mono tracking-widest text-center">
                      {group.inviteCode}
                    </code>
                    <Button size="icon" variant="outline" onClick={copyInviteCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code with friends to invite them to the group
                  </p>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Group Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">Members</div>
                      <div className="text-2xl font-bold">{allMembers.length}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">Expenses</div>
                      <div className="text-2xl font-bold">{group.stats?.expenseCount || 0}</div>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-2">
                  {isOwner ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Group
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLeaveGroup}
                    >
                      Leave Group
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="members" className="m-0">
                <MemberList
                  group={group}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="expenses" className="m-0">
                <div className="space-y-4">
                  <Button onClick={() => setExpenseModalOpen(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                  <ExpenseList
                    expenses={expenses}
                    loading={loading}
                    currentUserId={currentUserId}
                    groupId={group._id}
                    onExpenseDeleted={handleExpenseDeleted}
                  />
                </div>
              </TabsContent>

              <TabsContent value="balances" className="m-0">
                <BalanceView balances={balances} loading={loading} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreateExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        group={group}
        members={allMembers}
        onSuccess={handleExpenseCreated}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All expenses and data associated with this group will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
