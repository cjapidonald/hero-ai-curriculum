import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navigation />
    <main className="flex-1 pt-16 md:pt-20">{children}</main>
    <Footer />
    <FloatingActions />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/curriculum" element={<Layout><Curriculum /></Layout>} />
                <Route path="/fees" element={<Layout><Fees /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/events" element={<Layout><Events /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
