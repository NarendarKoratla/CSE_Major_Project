import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Users,
  BarChart3,
  Settings,
  FileText,
  Plus,
  LayoutDashboard
} from "lucide-react";
import DashboardTab from "@/components/tabs/DashboardTab";
import NewAssessmentTab from "@/components/tabs/NewAssessmentTab";
import PatientsTab from "@/components/tabs/PatientsTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";
import ModelsTab from "@/components/tabs/ModelsTab";
import SettingsTab from "@/components/tabs/SettingsTab";
import MedicalChatbot from "@/components/chatbot/MedicalChatbot";

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState("assessment");
  const [userName, setUserName] = useState<string | null>(null);

  useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed.full_name || parsed.email);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  });


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md shadow-lg">
                <Stethoscope className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  NutriVision
                </h1>
                <p className="text-sm text-white/90 mt-1">
                  AI-powered nutritional screening system
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userName && (
                <span className="text-white font-medium hidden sm:block text-lg">
                  {userName}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-14 w-14 transition-colors border-2 border-white/20"
                onClick={() => window.location.href = '/profile'}
                title="My Profile"
              >
                <Users className="h-8 w-8" />
              </Button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-10 bg-white/95 backdrop-blur-md border-2 border-indigo-100 shadow-xl rounded-3xl p-3 h-auto">
            <TabsTrigger value="assessment" className="py-4 flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all text-base font-bold">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Assessment</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>

            <TabsTrigger value="dashboard" className="py-4 flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all text-base font-bold">
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>

            <TabsTrigger value="patients" className="py-4 flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all text-base font-bold">
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline">Patients</span>
              <span className="sm:hidden">Pts</span>
            </TabsTrigger>

            <TabsTrigger value="analytics" className="py-4 flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all text-base font-bold">
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>

            <TabsTrigger value="models" className="py-4 flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all text-base font-bold">
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline">Models</span>
              <span className="sm:hidden">ML</span>
            </TabsTrigger>

            <TabsTrigger value="settings" className="py-4 flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all text-base font-bold">
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Set</span>
            </TabsTrigger>
          </TabsList>


          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <NewAssessmentTab />
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <PatientsTab />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <ModelsTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Medical Chatbot */}
      <MedicalChatbot />

      {/* Footer */}
      <footer className="mt-20 border-t bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
        <div className="max-w-[1800px] mx-auto px-6 py-10">
          <div className="text-center text-sm text-gray-600">
            <p>
              <strong className="text-gray-800">Medical Disclaimer:</strong> This tool is for screening purposes only and should not replace
              professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers
              for comprehensive evaluation.
            </p>
            <p className="mt-2 text-gray-500">
              © 2024 NutriVision. Designed for healthcare professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}