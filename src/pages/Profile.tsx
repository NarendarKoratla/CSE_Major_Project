import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
    User,
    Lock as LockIcon,
    LogOut,
    Save,
    History as HistoryIcon,
    Activity,
    TrendingUp,
    Heart,
    CheckCircle,
    Clock,
    Utensils,
    FileText,
    MapPin,
    Hospital,
    XCircle,
    AlertTriangle,
    Stethoscope,
    Plus,
    Moon,
    Droplets,
    Zap,
    Apple,
    Sun,
    Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import MedicalChatbot from "@/components/chatbot/MedicalChatbot";

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [passData, setPassData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [restriction, setRestriction] = useState<{ isRestricted: boolean; nextDate: Date | null }>({
        isRestricted: false,
        nextDate: null
    });
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/login");
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Load user's assessments
        const allAssessments = JSON.parse(localStorage.getItem("assessments") || "[]");
        const userAssessments = allAssessments.filter((a: any) =>
            a.patient_data.name === (parsedUser.full_name || parsedUser.email)
        ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setAssessments(userAssessments);

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
    }, [navigate]);

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

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case "Critical": return <XCircle className="h-5 w-5" />;
            case "High": return <AlertTriangle className="h-5 w-5" />;
            case "Moderate": return <TrendingUp className="h-5 w-5" />;
            case "Low": return <CheckCircle className="h-5 w-5" />;
            default: return <Activity className="h-5 w-5" />;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        toast({ title: "Logged out", description: "You have been logged out successfully." });
        navigate("/login");
    };

    const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassData({ ...passData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.new_password !== passData.confirm_password) {
            toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user?.email,
                    old_password: passData.old_password,
                    new_password: passData.new_password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update password");
            }

            toast({ title: "Success", description: "Password updated successfully" });
            setPassData({ old_password: "", new_password: "", confirm_password: "" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50" />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header - Matches Home Page */}
            <header className="border-b bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md shadow-lg cursor-pointer" onClick={() => navigate("/")}>
                                <Stethoscope className="h-7 w-7 text-white" />
                            </div>
                            <div className="cursor-pointer" onClick={() => navigate("/")}>
                                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                                    NutriVision
                                </h1>
                                <p className="text-sm text-white/90 mt-1">
                                    AI-powered nutritional screening system
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-white font-medium hidden sm:block text-lg">
                                {user?.full_name || user?.email}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white bg-white/20 rounded-full h-12 w-12 transition-colors border-2 border-white/40 shadow-inner"
                                onClick={() => navigate("/")}
                                title="Home"
                            >
                                <Plus className="h-7 w-7 text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-6 space-y-8 max-w-6xl py-12">
                {/* Hero Greeting Section */}
                <div className="bg-gradient-to-r from-purple-700 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-bold">Hello, {user?.full_name || user?.email}!</h2>
                            <p className="text-white/80 mt-2 text-lg">Detailed view of your health journey and nutritional screenings.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => navigate("/")}
                                disabled={restriction.isRestricted}
                            >
                                {restriction.isRestricted ? "Next Screening Scheduled" : "New Assessment"}
                            </Button>
                            <Button variant="destructive" onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 border-red-500/30">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Assessment History */}
                    <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                        <div className="flex items-center gap-3 mb-2 px-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <HistoryIcon className="h-6 w-6 text-purple-700" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Assessment History</h3>
                        </div>

                        {restriction.isRestricted && (
                            <Alert className="bg-purple-50/50 border-purple-100 text-purple-800 mb-6">
                                <Clock className="h-4 w-4 text-purple-600" />
                                <AlertDescription>
                                    Your next nutritional screening will be available after{" "}
                                    <span className="font-bold">{restriction.nextDate?.toLocaleDateString(undefined, { dateStyle: 'long' })}</span>.
                                </AlertDescription>
                            </Alert>
                        )}

                        {assessments.length === 0 ? (
                            <Card className="border-dashed border-2 py-16 bg-white/50 backdrop-blur-sm">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                                        <HistoryIcon className="h-12 w-12 text-gray-300" />
                                    </div>
                                    <CardTitle className="text-gray-500 text-xl">No History Found</CardTitle>
                                    <CardDescription className="max-w-xs mt-2 text-base">
                                        Your completed nutritional assessments will appear here.
                                    </CardDescription>
                                    <Button className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 px-8 text-white" onClick={() => navigate("/")}>
                                        Take Your First Assessment
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            assessments.map((assessment, index) => {
                                const res = assessment.result;
                                if (!res) return null;
                                const isHighRisk = res.risk_level === "High" || res.risk_level === "Critical";

                                return (
                                    <Card key={assessment.id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
                                        <div className={`h-2 ${getRiskColor(res.risk_level)}`} />
                                        <CardHeader className="pb-4">
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <CardTitle className="text-xl font-bold text-gray-800">
                                                                Nutritional Screening
                                                            </CardTitle>
                                                            <Badge variant="outline" className="font-mono text-[10px] text-gray-400">
                                                                #{assessments.length - index}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {new Date(assessment.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`${getRiskColor(res.risk_level)} px-3 py-1`}>
                                                        {res.risk_level} Risk
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group-hover:border-blue-200 transition-colors">
                                                    <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-2">BMI Score</span>
                                                    <div className="text-3xl font-black text-gray-800">{res.bmi?.toFixed(1) || "N/A"}</div>
                                                    <Badge variant="secondary" className={`mt-2 ${getBMIColor(res.bmi_category)}`}>
                                                        {res.bmi_category || "Unknown"}
                                                    </Badge>
                                                </div>
                                                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group-hover:border-purple-200 transition-colors">
                                                    <span className="text-[10px] uppercase tracking-widest text-purple-500 font-bold mb-2 flex items-center gap-1">
                                                        Risk Level
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${getRiskColor(res.risk_level)}`}>
                                                            {getRiskIcon(res.risk_level)}
                                                        </div>
                                                        <div className="text-lg font-black text-gray-800">
                                                            {res.risk_level || "Unknown"}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-2 font-mono">SCORE: {res.malnutrition_risk ? Math.round(res.malnutrition_risk * 100) : 0}%</div>
                                                </div>
                                                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group-hover:border-indigo-200 transition-colors">
                                                    <span className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-2">AI Analysis</span>
                                                    <div className="text-lg font-black text-gray-800 leading-tight">
                                                        {res.consensus_pred}
                                                    </div>
                                                    <div className="w-full mt-3">
                                                        <div className="flex justify-between text-[10px] mb-1">
                                                            <span className="text-gray-400">Confidence</span>
                                                            <span className="text-indigo-600 font-bold">{res.consensus_confidence}%</span>
                                                        </div>
                                                        <Progress value={res.consensus_confidence} className="h-1 shadow-inner" />
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group-hover:border-emerald-200 transition-colors">
                                                    <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Action</span>
                                                    <div className={`text-sm font-bold ${isHighRisk ? "text-red-700" : "text-emerald-700"} flex flex-col items-center gap-1`}>
                                                        {isHighRisk ? (
                                                            <>
                                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                                <span>Urgent Consultation</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                                <span>Healthy Status</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recommendations Section */}
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 w-8 bg-purple-600 rounded-full" />
                                                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Health Insights</h4>
                                                </div>

                                                <Accordion type="single" collapsible className="w-full space-y-3">
                                                    <AccordionItem value="habits" className="border-0 bg-white/50 rounded-2xl px-4 overflow-hidden border border-gray-100 shadow-sm">
                                                        <AccordionTrigger className="hover:no-underline text-purple-800 font-bold py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-purple-100 rounded-lg"><Clock className="h-4 w-4 text-purple-600" /></div>
                                                                Daily Habits & Lifestyle
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-4">
                                                            <ul className="space-y-3 pl-4">
                                                                {res.recommendations?.daily_habits?.map((habit: any, i: number) => (
                                                                    <li key={i} className="flex gap-3 p-2 rounded-lg bg-purple-50/50">
                                                                        <div className="p-1.5 bg-white rounded-full shadow-sm self-start">
                                                                            {habit.category === "Sleep" && <Moon className="h-3.5 w-3.5 text-indigo-600" />}
                                                                            {habit.category === "Hydration" && <Droplets className="h-3.5 w-3.5 text-blue-500" />}
                                                                            {habit.category === "Activity" && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                                                                            {habit.category === "Environment" && <Sun className="h-3.5 w-3.5 text-yellow-500" />}
                                                                            {!["Sleep", "Hydration", "Activity", "Environment"].includes(habit.category) && <Zap className="h-3.5 w-3.5 text-purple-500" />}
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600">{habit.category}</p>
                                                                            <p className="text-xs text-gray-700 font-medium">{typeof habit === 'string' ? habit : habit.text}</p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    <AccordionItem value="guidance" className="border-0 bg-white/50 rounded-2xl px-4 overflow-hidden border border-gray-100 shadow-sm">
                                                        <AccordionTrigger className="hover:no-underline text-emerald-800 font-bold py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-emerald-100 rounded-lg"><Utensils className="h-4 w-4 text-emerald-600" /></div>
                                                                Nutritional Guidance
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-4">
                                                            <ul className="space-y-3 pl-4">
                                                                {res.recommendations?.dietary_tips?.map((tip: any, i: number) => (
                                                                    <li key={i} className="flex gap-3 p-2 rounded-lg bg-emerald-50/50">
                                                                        <div className="p-1.5 bg-white rounded-full shadow-sm self-start">
                                                                            <Apple className="h-3.5 w-3.5 text-emerald-600" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">{tip.category}</p>
                                                                            <p className="text-xs text-gray-700 font-medium">{typeof tip === 'string' ? tip : tip.text}</p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                    <AccordionItem value="monitoring" className="border-0 bg-white/50 rounded-2xl px-4 overflow-hidden border border-gray-100 shadow-sm">
                                                        <AccordionTrigger className="hover:no-underline text-amber-800 font-bold py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-amber-100 rounded-lg"><Activity className="h-4 w-4 text-amber-600" /></div>
                                                                Next Steps & Monitoring
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-4">
                                                            <ul className="space-y-3 pl-4">
                                                                {res.recommendations?.next_steps?.map((step: any, i: number) => (
                                                                    <li key={i} className="flex gap-3 p-2 rounded-lg bg-amber-50/50">
                                                                        <div className="p-1.5 bg-white rounded-full shadow-sm self-start">
                                                                            <CheckCircle className="h-3.5 w-3.5 text-amber-600" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{step.category}</p>
                                                                            <p className="text-xs text-gray-700 font-medium">{typeof step === 'string' ? step : step.text}</p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </div>

                                            {/* Hospital Suggestions */}
                                            {isHighRisk && res.nearby_hospitals?.length > 0 && (
                                                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 mb-4">
                                                        <Hospital className="h-6 w-6 text-red-600" />
                                                        <div>
                                                            <p className="text-sm font-bold text-red-900 leading-none">Emergency Resources</p>
                                                            <p className="text-[11px] text-red-700 mt-1">Recommended healthcare facilities near you</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {res.nearby_hospitals.slice(0, 4).map((hospital: any, i: number) => (
                                                            <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm hover:border-red-200 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-red-50 rounded-lg"><Hospital className="h-4 w-4 text-red-600" /></div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-gray-800 leading-none">{hospital.name}</span>
                                                                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                                            <MapPin className="h-2.5 w-2.5" /> {hospital.distance_km?.toFixed(1) || "?.?"} km away
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-red-600">
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>

                    {/* Left Column - User Settings */}
                    <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                        <Card className="border-0 shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
                            <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                    <User className="h-5 w-5 text-purple-600" />
                                    Account Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Full Name</Label>
                                        <div className="font-bold text-gray-800">{user.full_name || "N/A"}</div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Email Identity</Label>
                                        <div className="font-bold text-gray-800">{user?.email}</div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 rounded-xl py-6"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Terminate Session
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                    <LockIcon className="h-5 w-5 text-purple-600" />
                                    Access Control
                                </CardTitle>
                                <CardDescription>Modify your system credentials</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="old_password">Current Password</Label>
                                        <Input
                                            id="old_password"
                                            type="password"
                                            className="bg-gray-50/50 border-gray-100 rounded-xl"
                                            value={passData.old_password}
                                            onChange={handlePassChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new_password">New Password</Label>
                                        <Input
                                            id="new_password"
                                            type="password"
                                            className="bg-gray-50/50 border-gray-100 rounded-xl"
                                            value={passData.new_password}
                                            onChange={handlePassChange}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm_password">Verify Password</Label>
                                        <Input
                                            id="confirm_password"
                                            type="password"
                                            className="bg-gray-50/50 border-gray-100 rounded-xl"
                                            value={passData.confirm_password}
                                            onChange={handlePassChange}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg rounded-xl py-6 mt-4 text-white" disabled={isLoading}>
                                        {isLoading ? "Synchronizing..." : "Commit Changes"}
                                        {!isLoading && <Save className="ml-2 h-4 w-4" />}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-mono flex items-center justify-center gap-1 uppercase tracking-widest">
                                <Activity className="h-3 w-3" /> System Secure
                            </p>
                        </div>
                    </div>
                </div>
            </main >

            {/* Medical Chatbot - Global Access */}
            < MedicalChatbot />

            {/* Same Footer as Home Page */}
            < footer className="mt-20 border-t bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50" >
                <div className="container mx-auto px-4 py-8">
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
            </footer >
        </div >
    );
}
