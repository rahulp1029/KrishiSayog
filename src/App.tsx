import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import SoilDataPage from "./pages/dashboard/SoilDataPage";
import CropRecommendationsPage from "./pages/dashboard/CropRecommendationsPage";
import WeatherPage from "./pages/dashboard/WeatherPage";
import AlertsPage from "./pages/dashboard/AlertsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import DiseaseDetection from "./pages/DiseaseDetection";
import ChatbotPage from "./pages/ChatbotPage";
import MarketInsights from "./pages/MarketInsights";
import MarketplacePage from "./pages/dashboard/MarketplacePage";
import IotControlPage from "./pages/dashboard/IotControlPage";
import GovtSchemesPage from "./pages/dashboard/GovtSchemesPage";

// Footer pages
import BlogPage from "./pages/BlogPage";
import CareersPage from "./pages/CareersPage";
import DocumentationPage from "./pages/DocumentationPage";
import ResearchPage from "./pages/ResearchPage";
import GuidesPage from "./pages/GuidesPage";
import ApiReferencePage from "./pages/ApiReferencePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import AuthCallback from "./pages/AuthCallback";

import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="soil" element={<SoilDataPage />} />
              <Route path="crops" element={<CropRecommendationsPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="iot" element={<IotControlPage />} />
              <Route path="schemes" element={<GovtSchemesPage />} />
            </Route>
            <Route path="/disease-detection" element={<DiseaseDetection />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/market-insights" element={<MarketInsights />} />

            {/* Footer links */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/api" element={<ApiReferencePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/auth-callback" element={<AuthCallback />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
