import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ProfileEditor } from '@/components/ProfileEditor';
import TeacherPerformance from './TeacherPerformance';
import { TeacherStudentCRUD } from '@/components/crud/TeacherStudentCRUD';
import CurriculumManagementPanel from '@/pages/admin/components/CurriculumManagementPanel';
// MyClasses and CurriculumTab removed - curriculum system will be rebuilt

type TabType =
  | 'performance'
  | 'students'
  | 'lessonBuilder';

const TeacherDashboard = () => {
  const { user, logout, isTeacher } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: TabType[] = [
    'performance',
    'students',
    'lessonBuilder',
  ];
  const tabFromUrlParam = searchParams.get('tab');
  const tabFromUrl = validTabs.includes(tabFromUrlParam as TabType)
    ? (tabFromUrlParam as TabType)
    : null;
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
    setSearchParams(newParams);
  };

  const tabs = [
    { id: 'performance' as TabType, label: 'Performance', icon: BarChart3 },
    { id: 'students' as TabType, label: 'My Students', icon: Users },
    { id: 'lessonBuilder' as TabType, label: 'Lesson Builder', icon: FileText },
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
      case 'students':
        return (
          <div className="space-y-4">
            <div className="bg-background rounded-lg shadow p-6">
              <TeacherStudentCRUD teacherId={user.id} />
            </div>
          </div>
        );
      case 'lessonBuilder':
        return <CurriculumManagementPanel />;
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
