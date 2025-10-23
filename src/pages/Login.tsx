import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, GraduationCap, AlertCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'teacher' | 'student'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password, activeTab);

    if (success) {
      toast({
        title: 'Welcome!',
        description: `Logged in successfully as ${activeTab}`,
      });

      if (activeTab === 'admin') {
        navigate('/admin/dashboard');
      } else if (activeTab === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent-teal/10 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <img src="/logo.svg" alt="HeroSchool Logo" className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl">HeroSchool Login</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button
              type="button"
              variant={activeTab === 'admin' ? 'default' : 'outline'}
              onClick={() => setActiveTab('admin')}
              className="gap-2"
            >
              <Shield size={18} />
              Admin
            </Button>
            <Button
              type="button"
              variant={activeTab === 'teacher' ? 'default' : 'outline'}
              onClick={() => setActiveTab('teacher')}
              className="gap-2"
            >
              <GraduationCap size={18} />
              Teacher
            </Button>
            <Button
              type="button"
              variant={activeTab === 'student' ? 'default' : 'outline'}
              onClick={() => setActiveTab('student')}
              className="gap-2"
            >
              <UserCircle size={18} />
              Student
            </Button>
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-muted p-4 rounded-lg mb-6 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-2">Demo Credentials:</p>
                {activeTab === 'admin' ? (
                  <div className="space-y-1">
                    <p>Email: admin@heroschool.com</p>
                    <p>Password: admin123</p>
                  </div>
                ) : activeTab === 'teacher' ? (
                  <div className="space-y-1">
                    <p>Email or Username: donald / donald@heroschool.com</p>
                    <p>Password: teacher123</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p>Email: emma@student.com</p>
                    <p>Password: student123</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{activeTab === 'teacher' ? 'Email or Username' : 'Email'}</Label>
              <Input
                id="email"
                type={activeTab === 'teacher' ? 'text' : 'email'}
                placeholder={activeTab === 'admin' ? 'admin@heroschool.com' : activeTab === 'teacher' ? 'donald / donald@heroschool.com' : 'student@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>For demo purposes only</p>
            <p className="mt-2">
              Need help? Contact{' '}
              <a href="mailto:admin@heroschool.com" className="text-primary hover:underline">
                admin@heroschool.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
