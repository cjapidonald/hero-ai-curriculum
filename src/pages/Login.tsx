import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, GraduationCap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
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

      if (activeTab === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password',
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
            <span className="text-2xl font-bold text-background">H</span>
          </div>
          <CardTitle className="text-2xl">HeroSchool Login</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
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
                {activeTab === 'teacher' ? (
                  <div className="space-y-1">
                    <p>Email: donald@heroschool.com</p>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={activeTab === 'teacher' ? 'teacher@heroschool.com' : 'student@example.com'}
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
