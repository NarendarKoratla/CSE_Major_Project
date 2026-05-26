import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  CheckCircle,
  Target,
  Activity,
  Zap
} from "lucide-react";

export default function ModelsTab() {
  const models = [
    {
      name: "Random Forest Classifier",
      accuracy: 91.7,
      status: "Primary",
      features: "Age, BMI, Weight, Gender"
    },
    {
      name: "Support Vector Machine",
      accuracy: 89.3,
      status: "Secondary",
      features: "Physical Metrics"
    }
  ];

  return (
    <div className="space-y-6">
      {/* AI Brain Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-medical-info/10 to-transparent border-medical-info/20 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-medical-info/20 rounded-lg">
                <Brain className="h-6 w-6 text-medical-info" />
              </div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">AI Intelligence</div>
            </div>
            <div className="text-4xl font-black text-gray-800">93.2%</div>
            <div className="text-xs text-muted-foreground mt-1">Consensus Accuracy Level</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-medical-success/10 to-transparent border-medical-success/20 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-medical-success/20 rounded-lg">
                <Target className="h-6 w-6 text-medical-success" />
              </div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Reliability</div>
            </div>
            <div className="text-4xl font-black text-gray-800">High</div>
            <div className="text-xs text-muted-foreground mt-1">Medical Grade Confidence</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Speed</div>
            </div>
            <div className="text-4xl font-black text-gray-800">&lt; 1s</div>
            <div className="text-xs text-muted-foreground mt-1">Real-time Processing</div>
          </CardContent>
        </Card>
      </div>


      {/* Simple Methodology */}
      <Card className="border-none shadow-none bg-gray-100/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-medical-danger" />
            How the AI Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 leading-relaxed space-y-4">
            <p>
              Your system uses a <strong>Multi-Model Consensus System</strong>. Instead of relying on one calculation,
              it processes patient data through two distinct clinical-grade AI algorithms:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="font-bold text-medical-info">1. Validation</div>
                <p className="text-xs mt-1">Cross-referencing age and physical proportions against global datasets.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="font-bold text-medical-success">2. Probability</div>
                <p className="text-xs mt-1">Calculating the likelihood of malnutrition based on historical medical patterns.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}