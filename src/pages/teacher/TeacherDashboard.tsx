import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Award, Lightbulb, BookMarked, LogOut } from 'lucide-react';
import MyClasses from './MyClasses';
import CurriculumTab from './CurriculumTab';
import MyStudents from './MyStudents';
import Assessment from './Assessment';
import Skills from './Skills';
import Blog from './Blog';

type TabType = 'classes' | 'curriculum' | 'students' | 'assessment' | 'skills' | 'blog';

const TeacherDashboard = () => {
  const { user, logout, isTeacher } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('classes');

  if (!isTeacher || !user) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'classes' as TabType, label: 'My Classes', icon: BookOpen },
    { id: 'curriculum' as TabType, label: 'Curriculum', icon: BookMarked },
    { id: 'students' as TabType, label: 'My Students', icon: Users },
    { id: 'assessment' as TabType, label: 'Assessment', icon: FileText },
    { id: 'skills' as TabType, label: 'Skills', icon: Award },
    { id: 'blog' as TabType, label: 'Blog', icon: Lightbulb },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'classes':
        return <MyClasses teacherId={user.id} />;
      case 'curriculum':
        return <CurriculumTab teacherId={user.id} teacherName={`${user.name} ${user.surname}`} />;
      case 'students':
        return <MyStudents teacherId={user.id} />;
      case 'assessment':
        return <Assessment teacherId={user.id} />;
      case 'skills':
        return <Skills teacherId={user.id} />;
      case 'blog':
        return <Blog />;
      default:
        return <MyClasses teacherId={user.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-background">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, Teacher {user.name}!
                </h1>
                <p className="text-sm text-muted-foreground">{user.subject}</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="gap-2 rounded-none border-b-2 border-transparent data-[active=true]:border-primary whitespace-nowrap"
                  data-active={activeTab === tab.id}
                >
                  <Icon size={18} />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TeacherDashboard;
