import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Users, GraduationCap, Calendar, DollarSign, TrendingUp, BookOpen, Award, RefreshCw, Download, Search } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import { EnhancedStudentCRUD } from "@/components/crud/EnhancedStudentCRUD";
import { EnhancedTeacherCRUD } from "@/components/crud/EnhancedTeacherCRUD";
import { SkillsManagement } from "@/components/crud/SkillsManagement";
import { FullCurriculumView } from "@/components/crud/FullCurriculumView";
import { CalendarSessionCRUD } from "@/components/crud/CalendarSessionCRUD";
import { exportToCSV, formatDateForExport } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { QuickTips, adminDashboardTips } from "@/components/QuickTips";
import { BulkImport } from "@/components/BulkImport";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { useChartTheme, getTooltipStyles } from "@/lib/chart-theme";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import EvaluationsList from "@/components/teacher/EvaluationsList";

type DashboardStudent = Tables<"dashboard_students">;
type TeacherRecord = Tables<"teachers">;

interface ClassRecord {
  id: string;
  class_name: string;
  teacher_name: string | null;
  stage: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  current_students: number | null;
  max_students: number | null;
  is_active: boolean | null;
}

interface PaymentRecord {
  id: string;
  payment_date: string | null;
  receipt_number: string | null;
  payment_for: string | null;
  payment_method: string | null;
  amount: number | string;
}

interface EventRecord {
  id: string;
  title: string;
  event_date: string | null;
  location: string | null;
}

interface LevelDistribution {
  level: string;
  count: number;
}

type AdminTabType = 'overview' | 'students' | 'teachers' | 'curriculum' | 'skills' | 'calendar' | 'classes' | 'finance' | 'analytics' | 'audit' | 'evaluations';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark } = useTheme();
  const chartTheme = useChartTheme(isDark);
  const tooltipStyles = getTooltipStyles(isDark);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as AdminTabType | null;
  const [activeTab, setActiveTab] = useState<AdminTabType>(tabFromUrl || 'overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
  });
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [classesPage, setClassesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const classesPerPage = 10;
  const paymentsPerPage = 10;

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== tabFromUrl) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, tabFromUrl, setSearchParams]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'r',
      ctrl: true,
      callback: () => {
        fetchAdminData();
        toast({ title: "Refreshing data..." });
      },
      description: 'Refresh dashboard data',
    },
    {
      key: '1',
      ctrl: true,
      callback: () => setActiveTab('overview'),
      description: 'Go to Overview tab',
    },
    {
      key: '2',
      ctrl: true,
      callback: () => setActiveTab('students'),
      description: 'Go to Students tab',
    },
    {
      key: '3',
      ctrl: true,
      callback: () => setActiveTab('teachers'),
      description: 'Go to Teachers tab',
    },
    {
      key: '4',
      ctrl: true,
      callback: () => setActiveTab('classes'),
      description: 'Go to Classes tab',
    },
    {
      key: '/',
      ctrl: true,
      callback: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search bar',
    },
  ]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdminData();

    // Set up real-time subscriptions for critical data
    const studentsChannel = supabase
      .channel('admin-students-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_students',
        },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    const teachersChannel = supabase
      .channel('admin-teachers-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teachers',
        },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    const classesChannel = supabase
      .channel('admin-classes-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
        },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(teachersChannel);
      supabase.removeChannel(classesChannel);
    };
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students
      const { data: studentsData, error: studentError } = await supabase
        .from("dashboard_students")
        .select("*")
        .order("created_at", { ascending: false });
      if (studentError) throw new Error(`Failed to fetch students: ${studentError.message}`);

      // Fetch teachers
      const { data: teachersData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("is_active", true);
      if (teacherError) throw new Error(`Failed to fetch teachers: ${teacherError.message}`);

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, class_name, teacher_name, stage, schedule_days, start_time, end_time, current_students, max_students, is_active")
        .eq("is_active", true);
      if (classesError) throw new Error(`Failed to fetch classes: ${classesError.message}`);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("id, payment_date, receipt_number, payment_for, payment_method, amount")
        .order("payment_date", { ascending: false })
        .limit(10);
      if (paymentsError) throw new Error(`Failed to fetch payments: ${paymentsError.message}`);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      if (eventsError) throw new Error(`Failed to fetch events: ${eventsError.message}`);

      setStudents((studentsData ?? []) as DashboardStudent[]);
      setTeachers((teachersData ?? []) as TeacherRecord[]);
      setClasses((classesData ?? []) as ClassRecord[]);
      setPayments((paymentsData ?? []) as PaymentRecord[]);
      setEvents((eventsData ?? []) as EventRecord[]);

      // Calculate stats
      const totalRevenue =
        paymentsData?.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0) ?? 0;
      const activeStudents = studentsData?.filter((student) => student.is_active).length ?? 0;

      setStats({
        totalStudents: studentsData?.length ?? 0,
        activeStudents,
        totalTeachers: teachersData?.length ?? 0,
        totalClasses: classesData?.length ?? 0,
        totalRevenue,
        upcomingEvents: eventsData?.length ?? 0,
      });

      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const exportStudentsToCSV = () => {
    try {
      const studentsForExport = students.map((student) => ({
        Name: `${student.name} ${student.surname}`,
        Email: student.email,
        Class: student.class,
        Level: student.level,
        'Attendance Rate': student.attendance_rate ? `${student.attendance_rate}%` : 'N/A',
        'Sessions Left': student.sessions_left || 0,
        Status: student.is_active ? 'Active' : 'Inactive',
        Location: student.location || 'N/A',
      }));
      exportToCSV(studentsForExport, `students-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast({
        title: "Export Successful",
        description: `Exported ${students.length} students to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export students. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportTeachersToCSV = () => {
    try {
      const teachersForExport = teachers.map((teacher) => ({
        Name: `${teacher.name} ${teacher.surname}`,
        Email: teacher.email,
        Subject: teacher.subject || 'N/A',
        Phone: teacher.phone || 'N/A',
        'Hourly Rate': teacher.hourly_rate || 0,
        Status: teacher.is_active ? 'Active' : 'Inactive',
      }));
      exportToCSV(teachersForExport, `teachers-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast({
        title: "Export Successful",
        description: `Exported ${teachers.length} teachers to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export teachers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportClassesToCSV = () => {
    try {
      const classesForExport = classes.map((classItem) => ({
        'Class Name': classItem.class_name,
        Teacher: classItem.teacher_name || 'Unassigned',
        Stage: classItem.stage || 'N/A',
        Schedule: classItem.schedule_days?.join(', ') || 'N/A',
        Time: `${classItem.start_time}-${classItem.end_time}`,
        'Current Students': classItem.current_students || 0,
        'Max Students': classItem.max_students || 0,
        Status: classItem.is_active ? 'Active' : 'Inactive',
      }));
      exportToCSV(classesForExport, `classes-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast({
        title: "Export Successful",
        description: `Exported ${classes.length} classes to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export classes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportPaymentsToCSV = () => {
    try {
      const paymentsForExport = payments.map((payment) => ({
        Date: formatDateForExport(payment.payment_date),
        'Receipt Number': payment.receipt_number || 'N/A',
        'Payment For': payment.payment_for || 'N/A',
        Method: payment.payment_method || 'N/A',
        'Amount (VND)': Number(payment.amount).toLocaleString(),
      }));
      exportToCSV(paymentsForExport, `payments-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast({
        title: "Export Successful",
        description: `Exported ${payments.length} payments to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payments. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Chart data
  const classDistributionData = useMemo(
    () =>
      classes.map((classroom) => ({
        name: classroom.class_name,
        students: classroom.current_students ?? 0,
        capacity: classroom.max_students ?? 0,
      })),
    [classes],
  );

  const studentLevelData = students.reduce<LevelDistribution[]>((acc, student) => {
    const levelLabel = student.level || "Unknown";
    const existing = acc.find((item) => item.level === levelLabel);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ level: levelLabel, count: 1 });
    }
    return acc;
  }, []);

  const attendanceData = students.slice(0, 10).map((student) => ({
    name: `${student.name} ${student.surname}`,
    rate: Number(student.attendance_rate ?? 0),
  }));

  // Use theme-aware colors instead of hard-coded ones
  const COLORS = chartTheme.pie;

  // Filter data based on search query
  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    const query = searchQuery.toLowerCase();
    return classes.filter(
      (c) =>
        c.class_name?.toLowerCase().includes(query) ||
        c.teacher_name?.toLowerCase().includes(query) ||
        c.stage?.toLowerCase().includes(query)
    );
  }, [classes, searchQuery]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(
      (p) =>
        p.receipt_number?.toLowerCase().includes(query) ||
        p.payment_for?.toLowerCase().includes(query) ||
        p.payment_method?.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={fetchAdminData}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-purple-200 flex-shrink-0">
                <span className="text-base md:text-lg font-semibold text-white">
                  {user?.name?.[0]}{user?.name?.[1]}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">Admin Dashboard</h1>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground flex-wrap">
                  <span className="truncate">{user?.name}</span>
                  <span className="hidden sm:inline">•</span>
                  <Badge variant="outline" className="text-xs">Administrator</Badge>
                  {lastUpdated && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date().getTime() - lastUpdated.getTime() < 60000
                          ? 'just now'
                          : `${Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000)}m ago`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ProfileEditor userType="admin" />
              <NotificationCenter />
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAdminData}
                disabled={loading}
                className="flex-1 sm:flex-none"
                aria-label="Refresh dashboard data (Ctrl+R)"
                title="Ctrl+R"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1 sm:flex-none"
                aria-label="Logout from admin dashboard"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.activeStudents} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground mt-2">active instructors</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground mt-2">running this term</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {(stats.totalRevenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground mt-2">VND collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTabType)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-10 h-auto" role="tablist" aria-label="Dashboard sections">
            <TabsTrigger value="overview" aria-label="Overview tab (Ctrl+1)">Overview</TabsTrigger>
            <TabsTrigger value="students" aria-label="Students tab (Ctrl+2)">Students</TabsTrigger>
            <TabsTrigger value="teachers" aria-label="Teachers tab (Ctrl+3)">Teachers</TabsTrigger>
            <TabsTrigger value="curriculum" aria-label="Full Curriculum tab">Curriculum</TabsTrigger>
            <TabsTrigger value="skills" aria-label="Skills tab">Skills</TabsTrigger>
            <TabsTrigger value="calendar" aria-label="Calendar tab">Calendar</TabsTrigger>
            <TabsTrigger value="classes" aria-label="Classes tab (Ctrl+4)">Classes</TabsTrigger>
            <TabsTrigger value="finance" aria-label="Finance tab">Finance</TabsTrigger>
            <TabsTrigger value="analytics" aria-label="Analytics tab">Analytics</TabsTrigger>
            <TabsTrigger value="audit" aria-label="Audit Log tab">Audit Log</TabsTrigger>
            <TabsTrigger value="evaluations" aria-label="Evaluations tab">Evaluations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Class Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Enrollment</CardTitle>
                  <CardDescription>Current students vs capacity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={classDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: chartTheme.axis, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.grid }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        tick={{ fill: chartTheme.axis, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.grid }}
                      />
                      <Tooltip {...tooltipStyles} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: chartTheme.legend }} />
                      <Bar dataKey="students" fill={chartTheme.bar[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capacity" fill={chartTheme.bar[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Student Level Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Level Distribution</CardTitle>
                  <CardDescription>Students by proficiency level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={studentLevelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, count }) => `${level}: ${count}`}
                        outerRadius={80}
                        fill={chartTheme.primary}
                        dataKey="count"
                      >
                        {studentLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyles} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Attendance Rates */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Student Attendance Rates</CardTitle>
                  <CardDescription>Top 10 students by attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: chartTheme.axis, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.grid }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: chartTheme.axis, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.grid }}
                        width={150}
                      />
                      <Tooltip {...tooltipStyles} />
                      <Bar dataKey="rate" fill={chartTheme.success} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Add, edit, and manage all students with real-time sync</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <BulkImport type="students" onImportComplete={fetchAdminData} />
                    <Button variant="outline" size="sm" onClick={() => exportStudentsToCSV()}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedStudentCRUD />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Teacher Management</CardTitle>
                    <CardDescription>Add, edit, and manage all teachers with real-time sync</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportTeachersToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <EnhancedTeacherCRUD />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Class Schedule</CardTitle>
                      <CardDescription>
                        {searchQuery && filteredClasses.length !== classes.length
                          ? `Showing ${filteredClasses.length} of ${classes.length} classes`
                          : `All active classes (${classes.length} total)`}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportClassesToCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      type="text"
                      placeholder="Search classes, teachers, or stages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      aria-label="Search classes by name, teacher, or stage"
                      title="Ctrl+/ to focus"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses
                      .slice((classesPage - 1) * classesPerPage, classesPage * classesPerPage)
                      .map((classItem) => (
                        <TableRow key={classItem.id}>
                          <TableCell className="font-medium">{classItem.class_name}</TableCell>
                          <TableCell>{classItem.teacher_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{classItem.stage}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {classItem.schedule_days?.join(', ')} • {classItem.start_time}-{classItem.end_time}
                          </TableCell>
                          <TableCell>
                            {classItem.current_students}/{classItem.max_students}
                          </TableCell>
                          <TableCell>
                            <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                              {classItem.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {filteredClasses.length > classesPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(classesPage - 1) * classesPerPage + 1} to{' '}
                      {Math.min(classesPage * classesPerPage, filteredClasses.length)} of {filteredClasses.length} classes
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClassesPage((p) => Math.max(1, p - 1))}
                        disabled={classesPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClassesPage((p) => p + 1)}
                        disabled={classesPage * classesPerPage >= filteredClasses.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                {filteredClasses.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No classes found</h3>
                    <p className="text-muted-foreground mb-4">
                      No classes match your search query "{searchQuery}"
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Full Curriculum View</CardTitle>
                <CardDescription>View and manage all curriculum entries</CardDescription>
              </CardHeader>
              <CardContent>
                <FullCurriculumView />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skills Management</CardTitle>
                <CardDescription>Manage skills and their assignments to classes</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar & Sessions</CardTitle>
                <CardDescription>Schedule and manage class sessions with real-time sync</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarSessionCRUD />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Payments</CardTitle>
                      <CardDescription>
                        {searchQuery && filteredPayments.length !== payments.length
                          ? `Showing ${filteredPayments.length} of ${payments.length} payments`
                          : `Payment transactions (${payments.length} total)`}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportPaymentsToCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search receipts, methods, or purposes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Payment For</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments
                      .slice((paymentsPage - 1) * paymentsPerPage, paymentsPage * paymentsPerPage)
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="font-mono text-sm">{payment.receipt_number}</TableCell>
                          <TableCell>{payment.payment_for}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {Number(payment.amount).toLocaleString()} VND
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {filteredPayments.length > paymentsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(paymentsPage - 1) * paymentsPerPage + 1} to{' '}
                      {Math.min(paymentsPage * paymentsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                        disabled={paymentsPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentsPage((p) => p + 1)}
                        disabled={paymentsPage * paymentsPerPage >= filteredPayments.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                {filteredPayments.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                    <p className="text-muted-foreground mb-4">
                      No payments match your search query "{searchQuery}"
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLogViewer />
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Evaluations</CardTitle>
                <CardDescription>View and manage all teacher evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <EvaluationsList mode="admin" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Tips for new users */}
      <QuickTips tips={adminDashboardTips} storageKey="admin-dashboard-tips" />
    </div>
  );
}
