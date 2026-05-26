import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  HelpCircle,
  X,
  Minimize2,
  Maximize2
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function MedicalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your medical assistant. I can help answer questions about the malnutrition assessment system, BMI interpretation, and general nutrition guidance. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const faqResponses: Record<string, string> = {
    'high risk': 'High risk indicates a malnutrition risk score of 50-74%. This suggests significant nutritional concerns that require medical attention within 2 weeks. The patient should follow the personalized recommendations and consult with a healthcare provider for a comprehensive evaluation.',
    
    'critical risk': 'Critical risk indicates a malnutrition risk score of 75-100%. This is the highest risk level requiring immediate medical attention within 1 week. Patients in this category need urgent nutritional intervention and should see a doctor as soon as possible.',
    
    'bmi categories': 'BMI categories are: Underweight (<18.5), Normal (18.5-24.9), Overweight (25.0-29.9), and Obese (≥30.0). Each category has specific health implications and dietary recommendations.',
    
    'gain weight': 'To gain weight healthily: 1) Eat calorie-dense, nutrient-rich foods like nuts, seeds, avocados, and healthy oils. 2) Have 5-6 small meals throughout the day. 3) Include protein at every meal. 4) Add healthy snacks like yogurt, dried fruits, and nut butters. 5) Stay hydrated and get adequate sleep. Always consult a healthcare provider for personalized advice.',
    
    'lose weight': 'For healthy weight loss: 1) Create a moderate calorie deficit through diet and exercise. 2) Focus on whole foods - vegetables, fruits, lean proteins, whole grains. 3) Practice portion control using the plate method. 4) Stay hydrated and get adequate sleep. 5) Aim for gradual weight loss of 1-2 pounds per week. Consult a healthcare provider before starting any weight loss program.',
    
    'app usage': 'To use the app: 1) Enter patient details in the New Assessment tab. 2) Click "Run Assessment" to get BMI, risk level, and recommendations. 3) Save the assessment to track patient history. 4) View analytics and patient records in their respective tabs. All data is securely stored and follows medical privacy standards.',
    
    'data ranges': 'Valid input ranges are: Age (1-120 years), Height (50-250 cm), Weight (10-300 kg). These ranges ensure accurate BMI calculation and appropriate risk assessment for diverse patient populations.',
    
    'confidence': 'Confidence percentage indicates how certain the AI models are about the prediction. Higher confidence (>80%) means the models strongly agree on the assessment. Lower confidence may indicate borderline cases that benefit from additional clinical evaluation.',
    
    'find hospitals': 'The system automatically finds nearby hospitals when location data is available. You can enable GPS location or manually enter your city. The app shows the 5 closest healthcare facilities with distances and contact information.',
    
    'privacy': 'Your data privacy is protected: 1) All patient information stays on secure servers. 2) No data is shared with third parties except configured map services for hospital search. 3) Exports can be anonymized. 4) GPS consent is requested before location access. 5) Comprehensive audit logging tracks all data access.'
  };

  const quickButtons = [
    { text: "What does High risk mean?", key: "high risk" },
    { text: "How to gain weight healthily?", key: "gain weight" },
    { text: "Find hospitals near me", key: "find hospitals" },
    { text: "BMI categories explained", key: "bmi categories" }
  ];

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for FAQ matches
    for (const [key, response] of Object.entries(faqResponses)) {
      if (message.includes(key)) {
        return response;
      }
    }

    // General nutrition guidance with safety rails
    if (message.includes('diet') || message.includes('nutrition')) {
      return 'For personalized dietary advice, I recommend consulting with a registered dietitian or your healthcare provider. General principles include: eating a variety of foods from all food groups, staying hydrated, and maintaining regular meal patterns. The assessment recommendations provide specific guidance based on your BMI and risk level.';
    }
    
    if (message.includes('supplement')) {
      return 'Supplement recommendations should always come from qualified healthcare providers based on individual needs and medical history. Some patients may benefit from vitamin D, B12, iron, or other supplements, but proper testing and medical guidance are essential before starting any supplements.';
    }
    
    if (message.includes('exercise') || message.includes('activity')) {
      return 'Physical activity recommendations vary by age, health status, and fitness level. Generally, adults should aim for 150 minutes of moderate-intensity exercise weekly. For specific exercise plans, especially if you have health conditions, please consult with your healthcare provider or a certified fitness professional.';
    }

    // Safety rail - no medical diagnoses
    if (message.includes('diagnose') || message.includes('disease') || message.includes('condition')) {
      return 'I cannot provide medical diagnoses or treat specific medical conditions. This tool is for nutritional screening only. For any health concerns, symptoms, or medical questions, please consult with qualified healthcare professionals who can provide proper medical evaluation and treatment.';
    }

    // Default helpful response
    return 'I can help with questions about: using this assessment tool, understanding BMI and risk levels, general nutrition principles, and finding healthcare facilities. For specific medical advice, please consult with healthcare professionals. Is there something specific about the malnutrition assessment you\'d like to know?';
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: generateResponse(inputMessage),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInputMessage('');
  };

  const handleQuickButton = (key: string) => {
    const response = faqResponses[key];
    if (response) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: quickButtons.find(b => b.key === key)?.text || key,
        timestamp: new Date()
      };

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m your medical assistant. I can help answer questions about the malnutrition assessment system, BMI interpretation, and general nutrition guidance. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg text-white"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md h-[600px] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-medical-info/10">
                  <Bot className="h-4 w-4 text-medical-info" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Medical Assistant</DialogTitle>
                  <DialogDescription className="text-xs">
                    AI-powered nutrition guidance
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                >
                  Clear
                </Button>
              </div>
            </div>
          </DialogHeader>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'bot' && (
                        <div className="p-1 rounded-full bg-medical-info/10 h-fit">
                          <Bot className="h-3 w-3 text-medical-info" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          message.type === 'user'
                            ? 'bg-medical-info text-white'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {message.content}
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {message.type === 'user' && (
                        <div className="p-1 rounded-full bg-medical-success/10 h-fit">
                          <User className="h-3 w-3 text-medical-success" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Quick Action Buttons */}
              <div className="px-4 py-2 border-t border-b">
                <div className="text-xs text-muted-foreground mb-2">Quick questions:</div>
                <div className="flex flex-wrap gap-1">
                  {quickButtons.map((button) => (
                    <Button
                      key={button.key}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleQuickButton(button.key)}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about nutrition, BMI, or app usage..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    size="sm"
                    className="bg-medical-info hover:bg-medical-info/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  For medical advice, consult qualified healthcare providers
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}