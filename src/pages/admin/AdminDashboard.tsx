import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Users, GraduationCap, Calendar, DollarSign, TrendingUp, BookOpen, Award } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
  });
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

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

      // Fetch students
      const { data: studentsData } = await supabase
        .from('dashboard_students')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch teachers
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true);

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(10);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      setStudents(studentsData || []);
      setTeachers(teachersData || []);
      setClasses(classesData || []);
      setPayments(paymentsData || []);
      setEvents(eventsData || []);

      // Calculate stats
      const totalRevenue = paymentsData?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      const activeStudents = studentsData?.filter(s => s.is_active).length || 0;

      setStats({
        totalStudents: studentsData?.length || 0,
        activeStudents,
        totalTeachers: teachersData?.length || 0,
        totalClasses: classesData?.length || 0,
        totalRevenue,
        upcomingEvents: eventsData?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Chart data
  const classDistributionData = classes.map(c => ({
    name: c.class_name,
    students: c.current_students,
    capacity: c.max_students,
  }));

  const studentLevelData = students.reduce((acc: any[], student) => {
    const existing = acc.find(item => item.level === student.level);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ level: student.level || 'Unknown', count: 1 });
    }
    return acc;
  }, []);

  const attendanceData = students.slice(0, 10).map(s => ({
    name: `${s.name} ${s.surname}`,
    rate: Number(s.attendance_rate) || 0,
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
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
                <CardTitle>Student List</CardTitle>
                <CardDescription>All registered students</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.name} {student.surname}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.level}</Badge>
                        </TableCell>
                        <TableCell>{Number(student.attendance_rate).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={student.is_active ? 'default' : 'secondary'}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Directory</CardTitle>
                <CardDescription>All teaching staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teachers.map((teacher) => (
                    <Card key={teacher.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          {teacher.profile_image_url ? (
                            <img src={teacher.profile_image_url} alt={teacher.name} className="w-16 h-16 rounded-full" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xl font-semibold">{teacher.name[0]}{teacher.surname[0]}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">{teacher.name} {teacher.surname}</h3>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{teacher.subject}</Badge>
                            </div>
                          </div>
                        </div>
                        {teacher.bio && (
                          <p className="text-sm text-muted-foreground mt-3">{teacher.bio}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
