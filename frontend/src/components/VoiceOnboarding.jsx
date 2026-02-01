import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { 
  Mic, MicOff, Loader2, ChevronRight, ChevronLeft, 
  Sparkles, CheckCircle2, Volume2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Conversational questions for voice onboarding
const ONBOARDING_QUESTIONS = [
  {
    id: "intro",
    question: "Hey! Let's set up your financial profile quickly. Tell me about yourself - your name, age, what you're studying or doing, and if you have any contact number you'd like to add?",
    hint: "Example: I'm Rahul, 21 years old, studying Computer Science at Delhi University. My number is 98765 43210.",
    fields: ["name", "dateOfBirth", "education", "contactNumber"]
  },
  {
    id: "income",
    question: "Great! Now tell me about your income - how much do you earn or receive monthly, and where does it come from? Like salary, allowance, freelancing, etc.",
    hint: "Example: I get about 25,000 rupees monthly - 15,000 from my part-time job and 10,000 as allowance from parents.",
    fields: ["monthlyIncome", "incomeSource"]
  },
  {
    id: "expenses",
    question: "Let's talk about your spending. What are your main monthly expenses? Think about rent, food, transport, utilities, subscriptions, and anything else you spend on regularly.",
    hint: "Example: I pay 8,000 for rent, around 5,000 on food, 2,000 on transport, 1,500 on utilities, and maybe 3,000 on entertainment and shopping.",
    fields: ["monthlyBudget", "rentExpense", "foodExpense", "transportationExpense", "utilitiesExpense", "otherExpenses"]
  },
  {
    id: "savings",
    question: "How about savings and investments? How much have you saved so far, what's your savings goal, and do you have any investments or debts?",
    hint: "Example: I have about 50,000 saved, trying to reach 2 lakhs. I've invested 20,000 in mutual funds. No debts currently.",
    fields: ["currentSavings", "savingsGoal", "investmentsAmount", "investmentType", "totalDebt", "debtDetails"]
  },
  {
    id: "goals",
    question: "Last one! What are your financial goals? Any short-term goals like buying a phone or going on a trip? And long-term ones like building an emergency fund or saving for higher education?",
    hint: "Example: Short-term - I want to buy a new laptop worth 80,000 in 6 months. Long-term - build an emergency fund of 1.5 lakhs and save for my masters abroad.",
    fields: ["shortTermGoals", "longTermGoals", "riskTolerance", "financialLiteracy"]
  }
];

const VoiceOnboarding = ({ open, onOpenChange, onProfileUpdate }) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      setError("Your browser doesn't support speech recognition. Please use Chrome or Edge.");
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!browserSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Indian English

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(prev => {
          if (finalTranscript) {
            return prev + finalTranscript;
          }
          return prev;
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError("No speech detected. Please try again.");
        } else if (event.error === 'audio-capture') {
          setError("Microphone not found. Please check your microphone.");
        } else if (event.error === 'not-allowed') {
          setError("Microphone access denied. Please allow microphone access.");
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if we're still supposed to be listening
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [browserSupported, isListening]);

  // Speak the question when step changes
  const speakQuestion = useCallback((text) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setError(null);
    setTranscript("");
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setError("Failed to start microphone. Please try again.");
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  // Save current answer and move to next question
  const saveAnswer = useCallback(() => {
    if (!transcript.trim()) {
      toast.error("Please say something before continuing");
      return;
    }

    const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: transcript.trim()
    }));
    setTranscript("");
    
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [transcript, currentStep]);

  // Go to previous question
  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const prevQuestion = ONBOARDING_QUESTIONS[currentStep - 1];
      setTranscript(answers[prevQuestion.id] || "");
    }
  }, [currentStep, answers]);

  // Process all answers with Groq
  const processWithAI = async () => {
    // Save current answer first
    const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: transcript.trim()
    };

    if (!finalAnswers[currentQuestion.id]) {
      toast.error("Please answer the current question before finishing");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/student/voice-onboarding`, {
        firebaseUid: user.uid,
        answers: finalAnswers
      });

      if (response.data.success) {
        toast.success("Profile created successfully! 🎉");
        onProfileUpdate?.(response.data.data);
        onOpenChange(false);
        
        // Reset state
        setCurrentStep(0);
        setTranscript("");
        setAnswers({});
      } else {
        throw new Error(response.data.message || "Failed to process profile");
      }
    } catch (error) {
      console.error("Error processing voice onboarding:", error);
      setError(error.response?.data?.message || "Failed to process your answers. Please try again.");
      toast.error("Failed to process profile");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;
  const isLastQuestion = currentStep === ONBOARDING_QUESTIONS.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" showCloseButton={!isProcessing}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Voice Setup
          </DialogTitle>
          <DialogDescription>
            Answer {ONBOARDING_QUESTIONS.length} simple questions with your voice to set up your profile
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Question {currentStep + 1} of {ONBOARDING_QUESTIONS.length}</span>
            <span className="text-primary font-medium">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Volume2 className={cn("w-4 h-4 text-primary", isSpeaking && "animate-pulse")} />
              </div>
              <div>
                <p className="font-medium leading-relaxed">{currentQuestion.question}</p>
                <button 
                  onClick={() => speakQuestion(currentQuestion.question)}
                  className="text-xs text-primary mt-2 hover:underline"
                  disabled={isSpeaking}
                >
                  {isSpeaking ? "Speaking..." : "🔊 Listen to question"}
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground pl-11">{currentQuestion.hint}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Transcript display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Answer:</label>
            <div className={cn(
              "min-h-[100px] p-4 rounded-lg border-2 transition-all",
              isListening ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            )}>
              {transcript ? (
                <p className="text-foreground">{transcript}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  {isListening ? "Listening... speak now" : "Click the mic button to start speaking"}
                </p>
              )}
              {isListening && (
                <div className="flex items-center gap-1 mt-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Recording...</span>
                </div>
              )}
            </div>
          </div>

          {/* Microphone button */}
          <div className="flex justify-center">
            {browserSupported ? (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg shadow-red-500/30" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            ) : (
              <div className="text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-destructive" />
                <p>Speech recognition not supported</p>
                <p className="text-sm">Please use Chrome or Edge browser</p>
              </div>
            )}
          </div>

          {browserSupported && (
            <p className="text-center text-sm text-muted-foreground">
              {isListening ? "Tap to stop recording" : "Tap the mic to start speaking"}
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0 || isProcessing}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={processWithAI}
              disabled={isProcessing || !transcript.trim()}
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finish Setup
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={saveAnswer}
              disabled={!transcript.trim() || isProcessing}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceOnboarding;
