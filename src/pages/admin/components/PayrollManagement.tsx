import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface PayrollRecord {
  id: string;
  teacher_id: string;
  period_start: string;
  period_end: string;
  hours_worked: number;
  hourly_rate: number;
  base_amount: number;
  bonus: number;
  deductions: number;
  total_amount: number;
  payment_status: string;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
}

export default function PayrollManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    teacher_id: '',
    period_start: '',
    period_end: '',
    hours_worked: '',
    hourly_rate: '',
    base_amount: '',
    bonus: '0',
    deductions: '0',
    payment_status: 'pending',
    payment_date: '',
    payment_method: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, name, surname, email')
        .eq('is_active', true)
        .order('name');

      const { data: payrollData } = await supabase
        .from('payroll')
        .select('*')
        .order('period_start', { ascending: false });

      setTeachers(teachersData || []);
      setPayrolls(payrollData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('payroll')
        .insert([
          {
            teacher_id: formData.teacher_id,
            period_start: formData.period_start,
            period_end: formData.period_end,
            hours_worked: parseFloat(formData.hours_worked),
            hourly_rate: parseFloat(formData.hourly_rate),
            base_amount: parseFloat(formData.base_amount),
            bonus: parseFloat(formData.bonus),
            deductions: parseFloat(formData.deductions),
            payment_status: formData.payment_status,
            payment_date: formData.payment_date || null,
            payment_method: formData.payment_method || null,
            notes: formData.notes || null,
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payroll record created successfully',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payroll record',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payroll record deleted successfully',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payroll record',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      period_start: '',
      period_end: '',
      hours_worked: '',
      hourly_rate: '',
      base_amount: '',
      bonus: '0',
      deductions: '0',
      payment_status: 'pending',
      payment_date: '',
      payment_method: '',
      notes: '',
    });
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.name} ${teacher.surname}` : 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Management
              </CardTitle>
              <CardDescription>Manage teacher payments and salaries</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Payroll Record</DialogTitle>
                  <DialogDescription>Add a new payment record for a teacher</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2">
                      <Label htmlFor="teacher">Teacher</Label>
                      <Select
                        value={formData.teacher_id}
                        onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} {teacher.surname} - {teacher.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="period_start">Period Start</Label>
                      <Input
                        id="period_start"
                        type="date"
                        value={formData.period_start}
                        onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="period_end">Period End</Label>
                      <Input
                        id="period_end"
                        type="date"
                        value={formData.period_end}
                        onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="hours_worked">Hours Worked</Label>
                      <Input
                        id="hours_worked"
                        type="number"
                        step="0.5"
                        value={formData.hours_worked}
                        onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate (VND)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="1000"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="base_amount">Base Amount (VND)</Label>
                      <Input
                        id="base_amount"
                        type="number"
                        step="1000"
                        value={formData.base_amount}
                        onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="bonus">Bonus (VND)</Label>
                      <Input
                        id="bonus"
                        type="number"
                        step="1000"
                        value={formData.bonus}
                        onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="deductions">Deductions (VND)</Label>
                      <Input
                        id="deductions"
                        type="number"
                        step="1000"
                        value={formData.deductions}
                        onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment_status">Payment Status</Label>
                      <Select
                        value={formData.payment_status}
                        onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="payment_date">Payment Date</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Input
                        id="payment_method"
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        placeholder="Bank transfer, Cash, etc."
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Payroll</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((payroll) => (
                <TableRow key={payroll.id}>
                  <TableCell className="font-medium">{getTeacherName(payroll.teacher_id)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(payroll.period_start).toLocaleDateString()} - {new Date(payroll.period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{payroll.hours_worked}h</TableCell>
                  <TableCell>{payroll.hourly_rate.toLocaleString()}</TableCell>
                  <TableCell>{payroll.base_amount.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">+{payroll.bonus.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">-{payroll.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">{payroll.total_amount.toLocaleString()} VND</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payroll.payment_status)}>
                      {payroll.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(payroll.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
