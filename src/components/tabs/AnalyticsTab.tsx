import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Calendar,
  AlertTriangle,
  MapPin
} from "lucide-react";

interface Assessment {
  id: string;
  patient_id: string;
  patient_data: {
    age: string;
    weight: string;
    gender: string;
    location: string;
    height: string;
    name?: string;
  };
  result: {
    bmi: number;
    bmi_category: string;
    risk_level: string;
    malnutrition_risk: number;
    consensus_pred?: string;
  };
  timestamp: string;
}

export default function AnalyticsTab() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/assessments");
      if (response.ok) {
        const assessmentsData = await response.json();

        // Merge with local storage
        const localAssessments = JSON.parse(localStorage.getItem('assessments') || '[]');
        const allAssessments = [...assessmentsData];
        localAssessments.forEach((la: any) => {
          if (!allAssessments.find(aa => aa.id === la.id)) {
            allAssessments.push(la);
          }
        });

        setAssessments(allAssessments);
        if (allAssessments.length >= 10) {
          generateInsights(allAssessments);
        }
      } else {
        throw new Error("Backend unavailable");
      }
    } catch (error) {
      console.warn("Using local storage fallback for analytics", error);
      const storedAssessments = JSON.parse(localStorage.getItem('assessments') || '[]');
      setAssessments(storedAssessments);
      if (storedAssessments.length >= 10) {
        generateInsights(storedAssessments);
      }
    }
  };

  const generateInsights = (assessmentData: Assessment[]) => {
    const insights: string[] = [];

    // BMI distribution insights
    const bmiCounts = assessmentData.reduce((acc, assessment) => {
      acc[assessment.result.bmi_category] = (acc[assessment.result.bmi_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalAssessments = assessmentData.length;
    const sortedBMI = Object.entries(bmiCounts).sort(([, a], [, b]) => b - a);

    if (sortedBMI.length >= 2) {
      insights.push(
        `BMI Distribution: ${sortedBMI[0][0]} accounts for ${Math.round((sortedBMI[0][1] / totalAssessments) * 100)}% (${sortedBMI[0][1]}/${totalAssessments}) of patients, followed by ${sortedBMI[1][0]} at ${Math.round((sortedBMI[1][1] / totalAssessments) * 100)}%.`
      );
    }

    // Risk level insights
    const riskCounts = assessmentData.reduce((acc, assessment) => {
      acc[assessment.result.risk_level] = (acc[assessment.result.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highRisk = (riskCounts.High || 0) + (riskCounts.Critical || 0);
    const highRiskPercent = Math.round((highRisk / totalAssessments) * 100);

    if (highRisk > 0) {
      insights.push(
        `Risk Assessment: ${highRisk} patients (${highRiskPercent}%) are classified as high or critical risk, requiring immediate medical attention.`
      );
    }

    // Trend analysis (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAssessments = assessmentData.filter(
      a => new Date(a.timestamp) >= thirtyDaysAgo
    );

    if (recentAssessments.length >= 5) {
      const malnutritionRate = recentAssessments.filter(
        a => a.result.risk_level === 'High' || a.result.risk_level === 'Critical'
      ).length / recentAssessments.length;

      insights.push(
        `30-Day Trend: Malnutrition risk rate is ${Math.round(malnutritionRate * 100)}% among recent assessments, indicating ${malnutritionRate > 0.3 ? 'elevated' : 'manageable'} community health status.`
      );
    }

    insights.push(
      `Community Snapshot: The population consists of ${Math.round((assessmentData.filter(a => a.patient_data.gender === 'Female').length / totalAssessments) * 100)}% females and ${Math.round((assessmentData.filter(a => a.patient_data.gender === 'Male').length / totalAssessments) * 100)}% males.`
    );

    const locations = assessmentData.reduce((acc, a) => {
      const loc = a.patient_data.location?.split(',')[0].trim() || 'Unknown';
      acc[loc] = (acc[loc] || 0) + (['High', 'Critical'].includes(a.result.risk_level) ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);

    const topHotspot = Object.entries(locations).sort(([, a], [, b]) => b - a)[0];
    if (topHotspot && topHotspot[1] > 0) {
      insights.push(
        `Geographic Alert: ${topHotspot[0]} has been identified as a priority area with ${topHotspot[1]} high-risk cases. Targeted nutritional intervention is recommended for this region.`
      );
    }

    // Age Group Risk Analysis
    const ageGroupRisks = assessmentData.reduce((acc, a) => {
      const age = parseInt(a.patient_data.age);
      let group = 'Adult';
      if (age <= 5) group = 'Early Childhood (0-5)';
      else if (age <= 12) group = 'Childhood (6-12)';
      else if (age <= 19) group = 'Adolescent (13-19)';
      else if (age >= 60) group = 'Senior (60+)';

      if (!acc[group]) acc[group] = { high: 0, total: 0 };
      acc[group].total++;
      if (['High', 'Critical'].includes(a.result.risk_level)) acc[group].high++;
      return acc;
    }, {} as Record<string, { high: number; total: number }>);

    Object.entries(ageGroupRisks).forEach(([group, data]) => {
      const rate = data.high / data.total;
      if (rate > 0.4 && data.total >= 3) {
        insights.push(
          `Vulnerability Cluster: The ${group} demographic is showing an elevated malnutrition risk rate of ${Math.round(rate * 100)}%. Prioritize ${group.includes('0-5') ? 'pediatric' : 'relevant'} outreach programs.`
        );
      }
    });

    // Gender Disparity Detection
    const femaleData = assessmentData.filter(a => a.patient_data.gender === 'Female');
    const maleData = assessmentData.filter(a => a.patient_data.gender === 'Male');

    if (femaleData.length > 0 && maleData.length > 0) {
      const femaleRisk = femaleData.filter(a => ['High', 'Critical'].includes(a.result.risk_level)).length / femaleData.length;
      const maleRisk = maleData.filter(a => ['High', 'Critical'].includes(a.result.risk_level)).length / maleData.length;

      if (Math.abs(femaleRisk - maleRisk) > 0.2 && totalAssessments > 15) {
        const moreAtRisk = femaleRisk > maleRisk ? 'Females' : 'Males';
        insights.push(
          `Gender Insight: ${moreAtRisk} are currently experiencing significantly higher risk levels (${Math.round(Math.max(femaleRisk, maleRisk) * 100)}%) compared to their counterparts. Investigating socio-economic or accessibility factors is advised.`
        );
      }
    }

    // Trend Forecast
    if (recentAssessments.length >= 10) {
      const prevAssessments = assessmentData.filter(a => {
        const d = new Date(a.timestamp);
        return d < thirtyDaysAgo && d >= new Date(new Date().setDate(thirtyDaysAgo.getDate() - 30));
      });

      if (prevAssessments.length > 5) {
        const prevRate = prevAssessments.filter(a => ['High', 'Critical'].includes(a.result.risk_level)).length / prevAssessments.length;
        const currentRate = recentAssessments.filter(a => ['High', 'Critical'].includes(a.result.risk_level)).length / recentAssessments.length;

        if (currentRate > prevRate * 1.2) {
          insights.push(
            `Warning: Community risk levels have increased by ${Math.round((currentRate - prevRate) * 100)}% in the last 30 days. Immediate resource allocation for preventive measures is recommended.`
          );
        } else if (currentRate < prevRate * 0.8) {
          insights.push(
            `Positive Trend: Malnutrition risk has decreased by ${Math.round((prevRate - currentRate) * 100)}% compared to the previous period. Intervention strategies appear effective.`
          );
        }
      }
    }

    setInsights(insights);
  };

  const getAgeDistribution = () => {
    const groups = {
      'Infant (0-2)': 0,
      'Child (3-12)': 0,
      'Teen (13-19)': 0,
      'Adult (20-59)': 0,
      'Elderly (60+)': 0
    };

    assessments.forEach(a => {
      const age = parseInt(a.patient_data.age);
      if (age <= 2) groups['Infant (0-2)']++;
      else if (age <= 12) groups['Child (3-12)']++;
      else if (age <= 19) groups['Teen (13-19)']++;
      else if (age <= 59) groups['Adult (20-59)']++;
      else groups['Elderly (60+)']++;
    });

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  };

  const getGenderDistribution = () => {
    const counts = assessments.reduce((acc, a) => {
      acc[a.patient_data.gender] = (acc[a.patient_data.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: name === 'Male' ? '#3b82f6' : name === 'Female' ? '#ec4899' : '#8b5cf6'
    }));
  };

  const getLocationData = () => {
    const locationRisks = assessments.reduce((acc, a) => {
      const loc = a.patient_data.location?.split(',')[0].trim() || 'Unknown';
      if (!acc[loc]) acc[loc] = { name: loc, highRisk: 0, total: 0 };
      acc[loc].total++;
      if (['High', 'Critical'].includes(a.result.risk_level)) acc[loc].highRisk++;
      return acc;
    }, {} as Record<string, { name: string; highRisk: number; total: number }>);

    return Object.values(locationRisks)
      .sort((a, b) => b.highRisk - a.highRisk)
      .slice(0, 5);
  };

  const getBMIDistribution = () => {
    const distribution = assessments.reduce((acc, assessment) => {
      acc[assessment.result.bmi_category] = (acc[assessment.result.bmi_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      'Underweight': '#f59e0b',
      'Normal': '#10b981',
      'Overweight': '#f59e0b',
      'Obese': '#ef4444'
    };

    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count,
      color: colors[category as keyof typeof colors] || '#6b7280'
    }));
  };

  const getRiskDistribution = () => {
    const distribution = assessments.reduce((acc, assessment) => {
      acc[assessment.result.risk_level] = (acc[assessment.result.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      'Low': '#10b981',
      'Moderate': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };

    return Object.entries(distribution).map(([level, count]) => ({
      name: level,
      count,
      color: colors[level as keyof typeof colors] || '#6b7280'
    }));
  };

  const getTrendData = () => {
    // Group assessments by date
    const dateGroups = assessments.reduce((acc, assessment) => {
      const date = new Date(assessment.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(assessment);
      return acc;
    }, {} as Record<string, Assessment[]>);

    // Calculate malnutrition rate for each date
    return Object.entries(dateGroups)
      .map(([date, dayAssessments]) => {
        const malnutritionCount = dayAssessments.filter(
          a => a.result.risk_level === 'High' || a.result.risk_level === 'Critical'
        ).length;

        return {
          date: new Date(date).toLocaleDateString(),
          rate: Math.round((malnutritionCount / dayAssessments.length) * 100),
          total: dayAssessments.length
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  };

  const getScatterData = () => {
    return assessments.map(assessment => ({
      age: parseInt(assessment.patient_data.age),
      weight: parseFloat(assessment.patient_data.weight),
      risk: assessment.result.risk_level,
      bmi: assessment.result.bmi
    }));
  };

  const getStats = () => {
    const totalPatients = new Set(assessments.map(a => a.patient_id)).size;
    const totalAssessments = assessments.length;

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weeklyAssessments = assessments.filter(a => new Date(a.timestamp) >= thisWeek).length;

    const malnutritionCount = assessments.filter(
      a => a.result.risk_level === 'High' || a.result.risk_level === 'Critical'
    ).length;
    const malnutritionRate = totalAssessments > 0 ? (malnutritionCount / totalAssessments) * 100 : 0;

    return {
      totalPatients,
      totalAssessments,
      weeklyAssessments,
      malnutritionRate: Math.round(malnutritionRate * 10) / 10
    };
  };

  const stats = getStats();

  if (assessments.length < 10) {
    return (
      <Card className="text-center py-16">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Activity className="h-6 w-6 text-medical-info" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Advanced analytics and population health insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-6xl font-bold text-medical-info">{assessments.length}</div>
            <div className="text-xl text-muted-foreground">
              {10 - assessments.length} more assessments needed for analytics
            </div>
            <Badge variant="outline" className="text-sm">
              Minimum 10 assessments required for detailed insights
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bmiData = getBMIDistribution();
  const riskData = getRiskDistribution();
  const trendData = getTrendData();
  const scatterData = getScatterData();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              Unique individuals screened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-medical-success" />
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-success">{stats.totalAssessments}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Complete evaluations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-warning" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-warning">{stats.weeklyAssessments}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Recent assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-medical-danger" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-danger">{stats.malnutritionRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              High/Critical risk patients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
        {/* Dynamic Demographics Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Demographic Breakdown
              <Badge variant="outline">Age & Gender</Badge>
            </CardTitle>
            <CardDescription>
              Population structure analysis by age groups and gender distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getGenderDistribution()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getGenderDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAgeDistribution()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Hotspots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Geographic Risk Hotspots
              <MapPin className="h-4 w-4 text-medical-danger" />
            </CardTitle>
            <CardDescription>
              Identifying regions with the highest number of high-risk cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getLocationData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="highRisk" fill="#ef4444" name="High Risk Cases" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#e2e8f0" name="Total Screens" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* BMI & Risk Correlation */}
        <Card>
          <CardHeader>
            <CardTitle>BMI Category vs Risk Level</CardTitle>
            <CardDescription>
              Understanding the correlation between BMI and malnutrition risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bmiData}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {bmiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Level Distribution - RESTORED */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>
              Patient count by malnutrition risk classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#666' }}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Historical Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Malnutrition Rate Trend</CardTitle>
            <CardDescription>
              Daily percentage of high-risk assessments over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Risk Rate']} />
                  <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Risk Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Age vs Weight Distribution - RESTORED */}
        <Card>
          <CardHeader>
            <CardTitle>Age vs Weight Distribution</CardTitle>
            <CardDescription>
              Patient demographics with malnutrition risk indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" dataKey="age" name="Age" unit="y" />
                  <YAxis type="number" dataKey="weight" name="Weight" unit="kg" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Patients" data={scatterData} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Generated Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-medical-info" />
              Population Health Insights
            </CardTitle>
            <CardDescription>
              AI-generated analysis of assessment patterns and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
              <div className="mt-4 p-3 bg-medical-info/10 rounded-lg border border-medical-info/20">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> These insights are automatically generated based on assessment data patterns.
                  They should be interpreted by qualified healthcare professionals and used alongside clinical judgment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}