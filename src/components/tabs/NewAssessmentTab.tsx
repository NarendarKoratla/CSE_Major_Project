import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calculator,
  Heart,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Utensils,
  Clock,
  Save,
  Hospital,
  Navigation,
  Info,
  Moon,
  Droplets,
  Zap,
  Apple,
  Coffee,
  Cloud,
  Sun,
  Beef,
  Flame,
  User,
  Thermometer,
  Stethoscope
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HospitalMap from "../HospitalMap";

interface PatientData {
  patient_id?: string;
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  location: string;
  coords?: { lat: number; lng: number };
}

interface AssessmentResult {
  bmi: number;
  bmi_category: string;
  risk_level: string;
  malnutrition_risk: number;
  consensus_pred: string;
  consensus_confidence: number;
  recommendations: {
    daily_habits: { text: string; category: string }[];
    dietary_tips: { text: string; category: string }[];
    next_steps: { text: string; category: string }[];
    plate_ratios: {
      proteins: number;
      carbs: number;
      vegetables: number;
      fruits: number;
    };
    explanation: string;
    schedule?: Array<{ time: string; activity: string; details: string }>;
    core_habits?: string[];
  };
  nearby_hospitals: Array<{
    name: string;
    distance_km: number;
    address: string;
    lat: number;
    lng: number;
    phone?: string;
    timings?: string;
  }>;
}

export default function NewAssessmentTab() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'form' | 'results'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedHospitalForRoute, setSelectedHospitalForRoute] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "m" | "ft" | "in">("cm");
  const [restriction, setRestriction] = useState<{ isRestricted: boolean; nextDate: Date | null }>({
    isRestricted: false,
    nextDate: null
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const name = parsed.full_name || parsed.email;
        setUserName(name);
        setPatientData(prev => ({ ...prev, name: name }));

        // Check for existing assessments to enforce 1-month limit
        const allAssessments = JSON.parse(localStorage.getItem("assessments") || "[]");
        const userAssessments = allAssessments.filter((a: any) =>
          a.patient_data.name === name
        ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (userAssessments.length > 0) {
          const lastAssessment = userAssessments[0];
          const lastDate = new Date(lastAssessment.timestamp);
          const nextAvailable = new Date(lastDate);
          nextAvailable.setMonth(nextAvailable.getMonth() + 1);

          if (new Date() < nextAvailable) {
            setRestriction({
              isRestricted: true,
              nextDate: nextAvailable
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const [patientData, setPatientData] = useState<PatientData>({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    location: ""
  });
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const validateInput = (): boolean => {
    const age = parseInt(patientData.age);
    let height = parseFloat(patientData.height);
    const weight = parseFloat(patientData.weight);

    if (heightUnit === 'm') height = height * 100;
    if (heightUnit === 'ft') height = height * 30.48;
    if (heightUnit === 'in') height = height * 2.54;

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

  const generatePatientId = (): string => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `PAT-${year}${month}-${random}`;
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

  const calculateRiskLevel = (bmi: number, age: number, gender: string): {
    malnutrition_risk: number;
    risk_level: string;
    consensus_pred: string;
    consensus_confidence: number;
  } => {
    // Mock ML ensemble prediction
    let malnutritionProb = 0;

    // BMI-based risk factors
    if (bmi < 16) malnutritionProb += 0.4;
    else if (bmi < 17) malnutritionProb += 0.3;
    else if (bmi < 18.5) malnutritionProb += 0.25;
    else if (bmi >= 30) malnutritionProb += 0.1;
    else if (bmi >= 25) malnutritionProb += 0.05;

    // Age-based risk factors
    if (age < 5) malnutritionProb += 0.1;
    else if (age < 12) malnutritionProb += 0.05;
    else if (age >= 60) malnutritionProb += 0.07;

    // Additional BMI modifiers for risk score
    let riskScore = malnutritionProb;
    if (bmi < 16) riskScore += 0.25;
    else if (bmi < 16.9) riskScore += 0.18;
    else if (bmi < 18.4) riskScore += 0.10;
    else if (bmi >= 30) riskScore += 0.08;
    else if (bmi >= 25) riskScore += 0.05;

    riskScore = Math.min(riskScore, 1);

    let risk_level: string;
    if (riskScore >= 0.75) risk_level = "Critical";
    else if (riskScore >= 0.5) risk_level = "High";
    else if (riskScore >= 0.3) risk_level = "Moderate";
    else risk_level = "Low";

    const consensus_pred = malnutritionProb >= 0.5 ? "Malnourished" : "NotMalnourished";
    const consensus_confidence = Math.round((1 - Math.abs(malnutritionProb - 0.5) * 2) * 100);

    return {
      malnutrition_risk: riskScore,
      risk_level,
      consensus_pred,
      consensus_confidence
    };
  };

  const generateRecommendations = (
    bmi: number,
    bmiCategory: string,
    age: number,
    riskLevel: string,
    malnutritionRisk: number
  ) => {
    const daily_habits: { text: string; category: string }[] = [];
    const dietary_tips: { text: string; category: string }[] = [];
    const next_steps: { text: string; category: string }[] = [];
    const plate_ratios = {
      proteins: 25,
      carbs: 25,
      vegetables: 40,
      fruits: 10
    };

    if (age <= 7) {
      daily_habits.push({ text: "Drink lots of water to be like a strong fish!", category: "Water" });
      daily_habits.push({ text: "Run, jump and play like a fast tiger today!", category: "Play" });
      daily_habits.push({ text: "Sleep early to grow tall like a big tree!", category: "Sleep" });
    } else if (age < 18) {
      daily_habits.push({ text: "Ensure 9-11 hours of sleep for proper growth and development", category: "Sleep" });
      daily_habits.push({ text: "Limit screen time to 2 hours per day maximum", category: "Screen Time" });
    } else {
      daily_habits.push({ text: "Maintain regular sleep schedule (7-9 hours nightly)", category: "Sleep" });
    }

    if (age > 7) {
      daily_habits.push({ text: "Stay hydrated - drink 8-10 glasses of water daily", category: "Hydration" });
    }

    if (age >= 60) {
      daily_habits.push({ text: "Gentle activity like walking 20-30 minutes daily", category: "Activity" });
    } else if (bmiCategory === "Underweight" && age > 7) {
      daily_habits.push({ text: "Light exercise to stimulate appetite, avoid excessive cardio", category: "Activity" });
    } else if (age > 7) {
      daily_habits.push({ text: "Regular physical activity - aim for 150 minutes moderate exercise weekly", category: "Activity" });
    }

    daily_habits.push({ text: "Exposure to morning sunlight for 15 minutes for Vitamin D", category: "Environment" });

    if (age <= 7) {
      dietary_tips.push({ text: "Eat your green veggies to have superhero eyes!", category: "Veggies" });
      dietary_tips.push({ text: "Milk makes your bones strong like rocks!", category: "Bones" });
      dietary_tips.push({ text: "Fruits are nature's candy - eat them every day!", category: "Fruits" });
    } else if (bmiCategory === "Underweight") {
      plate_ratios.proteins = 35;
      plate_ratios.carbs = 35;
      plate_ratios.vegetables = 20;
      plate_ratios.fruits = 10;

      dietary_tips.push({ text: "Increase calorie intake with nutrient-dense foods: nuts, seeds, avocados, healthy oils", category: "Energy" });
      dietary_tips.push({ text: "Eat 5-6 small, frequent meals throughout the day", category: "Frequency" });
      dietary_tips.push({ text: "Include protein-rich foods at every meal: eggs, fish, legumes, dairy products", category: "Protein" });
      dietary_tips.push({ text: "Focus on energy-dense items: peanut chikki, bananas, dried fruits, yogurt", category: "Snacks" });
    } else if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
      plate_ratios.proteins = 20;
      plate_ratios.carbs = 15;
      plate_ratios.vegetables = 50;
      plate_ratios.fruits = 15;

      dietary_tips.push({ text: "Focus on portion control using the visual plate method provided below", category: "Control" });
      dietary_tips.push({ text: "Increase fiber intake with more green leafy vegetables and seasonal fruits", category: "Fiber" });
      dietary_tips.push({ text: "Limit processed foods, sugary beverages, and refined carbohydrates", category: "Avoid" });
      dietary_tips.push({ text: "Choose lean proteins and avoid deep-fried items", category: "Protein" });
    } else {
      dietary_tips.push({ text: "Maintain balanced diet with variety from all food groups", category: "Balance" });
      dietary_tips.push({ text: "Include colorful fruits and vegetables in daily meals", category: "Micronutrients" });
      dietary_tips.push({ text: "Choose whole grains over refined options", category: "Grains" });
    }

    // Age-specific
    if (age < 5) {
      dietary_tips.push({ text: "Include milk and milk products for calcium and growth", category: "Growth" });
      next_steps.push({ text: "Regular pediatric growth monitoring and deworming checks", category: "Medical" });
    } else if (age >= 60) {
      dietary_tips.push({ text: "Focus on protein intake to maintain muscle mass (1.2g/kg body weight)", category: "Muscle" });
      next_steps.push({ text: "Regular screening for osteoporosis and cognitive health", category: "Screening" });
    }

    // Risk-based next steps
    if (riskLevel === "Critical" || riskLevel === "High") {
      next_steps.push({ text: "Immediate medical consultation - urgent nutritional intervention needed", category: "Urgent" });
      next_steps.push({ text: "Maintain a detailed 7-day food and symptom diary", category: "Monitoring" });
      next_steps.push({ text: "Blood work for micronutrient deficiencies (iron, B12, vitamin D)", category: "Testing" });
    } else {
      next_steps.push({ text: "Continue current healthy practices and monitor weight monthly", category: "Routine" });
      next_steps.push({ text: "Annual general health screening", category: "Checkup" });
    }

    const schedule = [
      { time: "06:00 – 06:30", activity: "Wake Up & Hydrate", details: "Start with a large glass of water (16-24 oz) to combat dehydration." },
      { time: "06:30 – 07:00", activity: "Morning Movement", details: "Perform a 15-30 minute workout (e.g., brisk walking, jogging, yoga, or bodyweight exercises) to boost energy and metabolism." },
      { time: "07:00 – 07:30", activity: "Morning Routine", details: "Shower, get ready, and perhaps take a few minutes for sunlight exposure to regulate your circadian rhythm." },
      { time: "07:30 – 08:00", activity: "Balanced Breakfast", details: "Eat a nutrient-dense breakfast with protein (eggs, yogurt, or protein powder) and fiber to fuel the day." },
      { time: "08:00 – 11:00", activity: "Active Work Session", details: "Start your day, ensuring you take short, 1-2 minute breaks to stretch or walk every hour." },
      { time: "11:00 – 11:15", activity: "Mid-Morning Boost", details: "A small, healthy snack (e.g., fruit or nuts) and more water." },
      { time: "12:30 – 13:15", activity: "Nutritious Lunch", details: "Aim for a balanced plate: 50% vegetables, 25% protein, and 25% complex carbohydrates to avoid a post-lunch energy crash." },
      { time: "13:15 – 13:30", activity: "Post-Lunch Walk", details: "A quick 10-15 minute walk to aid digestion and boost focus." },
      { time: "16:00 – 16:15", activity: "Afternoon Break", details: "A cup of tea and a small snack if needed." },
      { time: "17:30 – 18:30", activity: "Evening Workout/Activity", details: "If not done in the morning, perform strength training or a fun activity (dancing, cycling, walking)." },
      { time: "19:00 – 19:45", activity: "Dinner", details: "A lighter, protein-focused meal similar to lunch." },
      { time: "20:00 – 21:00", activity: "Unwind & Plan", details: "Prepare your outfit/lunch for the next day, write down goals, or practice gratitude." },
      { time: "21:00 – 22:00", activity: "Digital Detox & Rest", details: "Turn off electronic screens to improve sleep quality." },
      { time: "22:00 – 06:00", activity: "Sleep", details: "Aim for 7-9 hours of quality sleep for recovery." }
    ];

    const core_habits = [
      "Hydration Goal: Aim to consume 3-4 liters of water throughout the day.",
      "Movement Breaks: If you have a sedentary job, use reminders to stand or move every 30-60 minutes.",
      "Pre-planning: Set out workout clothes and pack healthy snacks the night before to reduce decision fatigue.",
      "Consistency over Intensity: It is better to do a 20-minute workout daily than a 2-hour workout once a week.",
      "Mindful Eating: Avoid eating processed food and focus on whole, nutrient-dense meals."
    ];

    const explanation = `BMI=${bmi.toFixed(1)} (${bmiCategory.toLowerCase()}) and malnutrition risk score=${(malnutritionRisk * 100).toFixed(0)}% resulted in ${riskLevel.toLowerCase()} risk assessment.`;

    return {
      daily_habits,
      dietary_tips,
      next_steps,
      plate_ratios,
      explanation,
      schedule,
      core_habits
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const generateNearbyHospitals = async (lat: number, lon: number): Promise<Array<{
    name: string;
    distance_km: number;
    address: string;
    lat: number;
    lng: number;
    phone?: string;
    timings?: string;
  }>> => {
    try {
      // broader search: 30km radius for better coverage in remote areas
      const radius = 30000;
      const query = `[out:json][timeout:30];
        (
          node["amenity"~"hospital|clinic|doctors"](around:${radius},${lat},${lon});
          way["amenity"~"hospital|clinic|doctors"](around:${radius},${lat},${lon});
          node["healthcare"~"hospital|clinic|doctor|centre|health_center"](around:${radius},${lat},${lon});
          way["healthcare"~"hospital|clinic|doctor|centre|health_center"](around:${radius},${lat},${lon});
        );
        out center;`;

      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

      if (!response.ok) {
        // Try fallback with just hospitals if first fail
        const fallbackQuery = `[out:json];(node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon}););out center;`;
        const res2 = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(fallbackQuery)}`);
        if (!res2.ok) throw new Error("Hospital search service currently unavailable");
        return await processOverpassData(await res2.json(), lat, lon);
      }

      return await processOverpassData(await response.json(), lat, lon);
    } catch (error) {
      console.error("Failed to fetch hospitals", error);
      return [];
    }
  };

  const processOverpassData = (data: any, lat: number, lon: number) => {
    return data.elements.map((el: any) => {
      const center = el.center || { lat: el.lat, lon: el.lon };

      const name = el.tags.name ||
        (el.tags.amenity ? el.tags.amenity.charAt(0).toUpperCase() + el.tags.amenity.slice(1).replace('_', ' ') :
          el.tags.healthcare ? el.tags.healthcare.charAt(0).toUpperCase() + el.tags.healthcare.slice(1).replace('_', ' ') :
            "Medical Facility");

      const addressParts = [
        el.tags["addr:housenumber"],
        el.tags["addr:street"],
        el.tags["addr:suburb"],
        el.tags["addr:city"]
      ].filter(Boolean);

      const address = addressParts.length > 0 ? addressParts.join(", ") :
        el.tags["addr:full"] || "Local medical facility";

      return {
        name,
        address,
        distance_km: calculateDistance(lat, lon, center.lat, center.lon),
        lat: center.lat,
        lng: center.lon,
        phone: el.tags.phone || el.tags["contact:phone"] || el.tags.mobile,
        timings: el.tags.opening_hours || "Contact for timings"
      };
    })
      .sort((a: any, b: any) => a.distance_km - b.distance_km)
      .slice(0, 5);
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          let locationName = `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`;

          try {
            // Reverse Geocoding using Nominatim (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`);
            if (response.ok) {
              const data = await response.json();
              const address = data.address;
              const city = address.city || address.town || address.village || address.suburb || address.state || address.country;
              if (city) {
                locationName = city;
                // If detailed address is needed:
                // locationName = `${city}, ${address.state || address.country}`;
              }
            }
          } catch (error) {
            console.error("Geocoding failed", error);
          }

          setPatientData(prev => ({
            ...prev,
            location: locationName,
            coords
          }));
          setIsDetectingLocation(false);
          toast({ title: "Location detected", description: `Updated to ${locationName}.` });
        },
        () => {
          setIsDetectingLocation(false);
          toast({ title: "Location access denied", description: "Please enter location manually.", variant: "destructive" });
        }
      );
    }
  };

  const handleRunAssessment = async () => {
    if (!validateInput()) return;

    setIsLoading(true);

    try {
      const waitTime = new Promise(resolve => setTimeout(resolve, 2000));
      await waitTime;

      const weight = parseFloat(patientData.weight);
      let height = parseFloat(patientData.height);
      const age = parseInt(patientData.age);

      if (heightUnit === 'm') height = height * 100;
      if (heightUnit === 'ft') height = height * 30.48;
      if (heightUnit === 'in') height = height * 2.54;
      height = Math.round(height);

      const bmi = calculateBMI(weight, height);
      const bmi_category = getBMICategory(bmi);
      const riskData = calculateRiskLevel(bmi, age, patientData.gender);
      const recommendations = generateRecommendations(bmi, bmi_category, age, riskData.risk_level, riskData.malnutrition_risk);

      let searchCoords = patientData.coords;
      if (!searchCoords && patientData.location) {
        try {
          // Use more specific address search if possible
          const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(patientData.location)}&addressdetails=1&limit=1`);
          const geoData = await geoResp.json();
          if (geoData.length > 0) {
            searchCoords = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
          }
        } catch (e) {
          console.error("Forward geocoding failed", e);
        }
      }

      const nearby_hospitals = await generateNearbyHospitals(
        searchCoords?.lat || 12.9716, // Default to Bangalore if everything fails
        searchCoords?.lng || 77.5946
      );

      const result: AssessmentResult = {
        bmi,
        bmi_category,
        ...riskData,
        recommendations,
        nearby_hospitals
      };

      // Generate patient ID if not exists
      const patientWithId = {
        ...patientData,
        height: height.toString(),
        patient_id: patientData.patient_id || generatePatientId(),
        coords: searchCoords // Ensure the found coords are included in the final state update
      };

      setPatientData(patientWithId);
      setAssessmentResult(result);
      setCurrentStep('results');
      setSelectedHospitalForRoute(null); // Reset route on new assessment

      toast({
        title: "Assessment Complete",
        description: `Risk level: ${riskData.risk_level}. BMI: ${bmi.toFixed(1)}`,
      });
    } catch (err: any) {
      console.error("Assessment failed", err);
      toast({
        title: "Assessment Failed",
        description: err.message || "An unexpected error occurred during analysis.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!assessmentResult || !patientData.patient_id) return;

    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    const user_email = loggedInUser.email;

    const newAssessment = {
      id: Date.now().toString(),
      patient_id: patientData.patient_id,
      patient_data: patientData,
      result: assessmentResult,
      timestamp: new Date().toISOString(),
      user_email: user_email
    };

    try {
      // 1. Save Assessment to MongoDB
      const assessResp = await fetch("http://127.0.0.1:8000/save-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssessment)
      });

      if (!assessResp.ok) {
        const err = await assessResp.json();
        throw new Error(`Assessment Save Failed: ${err.detail || 'Unknown Error'}`);
      }

      // 2. Save Patient to MongoDB
      const patientResp = await fetch("http://127.0.0.1:8000/save-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientData,
          last_assessment: new Date().toISOString()
        })
      });

      if (!patientResp.ok) {
        const err = await patientResp.json();
        throw new Error(`Patient Sync Failed: ${err.detail || 'Unknown Error'}`);
      }

      // Sync to localStorage as well (backup)
      const existingAssessments = JSON.parse(localStorage.getItem('assessments') || '[]');
      existingAssessments.push(newAssessment);
      localStorage.setItem('assessments', JSON.stringify(existingAssessments));

      const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
      const patientIndex = existingPatients.findIndex((p: any) => p.patient_id === patientData.patient_id);
      if (patientIndex >= 0) {
        existingPatients[patientIndex] = { ...patientData, last_assessment: new Date().toISOString() };
      } else {
        existingPatients.push({ ...patientData, created_at: new Date().toISOString() });
      }
      localStorage.setItem('patients', JSON.stringify(existingPatients));

      const nextAvailable = new Date();
      nextAvailable.setMonth(nextAvailable.getMonth() + 1);
      setRestriction({
        isRestricted: true,
        nextDate: nextAvailable
      });

      toast({
        title: "Assessment Saved Successfully",
        description: "Data synchronized with MongoDB cloud cluster.",
      });
    } catch (error) {
      console.error("Failed to save to MongoDB", error);
      toast({
        title: "Save Failed",
        description: "Could not sync with MongoDB. Data saved locally only.",
        variant: "destructive"
      });
    }
  };

  const handleNewAssessment = () => {
    setPatientData({
      name: "",
      age: "",
      gender: "",
      height: "",
      weight: "",
      location: ""
    });
    setAssessmentResult(null);
    setCurrentStep('form');
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return "medical-danger";
      case "High": return "medical-danger";
      case "Moderate": return "medical-warning";
      case "Low": return "medical-success";
      default: return "medical-info";
    }
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case "Underweight": return "medical-warning";
      case "Normal": return "medical-success";
      case "Overweight": return "medical-warning";
      case "Obese": return "medical-danger";
      default: return "medical-info";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return <XCircle className="h-5 w-5" />;
      case "High": return <AlertTriangle className="h-5 w-5" />;
      case "Moderate": return <TrendingUp className="h-5 w-5" />;
      case "Low": return <CheckCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (currentStep === 'results' && assessmentResult) {
    const shouldConsultDoctor = assessmentResult.risk_level === "High" || assessmentResult.risk_level === "Critical";

    return (
      <div className="space-y-6">
        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Heart className="h-7 w-7 text-medical-info" />
              Assessment Results for {patientData.name}
            </CardTitle>
            <CardDescription>
              Patient ID: {patientData.patient_id} • {patientData.gender}, {patientData.age} years old • {patientData.height}cm, {patientData.weight}kg
              {patientData.location && (
                <span className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {patientData.location}
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">BMI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center mb-2">
                {assessmentResult?.bmi?.toFixed(1) || "0.0"}
              </div>
              <Badge
                variant="secondary"
                className={`w-full justify-center text-${getBMIColor(assessmentResult?.bmi_category || "Normal")} border-${getBMIColor(assessmentResult?.bmi_category || "Normal")}`}
              >
                {assessmentResult?.bmi_category || "Normal"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {getRiskIcon(assessmentResult?.risk_level || "Low")}
                Risk Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge
                  variant="secondary"
                  className={`w-full justify-center text-${getRiskColor(assessmentResult?.risk_level || "Low")} border-${getRiskColor(assessmentResult?.risk_level || "Low")} text-lg py-2`}
                >
                  {assessmentResult?.risk_level || "Low"}
                </Badge>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span>{Math.round((assessmentResult?.malnutrition_risk || 0) * 100)}%</span>
                  </div>
                  <Progress value={(assessmentResult?.malnutrition_risk || 0) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">ML Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1 text-medical-info">
                  {assessmentResult?.consensus_pred || "Stable"}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Ensemble Model Result
                </div>
                <Badge variant="outline" className="text-xs">
                  Confidence: {assessmentResult?.consensus_confidence || 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {shouldConsultDoctor ? (
                  <>
                    <AlertTriangle className="h-8 w-8 text-medical-danger mx-auto mb-2" />
                    <div className="text-sm font-medium text-medical-danger">
                      Doctor Consultation Recommended
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-medical-success mx-auto mb-2" />
                    <div className="text-sm font-medium text-medical-success">
                      Continue Monitoring
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Schedule & Habits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-blue-100 shadow-lg">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Clock className="h-6 w-6" />
                Daily Fitness & Health Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assessmentResult.recommendations.schedule?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-4 font-semibold text-blue-600 whitespace-nowrap">{item.time}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{item.activity}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.details}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-purple-100 shadow-lg h-full">
              <CardHeader className="bg-purple-50/50">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Zap className="h-6 w-6" />
                  Core Healthy Habits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {assessmentResult.recommendations.core_habits?.map((habit, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="mt-1 p-1 bg-purple-100 rounded-full">
                        <CheckCircle className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 leading-tight">{habit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Medical Alert */}
        {shouldConsultDoctor && (
          <Alert className="border-medical-danger/50 bg-medical-danger/5">
            <AlertTriangle className="h-4 w-4 text-medical-danger" />
            <AlertDescription className="text-medical-danger font-medium">
              <strong>Medical Attention Recommended:</strong> Based on the assessment results,
              we recommend consulting with a healthcare provider within 2 weeks for a comprehensive
              evaluation and personalized nutrition plan.
            </AlertDescription>
          </Alert>
        )}

        {/* Healthy Plate Visual Wonder */}
        <Card className="overflow-hidden border-2 border-green-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Utensils className="h-6 w-6" />
              Your Personalized Healthy Plate
            </CardTitle>
            <CardDescription className="text-emerald-600 font-medium">
              A visual guide to your ideal meal proportions based on your {assessmentResult.bmi_category} status.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center justify-around gap-12">
              {/* The Plate Diagram */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-gray-100 shadow-2xl overflow-hidden flex transform hover:scale-105 transition-transform duration-500">
                <div
                  className="h-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs md:text-sm border-r-2 border-white/20 group relative"
                  style={{ width: `${assessmentResult.recommendations.plate_ratios.vegetables}%` }}
                >
                  <span className="rotate-[-90deg] md:rotate-0">Vegetables</span>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Cloud className="opacity-0 group-hover:opacity-100 h-8 w-8" />
                  </div>
                </div>
                <div className="flex flex-col h-full" style={{ width: `${100 - assessmentResult.recommendations.plate_ratios.vegetables}%` }}>
                  <div
                    className="w-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs md:text-sm border-b-2 border-white/20 group relative"
                    style={{ height: `${(assessmentResult.recommendations.plate_ratios.proteins / (100 - assessmentResult.recommendations.plate_ratios.vegetables)) * 100}%` }}
                  >
                    <span>Proteins</span>
                    <Beef className="ml-1 h-4 w-4 hidden md:block" />
                  </div>
                  <div className="flex w-full h-full">
                    <div
                      className="h-full bg-yellow-500 flex items-center justify-center text-white font-bold text-xs md:text-sm border-r-2 border-white/20 group relative"
                      style={{ width: `${(assessmentResult.recommendations.plate_ratios.carbs / (assessmentResult.recommendations.plate_ratios.carbs + assessmentResult.recommendations.plate_ratios.fruits)) * 100}%` }}
                    >
                      <span>Carbs</span>
                    </div>
                    <div className="h-full bg-red-400 flex items-center justify-center text-white font-bold text-xs md:text-sm" style={{ flex: 1 }}>
                      <Apple className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-inner flex items-center justify-center border-4 border-gray-50">
                  <Heart className="h-8 w-8 text-red-500 animate-pulse" />
                </div>
              </div>

              {/* Legend & Key Tips */}
              <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-500">
                    <div className="text-emerald-700 font-bold flex items-center gap-2">
                      <Cloud className="h-4 w-4" /> Vegetables ({assessmentResult.recommendations.plate_ratios.vegetables}%)
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">Focus on fiber and micronutrients to regulate metabolism.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 border-l-4 border-l-orange-500">
                    <div className="text-orange-700 font-bold flex items-center gap-2">
                      <Beef className="h-4 w-4" /> Proteins ({assessmentResult.recommendations.plate_ratios.proteins}%)
                    </div>
                    <p className="text-xs text-orange-600 mt-1">Essential for tissue repair and immune function maintenance.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 border-l-4 border-l-yellow-500">
                    <div className="text-yellow-700 font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Carbohydrates ({assessmentResult.recommendations.plate_ratios.carbs}%)
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">Prefer complex grains for sustained energy levels.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 border-l-4 border-l-red-400">
                    <div className="text-red-700 font-bold flex items-center gap-2">
                      <Apple className="h-4 w-4" /> Fruits ({assessmentResult.recommendations.plate_ratios.fruits}%)
                    </div>
                    <p className="text-xs text-red-600 mt-1">Natural vitamins and antioxidants for cellular health.</p>
                  </div>
                </div>

                <Alert className="bg-indigo-50 border-indigo-100">
                  <Info className="h-4 w-4 text-indigo-500" />
                  <AlertDescription className="text-xs text-indigo-700">
                    This visual ratio is adjusted specifically because your assessment shows a <strong>{assessmentResult.risk_level}</strong> risk level.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Insights Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Habits Card */}
          <Card className="shadow-lg border-t-4 border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Activity className="h-5 w-5" />
                Daily Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessmentResult.recommendations.daily_habits.map((habit, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="p-2 bg-white rounded-full shadow-sm self-start">
                    {habit.category === "Sleep" && <Moon className="h-4 w-4 text-indigo-600" />}
                    {habit.category === "Hydration" && <Droplets className="h-4 w-4 text-blue-500" />}
                    {habit.category === "Activity" && <Flame className="h-4 w-4 text-orange-500" />}
                    {habit.category === "Environment" && <Sun className="h-4 w-4 text-yellow-500" />}
                    {!["Sleep", "Hydration", "Activity", "Environment"].includes(habit.category) && <Zap className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{habit.category}</p>
                    <p className="text-sm font-medium leading-tight">{habit.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detailed Nutritional Guidance */}
          <Card className="shadow-lg border-t-4 border-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Utensils className="h-5 w-5" />
                Nutritional Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessmentResult.recommendations.dietary_tips.map((tip, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                  <div className="p-2 bg-white rounded-full shadow-sm self-start">
                    <Apple className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{tip.category}</p>
                    <p className="text-sm font-medium leading-tight">{tip.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Path to Recovery / Next Steps */}
          <Card className="shadow-lg border-t-4 border-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <TrendingUp className="h-5 w-5" />
                Next Steps & Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {assessmentResult.recommendations.next_steps.map((step, i) => (
                <div key={i} className="relative pl-8 pb-4 last:pb-0">
                  {i !== assessmentResult.recommendations.next_steps.length - 1 && (
                    <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-purple-100" />
                  )}
                  <div className="absolute left-0 top-1 p-1 bg-purple-600 rounded-full text-white">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">{step.category}</p>
                    <p className="text-sm font-semibold">{step.text}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 h-11 shadow-lg shadow-purple-200">
                  <Stethoscope className="h-4 w-4" />
                  Consult Health Specialist
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Map */}
        <Card id="health-map">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-medical-danger" />
              Interactive Health Map
            </CardTitle>
            <CardDescription>
              Visualize nearby medical centers relative to your current location
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patientData?.coords?.lat && patientData?.coords?.lng ? (
              <HospitalMap
                userLat={Number(patientData.coords.lat)}
                userLng={Number(patientData.coords.lng)}
                hospitals={assessmentResult?.nearby_hospitals || []}
                selectedHospital={selectedHospitalForRoute}
              />
            ) : (
              <div className="h-[400px] w-full bg-muted flex flex-col items-center justify-center rounded-xl text-muted-foreground border-2 border-dashed">
                <MapPin className="h-12 w-12 mb-4 opacity-20" />
                <p>Enter location or allow GPS to view interactive map</p>
                <p className="text-xs mt-2 opacity-50">(Coordinates missing or invalid)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nearby Hospitals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5" />
              Nearby Healthcare Facilities
            </CardTitle>
            <CardDescription>
              Closest medical facilities for consultation and follow-up care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessmentResult?.nearby_hospitals && assessmentResult.nearby_hospitals.length > 0 ? (
                assessmentResult.nearby_hospitals.map((hospital, index) => (
                  <div key={index} className="flex flex-col p-4 border rounded-xl hover:border-medical-info/50 transition-colors bg-white shadow-sm group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800 group-hover:text-medical-info transition-colors">{hospital.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {hospital.address}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-sm font-bold text-medical-info">{(hospital.distance_km || 0).toFixed(1)} km</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">away</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Timings</div>
                        <div className="text-xs font-medium text-gray-600 truncate" title={hospital.timings || "Contact for timings"}>
                          {hospital.timings || "Contact for timings"}
                        </div>
                      </div>
                      {hospital.phone && (
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Contact</div>
                          <div className="text-xs font-medium text-medical-info truncate">
                            {hospital.phone}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant={selectedHospitalForRoute?.lat === hospital.lat ? "default" : "outline"}
                      size="sm"
                      className={`mt-4 w-full transition-all text-xs font-bold ${selectedHospitalForRoute?.lat === hospital.lat
                        ? "bg-medical-info text-white border-medical-info"
                        : "border-medical-info/20 hover:bg-medical-info hover:text-white"
                        }`}
                      onClick={() => {
                        setSelectedHospitalForRoute(hospital);
                        // Smooth scroll to map
                        const mapElement = document.getElementById('health-map');
                        if (mapElement) {
                          mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-2" />
                      {selectedHospitalForRoute?.lat === hospital.lat ? "VIEWING ROUTE" : "SHOW DIRECTIONS"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  <Hospital className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No real healthcare facilities found in your area.</p>
                  <p className="text-xs mt-1">Try expanding your search or entering a larger nearby city.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleNewAssessment} variant="outline" className="flex-1">
            New Assessment
          </Button>
          <Button
            onClick={handleSaveAssessment}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Assessment
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.print()}
          >
            Print Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-indigo-100 overflow-hidden">
        <CardHeader className="pb-10">
          <CardTitle className="text-3xl font-black text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            New Malnutrition Assessment
          </CardTitle>
          <CardDescription className="text-center">
            Complete information for comprehensive nutritional screening
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleRunAssessment(); }} className="space-y-6">
            {/* Patient Details */}
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
                <h3 className="text-lg font-semibold text-purple-800">
                  Hello! {userName || "Guest"}
                </h3>
                <p className="text-purple-600">
                  Please provide the details below
                </p>
              </div>

              {restriction.isRestricted && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="font-medium">
                    Assessment Limit Active: Your next nutritional screening will be available after{" "}
                    <strong>{restriction.nextDate?.toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>.
                    Significant health changes typically take at least one month to manifest.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={patientData.age}
                    onChange={(e) => setPatientData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g., 25"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={patientData.gender} onValueChange={(value) => setPatientData(prev => ({ ...prev, gender: value }))}>
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
                  <Label htmlFor="height">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      step="0.01"
                      value={patientData.height}
                      onChange={(e) => setPatientData(prev => ({ ...prev, height: e.target.value }))}
                      placeholder={heightUnit === "cm" ? "e.g., 170" : heightUnit === "m" ? "e.g., 1.7" : heightUnit === "ft" ? "e.g., 5.5" : "e.g., 66"}
                      required
                    />
                    <Select value={heightUnit} onValueChange={(value: any) => setHeightUnit(value)}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="10"
                    max="300"
                    step="0.1"
                    value={patientData.weight}
                    onChange={(e) => setPatientData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="e.g., 65.5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex justify-between">
                  Location (City or GPS) *
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-purple-600 font-bold hover:text-purple-800"
                    onClick={handleLocationDetect}
                    disabled={isDetectingLocation}
                  >
                    {isDetectingLocation ? (
                      <Activity className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3 mr-1" />
                    )}
                    {isDetectingLocation ? "Detecting..." : "Allow GPS detection"}
                  </Button>
                </Label>
                <div className="relative">
                  <Input
                    id="location"
                    value={patientData.location}
                    onChange={(e) => setPatientData(prev => ({
                      ...prev,
                      location: e.target.value,
                      coords: undefined // CRITICAL: Clear coords when typing manually to force re-geocoding
                    }))}
                    placeholder="Enter Location"
                    className={isDetectingLocation ? "opacity-50 font-bold" : "font-bold"}
                    required
                  />
                  {isDetectingLocation && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Activity className="h-4 w-4 text-purple-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity text-white"
              disabled={isLoading || restriction.isRestricted}
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
      </Card >
    </div >
  );
}