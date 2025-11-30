import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DoctorPortal from "./pages/DoctorPortal";
import NGOPortal from "./pages/NGOPortal";
import PatientPortal from "./pages/PatientPortal";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import NGODashboard from "./pages/NGODashboard";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
//chatbot 
import ChatbotWidget from "@/components/ChatbotWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/doctor-portal" element={<DoctorPortal />} />
            <Route path="/ngo-portal" element={<NGOPortal />} />
            <Route path="/patient-portal" element={<PatientPortal />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/ngo-dashboard" element={<NGODashboard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        <ChatbotWidget/>
      </BrowserRouter>
    </TooltipProvider>
  </LanguageProvider>
  </QueryClientProvider >
);

export default App;
