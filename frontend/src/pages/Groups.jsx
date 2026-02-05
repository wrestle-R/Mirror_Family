import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Plus, UserPlus } from 'lucide-react';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';
import GroupCard from '@/components/Groups/GroupCard';
import CreateGroupModal from '@/components/Groups/CreateGroupModal';
import JoinGroupModal from '@/components/Groups/JoinGroupModal';

export default function Groups() {
  const navigate = useNavigate();
  const { user, student } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getUserGroups(user.uid);
      if (response.success) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group) => {
    navigate(`/groups/${group._id}`);
  };

  const handleCreateSuccess = () => {
    fetchGroups();
    setCreateModalOpen(false);
  };

  const handleJoinSuccess = () => {
    fetchGroups();
    setJoinModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Split</h1>
          <p className="text-muted-foreground mt-1">
            Create groups and split expenses with friends
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setJoinModalOpen(true)} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Join Group
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No groups yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Create a group or join one using an invite code
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => setJoinModalOpen(true)} variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Join Group
              </Button>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard
              key={group._id}
              group={group}
              onClick={() => handleGroupClick(group)}
              currentUserId={student?._id}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <JoinGroupModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}
