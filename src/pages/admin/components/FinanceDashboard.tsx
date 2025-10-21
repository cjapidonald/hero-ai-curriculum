import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

type PaymentRecord = Tables<"payments">;
type PayrollRecord = Tables<"payroll">;
type TeacherRecord = Tables<"teachers">;
type StudentRecord = Tables<"dashboard_students">;
type ClassRecord = Tables<"classes">;

const SUBSCRIPTION_PLANS = [
  { id: "3_months", label: "3 Months", price: 6_600_000 },
  { id: "6_months", label: "6 Months", price: 12_000_000 },
  { id: "12_months", label: "12 Months", price: 20_400_000 },
];

const PAYMENT_METHOD_OPTIONS = ["Cash", "Bank Transfer", "Card", "Online"];

const CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const CHART_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#f87171", "#14b8a6"];

const formatCurrency = (value?: number | null) => CURRENCY_FORMATTER.format(value ?? 0);

const getPayrollTotal = (record: PayrollRecord) => {
  if (record.total_amount !== null && record.total_amount !== undefined) {
    return record.total_amount;
  }
  const base = Number(record.base_amount ?? 0);
  const bonus = Number(record.bonus ?? 0);
  const deductions = Number(record.deductions ?? 0);
  return base + bonus - deductions;
};

const getPlanForPayment = (payment: PaymentRecord) => {
  if (payment.term) {
    const knownPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === payment.term);
    if (knownPlan) {
      return knownPlan;
    }
  }

  const amount = Number(payment.amount ?? 0);
  const matchedByAmount = SUBSCRIPTION_PLANS.find((plan) => plan.price === amount);
  if (matchedByAmount) {
    return matchedByAmount;
  }

  return null;
};

interface PaymentFormState {
  id?: string;
  student_id: string;
  payment_for: string;
  amount: string;
  term: string;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  notes: string;
}

interface PayrollFormState {
  id?: string;
  teacher_id: string;
  period_start: string;
  period_end: string;
  hours_worked: string;
  hourly_rate: string;
  base_amount: string;
  bonus: string;
  deductions: string;
  payment_status: string;
  payment_date: string;
  payment_method: string;
  notes: string;
}

export function FinanceDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(() => ({
    student_id: "",
    payment_for: "3 Months Subscription",
    amount: "6600000",
    term: "3_months",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: PAYMENT_METHOD_OPTIONS[0],
    receipt_number: "",
    notes: "",
  }));
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [payrollForm, setPayrollForm] = useState<PayrollFormState>(() => ({
    teacher_id: "",
    period_start: "",
    period_end: "",
    hours_worked: "",
    hourly_rate: "",
    base_amount: "",
    bonus: "0",
    deductions: "0",
    payment_status: "pending",
    payment_date: "",
    payment_method: "",
    notes: "",
  }));

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [
        teachersResult,
        studentsResult,
        classesResult,
        paymentsResult,
        payrollResult,
      ] = await Promise.allSettled([
        supabase.from("teachers").select("*").eq("is_active", true).order("name"),
        supabase.from("dashboard_students").select("*").eq("is_active", true).order("name"),
        supabase
          .from("classes")
          .select("id, class_name, teacher_id, teacher_name, is_active")
          .eq("is_active", true),
        supabase
          .from("payments")
          .select("*")
          .order("payment_date", { ascending: false }),
        supabase
          .from("payroll")
          .select("*")
          .order("period_start", { ascending: false }),
      ]);

      if (teachersResult.status === "fulfilled" && !teachersResult.value.error) {
        setTeachers((teachersResult.value.data ?? []) as TeacherRecord[]);
      } else if (teachersResult.status === "fulfilled" && teachersResult.value.error) {
        throw teachersResult.value.error;
      }

      if (studentsResult.status === "fulfilled" && !studentsResult.value.error) {
        setStudents((studentsResult.value.data ?? []) as StudentRecord[]);
      } else if (studentsResult.status === "fulfilled" && studentsResult.value.error) {
        throw studentsResult.value.error;
      }

      if (classesResult.status === "fulfilled" && !classesResult.value.error) {
        setClasses((classesResult.value.data ?? []) as ClassRecord[]);
      } else if (classesResult.status === "fulfilled" && classesResult.value.error) {
        throw classesResult.value.error;
      }

      if (paymentsResult.status === "fulfilled" && !paymentsResult.value.error) {
        setPayments((paymentsResult.value.data ?? []) as PaymentRecord[]);
      } else if (paymentsResult.status === "fulfilled" && paymentsResult.value.error) {
        throw paymentsResult.value.error;
      }

      if (payrollResult.status === "fulfilled" && !payrollResult.value.error) {
        setPayrolls((payrollResult.value.data ?? []) as PayrollRecord[]);
      } else if (payrollResult.status === "fulfilled" && payrollResult.value.error) {
        throw payrollResult.value.error;
      }
    } catch (error: any) {
      console.error("Error loading finance data:", error);
      toast({
        title: "Unable to load finance data",
        description: error.message ?? "Something went wrong while loading finance information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const classTeacherMap = useMemo(() => {
    return classes.reduce<Record<string, string>>((acc, classRecord) => {
      if (classRecord.class_name && classRecord.teacher_id) {
        acc[classRecord.class_name] = classRecord.teacher_id;
      }
      return acc;
    }, {});
  }, [classes]);

  const classesByTeacher = useMemo(() => {
    return classes.reduce<Record<string, number>>((acc, classRecord) => {
      if (classRecord.teacher_id) {
        acc[classRecord.teacher_id] = (acc[classRecord.teacher_id] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [classes]);

  const studentsById = useMemo(() => {
    return students.reduce<Record<string, StudentRecord>>((acc, student) => {
      acc[student.id] = student;
      return acc;
    }, {});
  }, [students]);

  const teachersById = useMemo(() => {
    return teachers.reduce<Record<string, TeacherRecord>>((acc, teacher) => {
      acc[teacher.id] = teacher;
      return acc;
    }, {});
  }, [teachers]);

  const filteredStudentOptions = useMemo(() => {
    if (teacherFilter === "all") {
      return students;
    }

    const teacherClasses = Object.entries(classTeacherMap)
      .filter(([, teacherId]) => teacherId === teacherFilter)
      .map(([className]) => className);

    return students.filter((student) => teacherClasses.includes(student.class ?? ""));
  }, [students, teacherFilter, classTeacherMap]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (studentFilter !== "all" && payment.student_id !== studentFilter) {
        return false;
      }

      if (teacherFilter !== "all") {
        const student = studentsById[payment.student_id ?? ""];
        if (!student) {
          return false;
        }
        const teacherForStudent = classTeacherMap[student.class ?? ""];
        if (teacherForStudent !== teacherFilter) {
          return false;
        }
      }

      return true;
    });
  }, [payments, studentFilter, teacherFilter, studentsById, classTeacherMap]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((payroll) => {
      if (teacherFilter !== "all" && payroll.teacher_id !== teacherFilter) {
        return false;
      }
      return true;
    });
  }, [payrolls, teacherFilter]);

  const totalRevenue = useMemo(
    () => filteredPayments.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0),
    [filteredPayments],
  );

  const totalPayroll = useMemo(
    () => filteredPayrolls.reduce((acc, payroll) => acc + getPayrollTotal(payroll), 0),
    [filteredPayrolls],
  );

  const netRevenue = totalRevenue - totalPayroll;

  const classesTaught = useMemo(() => {
    if (teacherFilter !== "all") {
      return classesByTeacher[teacherFilter] ?? 0;
    }
    return Object.values(classesByTeacher).reduce((acc, count) => acc + count, 0);
  }, [classesByTeacher, teacherFilter]);

  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<
      string,
      { month: string; revenue: number; payroll: number }
    >();

    const addAmount = (
      map: typeof monthMap,
      dateStr: string | null,
      key: "revenue" | "payroll",
      amount: number,
    ) => {
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM yyyy");
      if (!map.has(monthKey)) {
        map.set(monthKey, { month: monthLabel, revenue: 0, payroll: 0 });
      }
      const entry = map.get(monthKey)!;
      entry[key] += amount;
    };

    filteredPayments.forEach((payment) => {
      addAmount(monthMap, payment.payment_date, "revenue", Number(payment.amount ?? 0));
    });

    filteredPayrolls.forEach((payroll) => {
      addAmount(monthMap, payroll.period_start, "payroll", getPayrollTotal(payroll));
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, value]) => value);
  }, [filteredPayments, filteredPayrolls]);

  const subscriptionBreakdown = useMemo(() => {
    const counts = SUBSCRIPTION_PLANS.reduce<Record<string, number>>((acc, plan) => {
      acc[plan.id] = 0;
      return acc;
    }, {});
    let customTotal = 0;

    filteredPayments.forEach((payment) => {
      const plan = getPlanForPayment(payment);
      if (plan) {
        counts[plan.id] += Number(payment.amount ?? 0);
      } else {
        customTotal += Number(payment.amount ?? 0);
      }
    });

    const data = SUBSCRIPTION_PLANS.map((plan) => ({
      name: plan.label,
      value: counts[plan.id],
    })).filter((entry) => entry.value > 0);

    if (customTotal > 0) {
      data.push({ name: "Custom / Other", value: customTotal });
    }

    return data;
  }, [filteredPayments]);

  const teacherPayoutData = useMemo(() => {
    const totals = filteredPayrolls.reduce<Record<string, number>>((acc, payroll) => {
      acc[payroll.teacher_id] = (acc[payroll.teacher_id] ?? 0) + getPayrollTotal(payroll);
      return acc;
    }, {});

    return Object.entries(totals).map(([teacherId, value]) => {
      const teacher = teachersById[teacherId];
      return {
        name: teacher ? `${teacher.name} ${teacher.surname}`.trim() : "Unknown",
        value,
      };
    });
  }, [filteredPayrolls, teachersById]);

  const topStudentRevenueData = useMemo(() => {
    const totals = filteredPayments.reduce<Record<string, number>>((acc, payment) => {
      if (!payment.student_id) return acc;
      acc[payment.student_id] = (acc[payment.student_id] ?? 0) + Number(payment.amount ?? 0);
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([studentId, value]) => {
        const student = studentsById[studentId];
        return {
          name: student ? `${student.name} ${student.surname}`.trim() : "Unknown",
          value,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredPayments, studentsById]);

  const resetPaymentForm = () => {
    setEditingPayment(null);
    setPaymentForm({
      student_id: "",
      payment_for: "3 Months Subscription",
      amount: "6600000",
      term: "3_months",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: PAYMENT_METHOD_OPTIONS[0],
      receipt_number: "",
      notes: "",
    });
  };

  const resetPayrollForm = () => {
    setEditingPayroll(null);
    setPayrollForm({
      teacher_id: "",
      period_start: "",
      period_end: "",
      hours_worked: "",
      hourly_rate: "",
      base_amount: "",
      bonus: "0",
      deductions: "0",
      payment_status: "pending",
      payment_date: "",
      payment_method: "",
      notes: "",
    });
  };

  const openPaymentDialog = (payment?: PaymentRecord) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({
        id: payment.id,
        student_id: payment.student_id ?? "",
        payment_for: payment.payment_for ?? "",
        amount: String(payment.amount ?? ""),
        term: payment.term ?? "custom",
        payment_date: payment.payment_date
          ? payment.payment_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        payment_method: payment.payment_method ?? PAYMENT_METHOD_OPTIONS[0],
        receipt_number: payment.receipt_number ?? "",
        notes: payment.notes ?? "",
      });
    } else {
      resetPaymentForm();
    }
    setPaymentDialogOpen(true);
  };

  const openPayrollDialog = (payroll?: PayrollRecord) => {
    if (payroll) {
      setEditingPayroll(payroll);
      setPayrollForm({
        id: payroll.id,
        teacher_id: payroll.teacher_id,
        period_start: payroll.period_start,
        period_end: payroll.period_end,
        hours_worked: String(payroll.hours_worked ?? ""),
        hourly_rate: String(payroll.hourly_rate ?? ""),
        base_amount: String(payroll.base_amount ?? ""),
        bonus: String(payroll.bonus ?? 0),
        deductions: String(payroll.deductions ?? 0),
        payment_status: payroll.payment_status ?? "pending",
        payment_date: payroll.payment_date ?? "",
        payment_method: payroll.payment_method ?? "",
        notes: payroll.notes ?? "",
      });
    } else {
      resetPayrollForm();
    }
    setPayrollDialogOpen(true);
  };

  const handlePaymentTermChange = (value: string) => {
    setPaymentForm((prev) => {
      if (value === "custom") {
        return { ...prev, term: value };
      }
      const plan = SUBSCRIPTION_PLANS.find((item) => item.id === value);
      if (!plan) {
        return { ...prev, term: value };
      }
      return {
        ...prev,
        term: plan.id,
        amount: String(plan.price),
        payment_for: `${plan.label} Subscription`,
      };
    });
  };

  const handleSavePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentForm.student_id) {
      toast({ title: "Select a student before saving", variant: "destructive" });
      return;
    }

    const amount = Number(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }

    const payload: Partial<PaymentRecord> = {
      student_id: paymentForm.student_id,
      amount,
      term: paymentForm.term === "custom" ? null : paymentForm.term,
      payment_for: paymentForm.payment_for || null,
      payment_method: paymentForm.payment_method || null,
      payment_date: paymentForm.payment_date || null,
      receipt_number: paymentForm.receipt_number || null,
      notes: paymentForm.notes || null,
    };

    try {
      if (editingPayment) {
        const { error } = await supabase
          .from("payments")
          .update(payload)
          .eq("id", editingPayment.id);
        if (error) throw error;
        toast({ title: "Payment updated successfully" });
      } else {
        const { error } = await supabase.from("payments").insert([payload]);
        if (error) throw error;
        toast({ title: "Payment recorded successfully" });
      }
      setPaymentDialogOpen(false);
      resetPaymentForm();
      fetchFinanceData();
    } catch (error: any) {
      console.error("Error saving payment:", error);
      toast({
        title: "Unable to save payment",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (payment: PaymentRecord) => {
    if (!window.confirm("Delete this payment record?")) {
      return;
    }
    try {
      const { error } = await supabase.from("payments").delete().eq("id", payment.id);
      if (error) throw error;
      toast({ title: "Payment deleted" });
      fetchFinanceData();
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Unable to delete payment",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSavePayroll = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payrollForm.teacher_id) {
      toast({ title: "Select a teacher before saving", variant: "destructive" });
      return;
    }

    const baseAmount = Number(payrollForm.base_amount);
    if (Number.isNaN(baseAmount)) {
      toast({ title: "Enter a valid base amount", variant: "destructive" });
      return;
    }

    const payload: Partial<PayrollRecord> = {
      teacher_id: payrollForm.teacher_id,
      period_start: payrollForm.period_start,
      period_end: payrollForm.period_end,
      hours_worked: payrollForm.hours_worked ? Number(payrollForm.hours_worked) : null,
      hourly_rate: payrollForm.hourly_rate ? Number(payrollForm.hourly_rate) : null,
      base_amount: baseAmount,
      bonus: payrollForm.bonus ? Number(payrollForm.bonus) : 0,
      deductions: payrollForm.deductions ? Number(payrollForm.deductions) : 0,
      payment_status: payrollForm.payment_status,
      payment_date: payrollForm.payment_date || null,
      payment_method: payrollForm.payment_method || null,
      notes: payrollForm.notes || null,
      total_amount:
        baseAmount +
        (payrollForm.bonus ? Number(payrollForm.bonus) : 0) -
        (payrollForm.deductions ? Number(payrollForm.deductions) : 0),
    };

    try {
      if (editingPayroll) {
        const { error } = await supabase
          .from("payroll")
          .update(payload)
          .eq("id", editingPayroll.id);
        if (error) throw error;
        toast({ title: "Payroll updated successfully" });
      } else {
        const { error } = await supabase.from("payroll").insert([payload]);
        if (error) throw error;
        toast({ title: "Payroll recorded successfully" });
      }
      setPayrollDialogOpen(false);
      resetPayrollForm();
      fetchFinanceData();
    } catch (error: any) {
      console.error("Error saving payroll:", error);
      toast({
        title: "Unable to save payroll",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayroll = async (payroll: PayrollRecord) => {
    if (!window.confirm("Delete this payroll record?")) {
      return;
    }
    try {
      const { error } = await supabase.from("payroll").delete().eq("id", payroll.id);
      if (error) throw error;
      toast({ title: "Payroll deleted" });
      fetchFinanceData();
    } catch (error: any) {
      console.error("Error deleting payroll:", error);
      toast({
        title: "Unable to delete payroll",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const subscriptionOptions = [
    ...SUBSCRIPTION_PLANS.map((plan) => ({
      value: plan.id,
      label: plan.label,
    })),
    { value: "custom", label: "Custom / Other" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Finance Dashboard</h2>
          <p className="text-muted-foreground">
            Track revenue, subscriptions, and teacher payouts in one view.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={studentFilter}
            onValueChange={setStudentFilter}
            disabled={filteredStudentOptions.length === 0}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {filteredStudentOptions.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} {student.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchFinanceData}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Student payments within the selected filters
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-sky-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Payroll</CardTitle>
            <GraduationCap className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">
              {formatCurrency(totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Salaries and bonuses scheduled for teachers
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                netRevenue >= 0 ? "text-purple-600" : "text-red-600"
              }`}
            >
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Revenue after teacher payouts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Covered</CardTitle>
            <UsersIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{classesTaught}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active classes tied to the current filters
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Payroll</CardTitle>
            <CardDescription>Monthly comparison of revenue and teacher payouts</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="payroll"
                    stroke="#6366f1"
                    strokeWidth={2}
                    name="Payroll"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No data for the selected filters yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Breakdown</CardTitle>
              <CardDescription>Revenue by subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="h-[220px]">
              {subscriptionBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      {subscriptionBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No subscription revenue recorded.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teacher Payouts</CardTitle>
              <CardDescription>Total payments per teacher</CardDescription>
            </CardHeader>
            <CardContent className="h-[220px]">
              {teacherPayoutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherPayoutData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No payroll records yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Student Payments</CardTitle>
            <CardDescription>Track and manage student tuition payments</CardDescription>
          </div>
          <Button onClick={() => openPaymentDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const student = payment.student_id ? studentsById[payment.student_id] : null;
                  const plan = getPlanForPayment(payment);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {student ? `${student.name} ${student.surname}` : "Unknown"}
                      </TableCell>
                      <TableCell>{student?.class ?? "N/A"}</TableCell>
                      <TableCell>{plan ? plan.label : payment.payment_for ?? "Custom"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(payment.amount ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_method ?? "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openPaymentDialog(payment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePayment(payment)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No payment records match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Teacher Payroll</CardTitle>
            <CardDescription>Adjust hours, bonuses, and payouts for teachers</CardDescription>
          </div>
          <Button onClick={() => openPayrollDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payroll
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrolls.map((payroll) => {
                  const teacher = teachersById[payroll.teacher_id];
                  return (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        {payroll.period_start
                          ? `${new Date(payroll.period_start).toLocaleDateString()}`
                          : ""}
                        {" – "}
                        {payroll.period_end
                          ? new Date(payroll.period_end).toLocaleDateString()
                          : ""}
                      </TableCell>
                      <TableCell>
                        {teacher ? `${teacher.name} ${teacher.surname}` : "Unknown"}
                      </TableCell>
                      <TableCell>{payroll.hours_worked ?? 0}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.base_amount ?? 0))}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.bonus ?? 0))}</TableCell>
                      <TableCell>{formatCurrency(Number(payroll.deductions ?? 0))}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(getPayrollTotal(payroll))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payroll.payment_status === "paid"
                              ? "default"
                              : payroll.payment_status === "overdue"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {payroll.payment_status ?? "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openPayrollDialog(payroll)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePayroll(payroll)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPayrolls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No payroll records match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Students by Revenue</CardTitle>
          <CardDescription>Students contributing the highest tuition</CardDescription>
        </CardHeader>
        <CardContent className="h-[220px]">
          {topStudentRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStudentRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No student payments recorded for the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Payment" : "Add Payment"}</DialogTitle>
            <DialogDescription>
              {editingPayment
                ? "Update the selected payment record."
                : "Record a new student payment."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-student">Student</Label>
                <Select
                  value={paymentForm.student_id}
                  onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, student_id: value }))}
                >
                  <SelectTrigger id="payment-student">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} {student.surname} {student.class ? `• ${student.class}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment-term">Plan</Label>
                <Select value={paymentForm.term} onValueChange={handlePaymentTermChange}>
                  <SelectTrigger id="payment-term">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment-amount">Amount (VND)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, payment_date: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-method">Method</Label>
                <Select
                  value={paymentForm.payment_method}
                  onValueChange={(value) =>
                    setPaymentForm((prev) => ({ ...prev, payment_method: value }))
                  }
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment-receipt">Receipt Number</Label>
                <Input
                  id="payment-receipt"
                  value={paymentForm.receipt_number}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, receipt_number: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="payment-for">Description</Label>
                <Input
                  id="payment-for"
                  value={paymentForm.payment_for}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, payment_for: event.target.value }))
                  }
                  placeholder="e.g. 3 Months Subscription"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Input
                  id="payment-notes"
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Optional notes about this payment"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  resetPaymentForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingPayment ? "Save Changes" : "Add Payment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPayroll ? "Edit Payroll" : "Add Payroll"}</DialogTitle>
            <DialogDescription>
              {editingPayroll
                ? "Update the selected payroll record."
                : "Record a new payroll entry for a teacher."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePayroll} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payroll-teacher">Teacher</Label>
                <Select
                  value={payrollForm.teacher_id}
                  onValueChange={(value) =>
                    setPayrollForm((prev) => ({ ...prev, teacher_id: value }))
                  }
                >
                  <SelectTrigger id="payroll-teacher">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} {teacher.surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payroll-status">Status</Label>
                <Select
                  value={payrollForm.payment_status}
                  onValueChange={(value) =>
                    setPayrollForm((prev) => ({ ...prev, payment_status: value }))
                  }
                >
                  <SelectTrigger id="payroll-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payroll-start">Period Start</Label>
                <Input
                  id="payroll-start"
                  type="date"
                  value={payrollForm.period_start}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, period_start: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payroll-end">Period End</Label>
                <Input
                  id="payroll-end"
                  type="date"
                  value={payrollForm.period_end}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, period_end: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payroll-hours">Hours Worked</Label>
                <Input
                  id="payroll-hours"
                  type="number"
                  min="0"
                  step="0.1"
                  value={payrollForm.hours_worked}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, hours_worked: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payroll-rate">Hourly Rate</Label>
                <Input
                  id="payroll-rate"
                  type="number"
                  min="0"
                  value={payrollForm.hourly_rate}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, hourly_rate: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payroll-base">Base Amount</Label>
                <Input
                  id="payroll-base"
                  type="number"
                  min="0"
                  value={payrollForm.base_amount}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, base_amount: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="payroll-bonus">Bonus</Label>
                <Input
                  id="payroll-bonus"
                  type="number"
                  value={payrollForm.bonus}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, bonus: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payroll-deductions">Deductions</Label>
                <Input
                  id="payroll-deductions"
                  type="number"
                  value={payrollForm.deductions}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, deductions: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payroll-method">Payment Method</Label>
                <Input
                  id="payroll-method"
                  value={payrollForm.payment_method}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, payment_method: event.target.value }))
                  }
                  placeholder="e.g. Bank Transfer"
                />
              </div>
              <div>
                <Label htmlFor="payroll-payment-date">Payment Date</Label>
                <Input
                  id="payroll-payment-date"
                  type="date"
                  value={payrollForm.payment_date}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, payment_date: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="payroll-notes">Notes</Label>
                <Input
                  id="payroll-notes"
                  value={payrollForm.notes}
                  onChange={(event) =>
                    setPayrollForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Optional notes about this payroll entry"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPayrollDialogOpen(false);
                  resetPayrollForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingPayroll ? "Save Changes" : "Add Payroll"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FinanceDashboard;
