import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Clock, 
  Zap, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  Calendar,
  Weight,
  Ruler,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Assessment {
  id: string;
  patient_id: string;
  patient_data: {
    name: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    location: string;
  };
  result: {
    bmi: number;
    bmi_category: string;
    risk_level: string;
    malnutrition_risk: number;
    recommendations: {
      daily_habits: { text: string; category: string }[];
      dietary_tips: { text: string; category: string }[];
      next_steps: { text: string; category: string }[];
      explanation: string;
      schedule?: Array<{ time: string; activity: string; details: string }>;
      core_habits?: string[];
    };
  };
  timestamp: string;
}

export default function DashboardTab() {
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userEmail = storedUser.email;
        const userName = storedUser.full_name;

        // Fetch from backend
        const response = await fetch("http://127.0.0.1:8000/assessments");
        if (response.ok) {
          const allAssessments = await response.json();
          
          // Filter for assessments that match the logged in user
          // We check either against user_email (if stored in DB) or patient name matching user profile name
          const userAssessments = allAssessments.filter((a: any) => 
            a.user_email === userEmail || a.patient_data.name === userName || a.patient_data.name === userEmail
          ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          if (userAssessments.length > 0) {
            setLatestAssessment(userAssessments[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return "bg-red-500 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Moderate": return "bg-amber-500 text-white";
      case "Low": return "bg-emerald-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case "Underweight": return "bg-amber-500 text-white";
      case "Normal": return "bg-emerald-500 text-white";
      case "Overweight": return "bg-amber-500 text-white";
      case "Obese": return "bg-red-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Activity className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!latestAssessment) {
    return (
      <Card className="border-dashed border-2 py-16 bg-white/50 backdrop-blur-sm text-center">
        <CardContent className="flex flex-col items-center justify-center">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <User className="h-12 w-12 text-gray-300" />
          </div>
          <CardTitle className="text-gray-500 text-xl">No Recent Assessment</CardTitle>
          <CardDescription className="max-w-xs mt-2 text-base">
            Complete your first nutritional assessment to see your personalized dashboard.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const { patient_data, result, timestamp } = latestAssessment;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Info Card */}
        <Card className="lg:col-span-4 border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <User className="h-32 w-32" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <User className="h-6 w-6" />
              Personal Overview
            </CardTitle>
            <CardDescription className="text-white/70">Latest profile data from {new Date(timestamp).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-blue-200 mb-1">Full Name</p>
                <p className="font-bold text-lg truncate">{patient_data.name}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-blue-200 mb-1">Gender / Age</p>
                <p className="font-bold text-lg">{patient_data.gender} • {patient_data.age}y</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="h-3 w-3 text-blue-200" />
                  <p className="text-[10px] uppercase font-bold text-blue-200">Height</p>
                </div>
                <p className="font-bold text-lg">{patient_data.height} cm</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Weight className="h-3 w-3 text-blue-200" />
                  <p className="text-[10px] uppercase font-bold text-blue-200">Weight</p>
                </div>
                <p className="font-bold text-lg">{patient_data.weight} kg</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 mt-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-bold text-blue-100 uppercase mb-2">Current BMI</p>
                  <div className="text-4xl font-black">{result.bmi.toFixed(1)}</div>
                </div>
                <Badge className={`${getBMIColor(result.bmi_category)} px-3 py-1 font-bold`}>
                  {result.bmi_category}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Status & Risk Card */}
        <Card className="lg:col-span-8 border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Current Health Status
                </CardTitle>
                <CardDescription>AI-powered malnutrition risk assessment</CardDescription>
              </div>
              <Badge className={`${getRiskColor(result.risk_level)} px-4 py-1.5 text-sm font-bold shadow-md`}>
                {result.risk_level} Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-600 uppercase">Malnutrition Risk Score</span>
                    <span className="text-sm font-black text-gray-900">{Math.round(result.malnutrition_risk * 100)}%</span>
                  </div>
                  <Progress value={result.malnutrition_risk * 100} className="h-3" />
                </div>
                
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> AI Clinical Summary
                  </p>
                  <p className="text-sm text-blue-900 font-medium leading-relaxed italic">
                    "{result.recommendations.explanation}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="h-8 w-8 text-indigo-500 mb-2" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Health Trend</p>
                  <p className="text-sm font-bold text-gray-800">Stable</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Next Review</p>
                  <p className="text-sm font-bold text-gray-800">30 Days</p>
                </div>
                <div className="col-span-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Primary Goal</p>
                    <p className="text-sm font-bold text-emerald-900">Maintain Nutritional Balance</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule & Habits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule Card */}
        <Card className="lg:col-span-8 border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="h-6 w-6" />
              Daily Fitness & Health Schedule
            </CardTitle>
            <CardDescription>Optimized timings for your activities and food intake</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 font-bold">Time Range</th>
                    <th className="px-6 py-4 font-bold">Planned Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(result.recommendations.schedule || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap align-top">{item.time}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{item.activity}</div>
                        <div className="text-xs text-gray-500 leading-relaxed font-medium">{item.details}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Habits Card */}
        <Card className="lg:col-span-4 border-none shadow-xl bg-gradient-to-b from-purple-50 to-white overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Zap className="h-6 w-6" />
              Core Healthy Habits
            </CardTitle>
            <CardDescription>Actionable daily guidelines for consistency</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <div className="space-y-4">
              {(result.recommendations.core_habits || []).map((habit, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-default group">
                  <div className="mt-1 p-2 bg-purple-100 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <CheckCircle className="h-4 w-4 text-purple-600 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 leading-tight group-hover:text-gray-900 transition-colors">{habit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 rounded-3xl bg-indigo-600 text-white text-center shadow-lg transform hover:-rotate-1 transition-transform">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">Pro Tip</p>
              <p className="text-sm font-bold leading-relaxed">
                "Consistency is better than perfection. Follow 80% of your schedule for 100% results."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
