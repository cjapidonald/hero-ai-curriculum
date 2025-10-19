import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Users, GraduationCap, Calendar, DollarSign, TrendingUp, BookOpen, Award } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import { EnhancedStudentCRUD } from "@/components/crud/EnhancedStudentCRUD";
import { EnhancedTeacherCRUD } from "@/components/crud/EnhancedTeacherCRUD";
import { SkillsManagement } from "@/components/crud/SkillsManagement";
import { FullCurriculumView } from "@/components/crud/FullCurriculumView";
import { CalendarSessionCRUD } from "@/components/crud/CalendarSessionCRUD";

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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdminData();
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

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-purple-200">
              <span className="text-lg font-semibold text-white">
                {user?.name?.[0]}{user?.name?.[1]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{user?.name}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs">Administrator</Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
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
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="curriculum">Full Curriculum</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
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
                      <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} angle={-45} textAnchor="end" height={100} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capacity" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
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
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {studentLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
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
                      <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" strokeOpacity={0.5} horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={150} />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Add, edit, and manage all students with real-time sync</CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedStudentCRUD />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Management</CardTitle>
                <CardDescription>Add, edit, and manage all teachers with real-time sync</CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedTeacherCRUD />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Class Schedule</CardTitle>
                <CardDescription>All active classes</CardDescription>
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
                    {classes.map((classItem) => (
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
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest 10 transactions</CardDescription>
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
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
