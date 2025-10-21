import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import FloatingActions from "./components/FloatingActions";
import Home from "./pages/Home";
import Curriculum from "./pages/Curriculum";
import Fees from "./pages/Fees";
import About from "./pages/About";
import Events from "./pages/Events";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from './pages/NotFound';
import EvaluationPage from './pages/EvaluationPage';
import EditEvaluationPage from './pages/EditEvaluationPage';
import Root from './pages/Root';

const queryClient = new QueryClient();

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const showNav = !user && location.pathname !== '/login';

  return (
    <>
      {showNav && <Navigation />}
      <main className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Root />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/events" element={<Events />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/evaluation/:id" element={<EvaluationPage />} />
          <Route path="/evaluation/:id/edit" element={<EditEvaluationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showNav && <Footer />}
      {showNav && <FloatingActions />}
    </>
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
