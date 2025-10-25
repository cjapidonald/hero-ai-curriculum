import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StartLesson from './pages/teacher/StartLesson';
import EvaluateSkills from './pages/teacher/EvaluateSkills';
import PrintablesManager from './pages/teacher/PrintablesManager';
import HomeworkManager from './pages/teacher/HomeworkManager';
import LessonAssessmentsManager from './pages/teacher/LessonAssessmentsManager';
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from './pages/NotFound';
import EvaluationPage from './pages/EvaluationPage';
import EditEvaluationPage from './pages/EditEvaluationPage';
import Root from './pages/Root';

const queryClient = new QueryClient();

function AppContent() {
  return (
    <main className="p-4">
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
