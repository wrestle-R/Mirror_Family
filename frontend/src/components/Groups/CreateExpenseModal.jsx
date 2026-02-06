import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import groupsApi from '@/config/groupsApi';
import { toast } from 'sonner';
import { Loader2, X, UploadCloud, ScanLine, Sparkles, FileText } from 'lucide-react';
import { Money } from '@/components/ui/money';

const CATEGORIES = [
  'food',
  'transportation',
  'entertainment',
  'shopping',
  'utilities',
  'rent',
  'groceries',
  'dining_out',
  'travel',
  'other',
];

export default function CreateExpenseModal({ open, onOpenChange, group, members, onSuccess }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'other',
    splitType: 'equal',
    notes: '',
  });
  const [selectedMembers, setSelectedMembers] = useState(
    members.map((m) => m._id)
  );
  
  const [receiptImages, setReceiptImages] = useState([]);
  const [importingBills, setImportingBills] = useState(false);

  const handleImportBills = async () => {
    if (!receiptImages.length) {
      toast.error('Please add at least one bill photo');
      return;
    }

    setImportingBills(true);
    try {
      const formData = new FormData();
      formData.append('firebaseUid', user.uid);
      receiptImages.forEach((file) => formData.append('images', file));

      const response = await groupsApi.parseBill(formData);
      if (response.success && response.data) {
        setFormData(prev => ({
            ...prev,
            amount: response.data.amount || prev.amount,
            category: response.data.category || prev.category,
            description: response.data.description || prev.description,
            notes: response.data.notes || prev.notes,
        }));
        toast.success('Bill parsed successfully!');
        setReceiptImages([]);
      } else {
        toast.error(response.message || 'Failed to parse bill');
      }
    } catch (error) {
      console.error('Error importing bills:', error);
      toast.error('Failed to import bills');
    } finally {
      setImportingBills(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split with');
      return;
    }

    try {
      setLoading(true);

      const amount = parseFloat(formData.amount);
      const splitAmount = Math.floor((amount / selectedMembers.length) * 100) / 100;
      
      // Calculate splits with proper rounding
      const splits = selectedMembers.map((memberId, index) => {
        // Last member gets the remainder to ensure exact total
        if (index === selectedMembers.length - 1) {
          const previousTotal = splitAmount * (selectedMembers.length - 1);
          return {
            member: memberId,
            amount: Math.round((amount - previousTotal) * 100) / 100,
            settled: false,
          };
        }
        return {
          member: memberId,
          amount: splitAmount,
          settled: false,
        };
      });

      const expenseData = {
        firebaseUid: user.uid,
        amount,
        description: formData.description,
        category: formData.category,
        date: new Date(),
        splitType: formData.splitType,
        splits,
        notes: formData.notes,
      };

      const response = await groupsApi.createExpense(group._id, expenseData);

      if (response.success) {
        toast.success('Expense created successfully');
        setFormData({
          amount: '',
          description: '',
          category: 'other',
          splitType: 'equal',
          notes: '',
        });
        setSelectedMembers(members.map((m) => m._id));
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create expense';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const splitAmount = formData.amount && selectedMembers.length > 0
    ? (parseFloat(formData.amount) / selectedMembers.length).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Create a new expense to split with group members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Import Bills Section - Enhanced UI */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                   <Sparkles className="w-4 h-4 text-primary" />
                   AI Receipt Scanner
                </div>
                {receiptImages.length > 0 && (
                     <Button
                        type="button"
                        size="sm"
                        onClick={handleImportBills}
                        disabled={importingBills}
                        className="h-8 shadow-md transition-all"
                      >
                        {importingBills ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <ScanLine className="w-3 h-3 mr-2" />}
                        {importingBills ? 'Extracting...' : 'Auto-fill Details'}
                      </Button>
                )}
            </div>
            
            <div className="p-4 space-y-4">
                {/* Upload Area */}
                {receiptImages.length === 0 ? (
                    <div className="relative group cursor-pointer">
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => setReceiptImages(Array.from(e.target.files || []))}
                        />
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-all group-hover:border-primary/50 group-hover:bg-primary/5 flex flex-col items-center justify-center text-center gap-2">
                             <div className="p-3 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                             </div>
                             <div>
                                 <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
                                 <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG (Max 5MB)</p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {receiptImages.map((file, idx) => (
                                <div
                                key={`${file.name}-${idx}`}
                                className="relative flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors group"
                                >
                                    <div className="shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setReceiptImages((prev) => prev.filter((_, i) => i !== idx))}
                                    >
                                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            ))}
                         </div>
                         <div className="flex justify-center pt-2">
                            <div className="relative cursor-pointer">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setReceiptImages(prev => [...prev, ...Array.from(e.target.files || [])])}
                                />
                                <span className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                    <UploadCloud className="w-3 h-3" />
                                    Add another page
                                </span>
                            </div>
                         </div>
                    </div>
                )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Split With</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member._id);
                const getInitials = (name) => {
                  return name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                };

                return (
                  <div
                    key={member._id}
                    onClick={() => toggleMember(member._id)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/10 shadow-md scale-105'
                        : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                        ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      `}>
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(member.name)
                        )}
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <p className={`text-sm font-medium truncate max-w-full ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {member.name.split(' ')[0]}
                        </p>
                        {isSelected && (
                          <p className="text-xs font-bold text-primary mt-1">
                            <Money>₹{splitAmount}</Money>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedMembers.length} member(s) selected · <Money>₹{splitAmount}</Money> per person
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
