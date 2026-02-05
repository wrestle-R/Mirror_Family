import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Copy, Users as UsersIcon, Receipt, TrendingUp, BarChart3, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import groupsApi from '@/config/groupsApi';
import GroupOverview from '@/components/Groups/GroupOverview';
import GroupExpenses from '@/components/Groups/GroupExpenses';
import GroupSettlements from '@/components/Groups/GroupSettlements';
import GroupTransactions from '@/components/Groups/GroupTransactions';
import GroupAnalytics from '@/components/Groups/GroupAnalytics';

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, student } = useUser();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupDetails(groupId);
      if (response.success) {
        setGroup(response.data);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast.error('Failed to load group details');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchGroupDetails();
    setRefreshKey(prev => prev + 1);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  const isOwner = group.owner._id === student?._id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground mt-1">{group.description}</p>
            )}
          </div>
        </div>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Invite Code</p>
              <p className="text-lg font-mono font-bold">{group.inviteCode}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyInviteCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <UsersIcon className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="w-4 h-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="settlements" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Settlements
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Wallet className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <GroupOverview
            group={group}
            isOwner={isOwner}
            currentUserId={student?._id}
            onUpdate={handleUpdate}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <GroupExpenses
            groupId={groupId}
            group={group}
            currentUserId={student?._id}
            onUpdate={handleUpdate}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <GroupSettlements
            groupId={groupId}
            group={group}
            currentUserId={student?._id}
            onUpdate={handleUpdate}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <GroupTransactions
            groupId={groupId}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <GroupAnalytics
            groupId={groupId}
            group={group}
            refreshKey={refreshKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
