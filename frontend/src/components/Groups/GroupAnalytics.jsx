import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import groupsApi from '@/config/groupsApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, TrendingUp, Receipt, Users, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

export default function GroupAnalytics({ groupId, group, refreshKey }) {
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchData();
  }, [groupId, refreshKey]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getGroupExpenses(groupId);
      if (response.success) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedMember('all');
    setSelectedCategory('all');
    setDateRange('all');
  };

  const hasActiveFilters = selectedMember !== 'all' || selectedCategory !== 'all' || dateRange !== 'all';

  // Local Aggregation & Filtering Logic
  const filteredData = useMemo(() => {
    let result = [...expenses];

    // 1. Filter by Member
    if (selectedMember !== 'all') {
      result = result.filter(exp => exp.paidBy._id === selectedMember);
    }

    // 2. Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(exp => exp.category === selectedCategory);
    }

    // 3. Filter by Date Range
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      if (dateRange === '7days') filterDate.setDate(now.getDate() - 7);
      else if (dateRange === '30days') filterDate.setDate(now.getDate() - 30);
      else if (dateRange === '90days') filterDate.setDate(now.getDate() - 90);
      
      result = result.filter(exp => new Date(exp.date) >= filterDate);
    }

    return result;
  }, [expenses, selectedMember, selectedCategory, dateRange]);

  // DERIVED STATS FOR CHARTS
  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    const totalExpenses = filteredData.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filteredData.length;
    const average = totalExpenses / count;

    // Expense by Member
    const memberMap = new Map();
    filteredData.forEach(exp => {
      const id = exp.paidBy._id;
      if (!memberMap.has(id)) {
        memberMap.set(id, { name: exp.paidBy.name, totalPaid: 0 });
      }
      memberMap.get(id).totalPaid += exp.amount;
    });
    const expenseByMember = Array.from(memberMap.values());

    // Category Distribution
    const categoryMap = new Map();
    filteredData.forEach(exp => {
      if (!categoryMap.has(exp.category)) {
        categoryMap.set(exp.category, { name: exp.category.replace('_', ' '), total: 0, count: 0 });
      }
      const data = categoryMap.get(exp.category);
      data.total += exp.amount;
      data.count += 1;
    });
    const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);

    // Spending Timeline (Last 6 Months or based on data)
    const timelineMap = new Map();
    filteredData.forEach(exp => {
      const date = new Date(exp.date);
      const key = date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (!timelineMap.has(key)) {
        timelineMap.set(key, { month: key, total: 0, sortKey: date.getTime() });
      }
      timelineMap.get(key).total += exp.amount;
    });
    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.sortKey - b.sortKey);

    return { totalExpenses, count, average, expenseByMember, categoryBreakdown, timeline };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
  const gridColor = theme === 'dark' ? '#374151' : '#f3f4f6';
  const allMembers = [group.owner, ...(group.members || [])];
  const allCategories = [...new Set(expenses.map(exp => exp.category))];
  // Avoid mutating memoized stats arrays (sort is in-place)
  const topSpenderName = stats
    ? ([...stats.expenseByMember].sort((a, b) => b.totalPaid - a.totalPaid)[0]?.name || 'N/A')
    : 'N/A';

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Filter Header */}
      <Card className="p-6 border-none shadow-sm bg-muted/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Analytics Filters</h3>
              <p className="text-sm text-muted-foreground">Adjust your view of the group finances</p>
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="md:self-start gap-1.5"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <Users className="w-3.5 h-3.5" />
              Paid By
            </div>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {allMembers.map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <PieIcon className="w-3.5 h-3.5" />
              Category
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    <span className="capitalize">{category.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Timeframe
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {!stats ? (
        <Card className="p-12 text-center border-dashed">
          <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Data Found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Try adjusting your filters or adding some expenses to see analytics!
          </p>
        </Card>
      ) : (
        <>
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-primary/10 transition-transform group-hover:scale-110">
                <Receipt className="w-12 h-12" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Total Volume</h3>
              <p className="text-3xl font-black text-primary">₹{stats.totalExpenses.toLocaleString('en-IN')}</p>
              <div className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit">
                {stats.count} transaction{stats.count !== 1 ? 's' : ''}
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-blue-500/10 transition-transform group-hover:scale-110">
                <TrendingUp className="w-12 h-12" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Avg. Ticket</h3>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">₹{Math.round(stats.average).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-2">Value per expense</p>
            </Card>

            <Card className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-emerald-500/10 transition-transform group-hover:scale-110">
                <Users className="w-12 h-12" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Top Spender</h3>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                {topSpenderName}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Active in this view</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie & Details */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Category Distribution</h3>
                <Badge variant="outline" className="font-mono">{stats.categoryBreakdown.length} Categories</Badge>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category List */}
            <Card className="p-6 flex flex-col">
              <h3 className="font-bold text-lg mb-6">Spending Breakdown</h3>
              <div className="space-y-5 flex-1 overflow-y-auto max-h-[312px] pr-2 custom-scrollbar">
                {stats.categoryBreakdown.map((cat, index) => (
                  <div key={index} className="group cursor-default">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-semibold capitalize text-sm">{cat.name}</span>
                      </div>
                      <span className="font-bold text-primary">₹{cat.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 ease-out rounded-full" 
                        style={{ 
                          width: `${(cat.total / stats.totalExpenses) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense by Member Bar Chart */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-bold text-lg mb-6">Expense by Member</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.expenseByMember}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis 
                      dataKey="name" 
                      stroke={textColor} 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke={textColor} 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? v/1000 + 'k' : v}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                    />
                    <Bar 
                      dataKey="totalPaid" 
                      fill="#8b5cf6" 
                      radius={[6, 6, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Spending Timeline */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-6">Timeline</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis 
                      dataKey="month" 
                      stroke={textColor} 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
