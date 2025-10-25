import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";

// Lazy load all route components
const Login = lazy(() => import("./pages/Login"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const StartLesson = lazy(() => import('./pages/teacher/StartLesson'));
const EvaluateSkills = lazy(() => import('./pages/teacher/EvaluateSkills'));
const PrintablesManager = lazy(() => import('./pages/teacher/PrintablesManager'));
const HomeworkManager = lazy(() => import('./pages/teacher/HomeworkManager'));
const LessonAssessmentsManager = lazy(() => import('./pages/teacher/LessonAssessmentsManager'));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const NotFound = lazy(() => import('./pages/NotFound'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const EditEvaluationPage = lazy(() => import('./pages/EditEvaluationPage'));
const Root = lazy(() => import('./pages/Root'));

const queryClient = new QueryClient();

function AppContent() {
  return (
    <main className="p-4">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Root />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/lessons/:lessonId/start" element={<StartLesson />} />
          <Route path="/teacher/lessons/:lessonId/evaluate" element={<EvaluateSkills />} />
          <Route path="/teacher/lessons/:lessonId/printables" element={<PrintablesManager />} />
          <Route path="/teacher/lessons/:lessonId/homework" element={<HomeworkManager />} />
          <Route path="/teacher/lessons/:lessonId/assessments" element={<LessonAssessmentsManager />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/evaluation/:id" element={<EvaluationPage />} />
          <Route path="/evaluation/:id/edit" element={<EditEvaluationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </main>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <TooltipProvider>
                <div className="App">
                  <AppContent />
                  <Toaster />
                  <Sonner />
                </div>
              </TooltipProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
