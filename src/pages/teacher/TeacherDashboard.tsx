import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Award, Lightbulb, BookMarked, LogOut, Calendar, BarChart3, Blocks } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ProfileEditor } from '@/components/ProfileEditor';
import MyClasses from './MyClasses';
import CurriculumTab from './CurriculumTab';
import MyStudents from './MyStudents';
import Skills from './Skills';
import CalendarTab from './CalendarTab';
import TeacherPerformance from './TeacherPerformance';
import { EnhancedLessonPlanner } from './EnhancedLessonPlanner';
import { CurriculumCRUD } from '@/components/crud/CurriculumCRUD';
import { CalendarSessionCRUD } from '@/components/crud/CalendarSessionCRUD';
import { AssignmentCRUD } from '@/components/crud/AssignmentCRUD';
import { StudentCRUD } from '@/components/crud/StudentCRUD';
import { TeacherStudentCRUD } from '@/components/crud/TeacherStudentCRUD';

type TabType = 'performance' | 'calendar' | 'classes' | 'curriculum' | 'lessonbuilder' | 'students' | 'assignments' | 'skills';

const TeacherDashboard = () => {
  const { user, logout, isTeacher } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const lessonIdFromUrl = searchParams.get('lessonId') || undefined;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'performance');
  const [teacherProfile, setTeacherProfile] = useState<Tables<'teachers'> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!user?.id) {
        return;
      }

      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error('Error loading teacher profile:', error);
        }

        setTeacherProfile(data ?? null);
      } catch (profileError) {
        if (isMounted) {
          console.error('Unexpected profile error:', profileError);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Keep the active tab in sync with the URL query string
  useEffect(() => {
    if (!tabFromUrl) {
      setActiveTab('performance');
      return;
    }
    setActiveTab((current) => (current === tabFromUrl ? current : tabFromUrl));
  }, [tabFromUrl]);

  if (!isTeacher || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    if (tabId !== 'lessonbuilder') {
      newParams.delete('lessonId');
    }
    setSearchParams(newParams);
  };

  const handleLessonEdit = (lessonId: string) => {
    setActiveTab('lessonbuilder');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'lessonbuilder');
    newParams.set('lessonId', lessonId);
    setSearchParams(newParams);
  };

  const tabs = [
    { id: 'performance' as TabType, label: 'My Performance', icon: BarChart3 },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'classes' as TabType, label: 'My Classes', icon: BookOpen },
    { id: 'curriculum' as TabType, label: 'Curriculum', icon: BookMarked },
    { id: 'lessonbuilder' as TabType, label: 'Lesson Builder', icon: Blocks },
    { id: 'students' as TabType, label: 'My Students', icon: Users },
    { id: 'assignments' as TabType, label: 'Assignments', icon: FileText },
    { id: 'skills' as TabType, label: 'Skills', icon: Award },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return (
          <TeacherPerformance
            teacherId={user.id}
            teacherProfile={teacherProfile}
          />
        );
      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="bg-background rounded-lg shadow p-6">
              <CalendarSessionCRUD teacherId={user.id} />
            </div>
          </div>
        );
      case 'classes':
        return <MyClasses teacherId={user.id} />;
      case 'curriculum':
        return (
          <div className="space-y-4">
            <div className="bg-background rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Manage Curriculum</h2>
              <p className="text-muted-foreground mb-4">Create and edit lessons with resources and materials</p>
              <CurriculumCRUD teacherId={user.id} onEditLesson={handleLessonEdit} />
            </div>
          </div>
        );
      case 'lessonbuilder':
        return (
          <EnhancedLessonPlanner
            teacherId={user.id}
            teacherName={`${user.name} ${user.surname}`}
            lessonId={lessonIdFromUrl}
          />
        );
      case 'students':
        return (
          <div className="space-y-4">
            <div className="bg-background rounded-lg shadow p-6">
              <TeacherStudentCRUD teacherId={user.id} />
            </div>
          </div>
        );
      case 'assignments':
        return (
          <div className="space-y-4">
            <div className="bg-background rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Manage Assignments</h2>
              <p className="text-muted-foreground mb-4">Create and manage assignments for your classes</p>
              <AssignmentCRUD teacherId={user.id} />
            </div>
          </div>
        );
      case 'skills':
        return <Skills teacherId={user.id} />;
      default:
        return <CalendarTab teacherId={user.id} teacherName={`${user.name} ${user.surname}`} />;
    }
  };

  const resolvedName = teacherProfile
    ? `${teacherProfile.name} ${teacherProfile.surname}`
    : `${user.name} ${user.surname}`;

  const teacherSubject = teacherProfile?.subject ?? user.subject ?? 'Teacher';

  const profileImageUrl = teacherProfile?.profile_image_url ?? user.profileImageUrl;

  const avatarFallback = `${(teacherProfile?.name ?? user.name).charAt(0)}${(
    teacherProfile?.surname ?? user.surname
  ).charAt(0)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                {profileImageUrl ? (
                  <AvatarImage src={profileImageUrl} alt={resolvedName} />
                ) : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, Teacher {resolvedName}!
                </h1>
                <p className="text-sm text-muted-foreground">
                  {teacherSubject}
                  {loadingProfile && <span className="ml-2 text-xs text-muted-foreground">(syncing profile...)</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProfileEditor userType="teacher" />
              <NotificationCenter />
              <Button variant="outline" onClick={logout} className="gap-2">
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => handleTabChange(tab.id)}
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
