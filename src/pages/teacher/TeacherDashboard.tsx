import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, FileText, Award, BookMarked, LogOut, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ProfileEditor } from '@/components/ProfileEditor';
import Skills from './Skills';
import TeacherPerformance from './TeacherPerformance';
import { AssignmentCRUD } from '@/components/crud/AssignmentCRUD';
import { TeacherStudentCRUD } from '@/components/crud/TeacherStudentCRUD';
import CurriculumManagement from './CurriculumManagement';
import MyClassView from './MyClassView';

type TabType = 'performance' | 'curriculum' | 'students' | 'assignments' | 'skills';

const TeacherDashboard = () => {
  const { user, logout, isTeacher } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: TabType[] = ['performance', 'curriculum', 'students', 'assignments', 'skills'];
  const tabFromUrlParam = searchParams.get('tab');
  const tabFromUrl = validTabs.includes(tabFromUrlParam as TabType)
    ? (tabFromUrlParam as TabType)
    : null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'performance');
  const [teacherProfile, setTeacherProfile] = useState<Tables<'teachers'> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

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
    setActiveSessionId(null); // Clear active session when changing tabs
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams);
  };

  const handleStartClass = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleBackToCurriculum = () => {
    setActiveSessionId(null);
  };

  const tabs = [
    { id: 'performance' as TabType, label: 'Performance', icon: BarChart3 },
    { id: 'curriculum' as TabType, label: 'Curriculum', icon: BookMarked },
    { id: 'students' as TabType, label: 'My Students', icon: Users },
    { id: 'assignments' as TabType, label: 'Assignments', icon: FileText },
    { id: 'skills' as TabType, label: 'Skills', icon: Award },
  ];

  const renderTabContent = () => {
    // If actively in a class session, show MyClassView
    if (activeSessionId) {
      return <MyClassView sessionId={activeSessionId} onBack={handleBackToCurriculum} />;
    }

    switch (activeTab) {
      case 'performance':
        return (
          <TeacherPerformance
            teacherId={user.id}
            teacherProfile={teacherProfile}
          />
        );
      case 'curriculum':
        return <CurriculumManagement teacherId={user.id} onStartClass={handleStartClass} />;
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
        return (
          <TeacherPerformance
            teacherId={user.id}
            teacherProfile={teacherProfile}
          />
        );
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

      {/* Navigation Tabs - Hidden when in active class session */}
      {!activeSessionId && (
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
      )}

      {/* Content */}
      <div className={activeSessionId ? '' : 'container mx-auto px-4 py-8'}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TeacherDashboard;
