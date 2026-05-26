import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientData {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  location: string;
}

interface AssessmentResult {
  bmi: number;
  bmiCategory: string;
  riskLevel: string;
  malnutritionRisk: number;
  recommendations: string[];
}

interface Props {
  onAssessment: (data: PatientData, result: AssessmentResult) => void;
}

export default function PatientAssessmentForm({ onAssessment }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PatientData>({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    location: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"logreg" | "rf">("logreg");
  const [isTraining, setIsTraining] = useState(false);

  const validateInput = (): boolean => {
    const age = parseInt(formData.age);
    const height = parseInt(formData.height);
    const weight = parseFloat(formData.weight);

    if (age < 1 || age > 120) {
      toast({ title: "Invalid Age", description: "Age must be between 1 and 120 years.", variant: "destructive" });
      return false;
    }
    if (height < 50 || height > 250) {
      toast({ title: "Invalid Height", description: "Height must be between 50 and 250 cm.", variant: "destructive" });
      return false;
    }
    if (weight < 10 || weight > 300) {
      toast({ title: "Invalid Weight", description: "Weight must be between 10 and 300 kg.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const assessMalnutritionRisk = (bmi: number, age: number, gender: string): number => {
    let riskScore = 0;

    // BMI-based risk factors
    if (bmi < 16) riskScore += 0.4;
    else if (bmi < 17) riskScore += 0.3;
    else if (bmi < 18.5) riskScore += 0.2;
    else if (bmi >= 30) riskScore += 0.1;

    // Age-based risk factors
    if (age < 5) riskScore += 0.2;
    else if (age < 12) riskScore += 0.1;
    else if (age >= 60) riskScore += 0.15;

    // Gender-based adjustments (women slightly higher risk during childbearing years)
    if (gender === "Female" && age >= 15 && age <= 49) riskScore += 0.05;

    return Math.min(riskScore, 1);
  };

  const getRiskLevel = (riskScore: number): string => {
    if (riskScore >= 0.7) return "Critical";
    if (riskScore >= 0.5) return "High";
    if (riskScore >= 0.3) return "Moderate";
    return "Low";
  };

  const generateRecommendations = (bmi: number, bmiCategory: string, age: number, riskLevel: string): string[] => {
    const recommendations: string[] = [];

    // Daily habits
    recommendations.push("Maintain regular sleep schedule (7-9 hours for adults, 9-11 for children)");
    recommendations.push("Stay hydrated - drink 8-10 glasses of water daily");

    // Dietary recommendations based on BMI category
    if (bmiCategory === "Underweight") {
      recommendations.push("Increase calorie intake with nutrient-dense foods like nuts, seeds, and healthy oils");
      recommendations.push("Eat frequent small meals (5-6 times per day)");
      recommendations.push("Include protein-rich foods: eggs, fish, legumes, dairy products");
    } else if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
      recommendations.push("Focus on portion control and balanced meals");
      recommendations.push("Increase fiber intake with vegetables, fruits, and whole grains");
      recommendations.push("Limit processed foods and sugary beverages");
    } else {
      recommendations.push("Maintain balanced diet with variety of food groups");
      recommendations.push("Include colorful fruits and vegetables in daily meals");
    }

    // Age-specific recommendations
    if (age < 18) {
      recommendations.push("Ensure adequate calcium and vitamin D for growth");
      recommendations.push("Limit screen time and encourage physical activity");
    } else if (age >= 60) {
      recommendations.push("Focus on protein intake to maintain muscle mass");
      recommendations.push("Consider vitamin B12 and D supplementation (consult doctor)");
    }

    // Risk-based recommendations
    if (riskLevel === "High" || riskLevel === "Critical") {
      recommendations.push("Schedule consultation with healthcare provider within 2 weeks");
      recommendations.push("Monitor weight weekly and keep a food diary");
      recommendations.push("Consider nutritional counseling or dietitian consultation");
    } else if (riskLevel === "Moderate") {
      recommendations.push("Monitor weight monthly and maintain healthy lifestyle");
      recommendations.push("Regular check-ups with healthcare provider");
    }

    return recommendations;
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          }));
          toast({ title: "Location detected", description: "GPS coordinates added to form." });
        },
        () => {
          toast({ title: "Location access denied", description: "Please enter location manually.", variant: "destructive" });
        }
      );
    }
  };

  const handleRetrain = async () => {
    try {
      setIsTraining(true);
      const response = await fetch("http://127.0.0.1:8000/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });
      if (!response.ok) throw new Error("Train failed");
      const data = await response.json();
      toast({ title: "Model retrained", description: `Model: ${data.model}, Acc: ${(data.accuracy * 100).toFixed(1)}%` });
    } catch (e) {
      toast({ title: "Retrain failed", description: "Could not retrain model.", variant: "destructive" });
    } finally {
      setIsTraining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInput()) return;

    setIsLoading(true);

    // Simulate API call delay
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          height: Number(formData.height),
          weight: Number(formData.weight),
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const resultData = await response.json();

      const result: AssessmentResult = {
        bmi: resultData.bmi,
        bmiCategory: resultData.bmi_category,
        riskLevel: resultData.risk,
        malnutritionRisk: resultData.risk_score ?? 0, // fallback if backend doesn’t send it
        recommendations: [`Predicted risk level: ${resultData.risk}`],
      };

      onAssessment(formData, result);

      toast({
        title: "Assessment Complete",
        description: `AI Prediction: ${resultData.risk}, BMI: ${resultData.bmi.toFixed(1)}`,
      });
    } catch (error) {
      console.error("Prediction API error:", error);
      toast({
        title: "Error",
        description: "Could not connect to AI model. Try again later.",
        variant: "destructive",
      });
    }


    setIsLoading(false);

    // Get location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          }));
          toast({ title: "Location detected", description: "GPS coordinates added to form." });
        },
        () => {
          toast({ title: "Location access denied", description: "Please enter location manually.", variant: "destructive" });
        }
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Malnutrition Risk Assessment
        </CardTitle>
        <CardDescription className="text-center">
          Complete information for comprehensive nutritional screening
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Algorithm</Label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as "logreg" | "rf")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logreg">Logistic Regression</SelectItem>
                  <SelectItem value="rf">Random Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleRetrain} disabled={isTraining} className="w-full">
                {isTraining ? "Retraining..." : "Retrain Model"}
              </Button>
            </div>
          </div>

          {/* Patient Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Patient Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age (years) *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="e.g., 25"
                  required
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  min="50"
                  max="250"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="e.g., 170"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="10"
                  max="300"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="e.g., 65.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter city or allow GPS detection"
                />
                <Button type="button" variant="outline" onClick={handleLocationDetect}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              "Processing Assessment..."
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Run Assessment
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}