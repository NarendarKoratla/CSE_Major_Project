import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  Users,
  Download,
  RefreshCw,
  Trash2,
  Clock,
  Utensils,
  Activity,
  CheckCircle,
  Moon,
  Droplets,
  Flame,
  Sun,
  Zap,
  Apple
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  patient_id: string;
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  location: string;
  created_at: string;
  last_assessment?: string;
}

interface Assessment {
  id: string;
  patient_id: string;
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

export default function PatientsTab() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAssessments, setPatientAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [patientsResp, assessmentsResp] = await Promise.all([
        fetch("http://127.0.0.1:8000/patients"),
        fetch("http://127.0.0.1:8000/assessments")
      ]);

      if (patientsResp.ok && assessmentsResp.ok) {
        const patientsData = await patientsResp.json();
        const assessmentsData = await assessmentsResp.json();

        // Merge backend data with local storage for maximum availability
        const localPatients = JSON.parse(localStorage.getItem('patients') || '[]');
        const localAssessments = JSON.parse(localStorage.getItem('assessments') || '[]');

        const allPatients = [...patientsData];
        localPatients.forEach((lp: any) => {
          if (!allPatients.find(ap => ap.patient_id === lp.patient_id)) {
            allPatients.push(lp);
          }
        });

        const allAssessments = [...assessmentsData];
        localAssessments.forEach((la: any) => {
          if (!allAssessments.find(aa => aa.id === la.id)) {
            allAssessments.push(la);
          }
        });

        setPatients(allPatients);
        setAssessments(allAssessments);
      } else {
        throw new Error("Backend unavailable");
      }
    } catch (error) {
      console.warn("Using local storage fallback", error);
      const storedPatients = JSON.parse(localStorage.getItem('patients') || '[]');
      const storedAssessments = JSON.parse(localStorage.getItem('assessments') || '[]');
      setPatients(storedPatients);
      setAssessments(storedAssessments);
    }
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to delete all patient data? This cannot be undone.")) {
      localStorage.removeItem('patients');
      localStorage.removeItem('assessments');
      setPatients([]);
      setAssessments([]);
      toast({ title: "Data Cleared", description: "All patient records have been removed." });
    }
  };

  const getLatestAssessment = (patientId: string): Assessment | null => {
    const patientAssessments = assessments.filter(a => a.patient_id === patientId);
    return patientAssessments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return "bg-medical-danger text-white";
      case "High": return "bg-medical-danger text-white";
      case "Moderate": return "bg-medical-warning text-white";
      case "Low": return "bg-medical-success text-white";
      default: return "bg-medical-info text-white";
    }
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case "Underweight": return "bg-medical-warning text-white";
      case "Normal": return "bg-medical-success text-white";
      case "Overweight": return "bg-medical-warning text-white";
      case "Obese": return "bg-medical-danger text-white";
      default: return "bg-medical-info text-white";
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (riskFilter === "all") return true;

    const latestAssessment = getLatestAssessment(patient.patient_id);
    return latestAssessment?.result.risk_level.toLowerCase() === riskFilter.toLowerCase();
  });

  const handleViewPatientHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    const patientAssessmentHistory = assessments.filter(a => a.patient_id === patient.patient_id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setPatientAssessments(patientAssessmentHistory);
  };

  const exportPatients = () => {
    const csvData = filteredPatients.map(patient => {
      const latestAssessment = getLatestAssessment(patient.patient_id);
      return {
        'Patient ID': patient.patient_id,
        // 'Name': patient.name, // Removed for anonymity
        'Age': patient.age,
        'Gender': patient.gender,
        'Height (cm)': patient.height,
        'Weight (kg)': patient.weight,
        'Location': patient.location,
        'Created Date': new Date(patient.created_at).toLocaleDateString(),
        'Last Assessment': patient.last_assessment ? new Date(patient.last_assessment).toLocaleDateString() : 'Never',
        'Latest BMI': latestAssessment?.result.bmi.toFixed(1) || 'N/A',
        'BMI Category': latestAssessment?.result.bmi_category || 'N/A',
        'Risk Level': latestAssessment?.result.risk_level || 'N/A',
        'Risk Score (%)': latestAssessment?.result.malnutrition_risk ? Math.round(latestAssessment.result.malnutrition_risk * 100) : 'N/A'
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overall_patients_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const totalPatients = patients.length;
    const withAssessments = patients.filter(p => getLatestAssessment(p.patient_id)).length;
    const riskCounts = {
      Critical: 0,
      High: 0,
      Moderate: 0,
      Low: 0
    };

    patients.forEach(patient => {
      const latest = getLatestAssessment(patient.patient_id);
      if (latest) {
        riskCounts[latest.result.risk_level as keyof typeof riskCounts]++;
      }
    });

    return { totalPatients, withAssessments, riskCounts };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-medical-info" />
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-info">{stats.totalPatients}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.withAssessments} with assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-danger">
              {stats.riskCounts.High + stats.riskCounts.Critical}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.riskCounts.Critical} critical cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Moderate Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-warning">{stats.riskCounts.Moderate}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Requires monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-success">{stats.riskCounts.Low}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Healthy status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Patients</CardTitle>
          <CardDescription>
            Monitor anonymous patient records and assessment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={exportPatients}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button variant="destructive" onClick={handleClearData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </div>

          {/* Patients Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Last Assessment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No patients found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => {
                    const latestAssessment = getLatestAssessment(patient.patient_id);
                    return (
                      <TableRow key={patient.patient_id}>
                        <TableCell className="text-sm">
                          {new Date(patient.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[150px] truncate" title={patient.patient_id}>
                          {patient.patient_id}
                        </TableCell>
                        <TableCell>
                          {patient.age}y • {patient.gender}
                        </TableCell>
                        <TableCell>
                          {latestAssessment ? (
                            <div className="space-y-1">
                              <div className="font-medium">
                                {latestAssessment.result.bmi.toFixed(1)}
                              </div>
                              <Badge className={`text-xs ${getBMIColor(latestAssessment.result.bmi_category)}`}>
                                {latestAssessment.result.bmi_category}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {latestAssessment ? (
                            <Badge className={getRiskColor(latestAssessment.result.risk_level)}>
                              {latestAssessment.result.risk_level}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No assessment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient.last_assessment ? (
                            <div className="text-sm">
                              <div>{new Date(patient.last_assessment).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                {new Date(patient.last_assessment).toLocaleTimeString([], {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPatientHistory(patient)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[90vh]">
                              <DialogHeader>
                                <DialogTitle>
                                  Patient Findings
                                </DialogTitle>
                                <DialogDescription>
                                  Patient ID: {selectedPatient?.patient_id} •
                                  {selectedPatient?.age} years old •
                                  {selectedPatient?.gender}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 max-h-96 overflow-auto">
                                {patientAssessments.length === 0 ? (
                                  <p className="text-center text-muted-foreground py-8">
                                    No assessments found for this patient
                                  </p>
                                ) : (
                                  patientAssessments.map((assessment, index) => (
                                    <Card key={assessment.id}>
                                      <CardHeader className="pb-3">
                                        <div className="flex justify-between items-center">
                                          <CardTitle className="text-lg">
                                            Assessment #{patientAssessments.length - index}
                                          </CardTitle>
                                          <div className="text-sm text-muted-foreground">
                                            {new Date(assessment.timestamp).toLocaleString()}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-4 gap-4">
                                          <div className="text-center">
                                            <div className="text-2xl font-bold">
                                              {assessment.result.bmi.toFixed(1)}
                                            </div>
                                            <Badge className={getBMIColor(assessment.result.bmi_category)}>
                                              {assessment.result.bmi_category}
                                            </Badge>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-2xl font-bold">
                                              {Math.round(assessment.result.malnutrition_risk * 100)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Risk Score
                                            </div>
                                          </div>
                                          <div className="text-center">
                                            <Badge className={getRiskColor(assessment.result.risk_level)}>
                                              {assessment.result.risk_level}
                                            </Badge>
                                          </div>
                                          <div className="text-center">
                                            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-medical-info" />
                                            <div className="text-xs text-muted-foreground">
                                              Track Progress
                                            </div>
                                          </div>
                                        </div>

                                        {/* Detailed Recommendations Display */}
                                        <div className="mt-6 space-y-6">
                                          {/* AI Explanation / Analysis */}
                                          {assessment.result.recommendations?.explanation && (
                                            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                                              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
                                                <Activity className="h-3.5 w-3.5" /> AI Analysis & Summary
                                              </div>
                                              <p className="text-sm text-blue-900 font-medium leading-relaxed italic">
                                                "{assessment.result.recommendations.explanation}"
                                              </p>
                                            </div>
                                          )}

                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Daily Habits */}
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                                                <Moon className="h-3.5 w-3.5" /> Daily Habits
                                              </div>
                                              <div className="space-y-2">
                                                {Array.isArray(assessment.result.recommendations?.daily_habits) ? (
                                                  assessment.result.recommendations.daily_habits.map((habit: any, i: number) => (
                                                    <div key={i} className="p-2 rounded-lg bg-purple-50/50 border border-purple-100/50">
                                                      <p className="text-[10px] font-bold text-purple-600 uppercase">{habit.category || 'Lifestyle'}</p>
                                                      <p className="text-[11px] font-medium leading-tight">{typeof habit === 'string' ? habit : habit.text}</p>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                    <p className="text-xs text-gray-500 italic">No specific daily habits recorded.</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Nutrition */}
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                                                <Utensils className="h-3.5 w-3.5" /> Nutrition
                                              </div>
                                              <div className="space-y-2">
                                                {Array.isArray(assessment.result.recommendations?.dietary_tips) ? (
                                                  assessment.result.recommendations.dietary_tips.map((tip: any, i: number) => (
                                                    <div key={i} className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                                                      <p className="text-[10px] font-bold text-emerald-600 uppercase">{tip.category || 'Diet'}</p>
                                                      <p className="text-[11px] font-medium leading-tight">{typeof tip === 'string' ? tip : tip.text}</p>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                                                    <p className="text-xs font-medium text-emerald-900">
                                                      {typeof assessment.result.recommendations === 'string'
                                                        ? assessment.result.recommendations
                                                        : "Refer to general nutritional guidelines for risk level."}
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Next Steps */}
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                                                <Activity className="h-3.5 w-3.5" /> Next Steps
                                              </div>
                                              <div className="space-y-2">
                                                {Array.isArray(assessment.result.recommendations?.next_steps) ? (
                                                  assessment.result.recommendations.next_steps.map((step: any, i: number) => (
                                                    <div key={i} className="p-2 rounded-lg bg-amber-50/50 border border-amber-100/50">
                                                      <p className="text-[10px] font-bold text-amber-600 uppercase">{step.category || 'Care'}</p>
                                                      <p className="text-[11px] font-medium leading-tight">{typeof step === 'string' ? step : step.text}</p>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="p-3 rounded-lg bg-amber-50/30 border border-amber-100/30">
                                                    <p className="text-xs text-amber-800 italic">Follow standard medical protocol for {assessment.result.risk_level.toLowerCase()} risk.</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Schedule & Core Habits */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            {assessment.result.recommendations?.schedule && (
                                              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-4">
                                                  <Clock className="h-3.5 w-3.5" /> Daily Health Schedule
                                                </div>
                                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                  {assessment.result.recommendations.schedule.map((item, i) => (
                                                    <div key={i} className="flex gap-3 text-xs">
                                                      <span className="font-bold text-blue-600 whitespace-nowrap">{item.time}</span>
                                                      <div>
                                                        <div className="font-semibold text-gray-900">{item.activity}</div>
                                                        <div className="text-gray-500 mt-0.5">{item.details}</div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {assessment.result.recommendations?.core_habits && (
                                              <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-xl">
                                                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-4">
                                                  <Zap className="h-3.5 w-3.5" /> Core Healthy Habits
                                                </div>
                                                <ul className="space-y-3">
                                                  {assessment.result.recommendations.core_habits.map((habit, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                      <CheckCircle className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                                                      <span className="text-xs font-medium text-gray-700 leading-tight">{habit}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}