import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface Tip {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface QuickTipsProps {
  tips: Tip[];
  storageKey: string;
  autoShow?: boolean;
}

/**
 * Quick tips component for onboarding and feature discovery
 */
export function QuickTips({ tips, storageKey, autoShow = true }: QuickTipsProps) {
  const [dismissed, setDismissed] = useLocalStorage(`${storageKey}-dismissed`, false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (autoShow && !dismissed && tips.length > 0) {
      // Show tips after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoShow, dismissed, tips.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  const handleNext = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1);
    }
  };

  if (!isVisible || dismissed || tips.length === 0) {
    return null;
  }

  const currentTip = tips[currentTipIndex];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{currentTip.title}</CardTitle>
                <CardDescription className="text-xs">
                  Tip {currentTipIndex + 1} of {tips.length}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
              aria-label="Dismiss tips"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{currentTip.description}</p>

          {currentTip.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={currentTip.action.onClick}
              className="w-full"
            >
              {currentTip.action.label}
            </Button>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentTipIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-1">
              {tips.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === currentTipIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={handleNext}>
              {currentTipIndex === tips.length - 1 ? 'Done' : 'Next'}
              {currentTipIndex < tips.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Pre-configured tips for different dashboard types
 */
export const adminDashboardTips: Tip[] = [
  {
    id: 'admin-keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Press Ctrl+R to refresh data, Ctrl+1-4 to switch tabs, and Ctrl+/ to focus the search bar.',
  },
  {
    id: 'admin-export',
    title: 'Export Data',
    description: 'Click the "Export CSV" button on any tab to download data for offline analysis.',
  },
  {
    id: 'admin-search',
    title: 'Search & Filter',
    description: 'Use the search bar to quickly find classes, teachers, or payments. Results update in real-time.',
  },
  {
    id: 'admin-realtime',
    title: 'Real-time Updates',
    description: 'Data updates automatically when changes occur. Look for the "Updated just now" indicator.',
  },
];

export const teacherDashboardTips: Tip[] = [
  {
    id: 'teacher-my-classes',
    title: 'My Classes',
    description: 'View all your assigned classes and students. Use the search bar to find specific students quickly.',
  },
  {
    id: 'teacher-attendance',
    title: 'Take Attendance',
    description: 'Click "Take Attendance" on any class to record student attendance for today.',
  },
  {
    id: 'teacher-tabs',
    title: 'Navigate Tabs',
    description: 'Switch between Performance, Calendar, Classes, and other sections using the tabs above.',
  },
];

export const studentDashboardTips: Tip[] = [
  {
    id: 'student-progress',
    title: 'Track Your Progress',
    description: 'View your skills progress, assessment scores, and attendance in one place.',
  },
  {
    id: 'student-quick-actions',
    title: 'Quick Actions',
    description: 'Use quick action buttons to contact your teacher, submit homework, or get help.',
  },
  {
    id: 'student-goals',
    title: 'Set Goals',
    description: 'Check your target scores and track how close you are to achieving them.',
  },
];
