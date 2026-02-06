import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import {
  Mic, MicOff, Loader2, ChevronRight, ChevronLeft,
  Sparkles, CheckCircle2, Volume2, AlertCircle, X,
  Keyboard, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Constants & Config ---

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'mr-IN', label: 'Marathi' }
];

const ONBOARDING_QUESTIONS = [
  {
    id: "intro",
    question: "Let's start with the basics",
    subtext: "Tell me about yourself - your name, age, what you're studying or doing, and your contact number.",
    hint: "Example: I'm Rahul, 21 years old, studying Computer Science at Delhi University. My number is 98765 43210.",
    fields: ["name", "dateOfBirth", "education", "contactNumber"]
  },
  {
    id: "income",
    question: "Money coming in",
    subtext: "How much do you earn or receive monthly, and where does it come from?",
    hint: "Example: I get about 25,000 rupees monthly - 15,000 from my part-time job and 10,000 as allowance.",
    fields: ["monthlyIncome", "incomeSource"]
  },
  {
    id: "expenses",
    question: "Money going out",
    subtext: "What are your main monthly expenses like rent, food, transport, etc?",
    hint: "Example: I pay 8,000 for rent, 5,000 on food, and maybe 3,000 on entertainment.",
    fields: ["monthlyBudget", "rentExpense", "foodExpense", "transportationExpense", "utilitiesExpense", "otherExpenses"]
  },
  {
    id: "savings",
    question: "Savings & Investments",
    subtext: "How much have you saved so far, what's your goal, and do you have any investments or debts?",
    hint: "Example: I have 50,000 saved. I've invested 20,000 in mutual funds. No debts.",
    fields: ["currentSavings", "savingsGoal", "investmentsAmount", "investmentType", "totalDebt", "debtDetails"]
  },
  {
    id: "goals",
    question: "Your Financial Goals",
    subtext: "What are your short-term and long-term financial goals?",
    hint: "Example: Short-term: Buy a laptop. Long-term: Save for masters abroad.",
    fields: ["shortTermGoals", "longTermGoals", "riskTolerance", "financialLiteracy"]
  }
];

// --- Main Component ---

const VoiceOnboarding = ({ open, onOpenChange, onProfileUpdate }) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [answers, setAnswers] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [isManualInput, setIsManualInput] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const textareaRef = useRef(null);

  // --- Initialization ---

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      setError("Voice input not supported in this browser.");
    } else {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + ' ';
          } else {
            interimTranscript += t;
          }
        }

        setInterim(interimTranscript);

        if (finalTranscript) {
          setTranscript(prev => {
            return (prev + " " + finalTranscript).replace(/\s+/g, ' ').trim();
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') return;
        if (event.error === 'not-allowed') setError("Microphone access denied.");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterim("");
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [selectedLanguage]);

  // Update language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  // --- Actions ---

  const speakQuestion = useCallback((text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Fallback if no voice selected/found, usually browser default is fine
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    // Since our questions in the array are English, forcing English is safer for question reading
    utterance.lang = 'en-US';
    utterance.rate = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [selectedLanguage]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setIsManualInput(false);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isListening]);

  const handleNext = () => {
    if (!transcript.trim()) {
      toast.error("Please provide an answer first");
      return;
    }

    const currentQ = ONBOARDING_QUESTIONS[currentStep];
    setAnswers(prev => ({ ...prev, [currentQ.id]: transcript.trim() }));
    setTranscript("");

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      const prevQ = ONBOARDING_QUESTIONS[prevStep];
      setTranscript(answers[prevQ.id] || "");
      setCurrentStep(prevStep);
    }
  };

  const handleFinish = async () => {
    // Save final answer
    const currentQ = ONBOARDING_QUESTIONS[currentStep];
    const finalAnswers = { ...answers, [currentQ.id]: transcript.trim() };

    if (!finalAnswers[currentQ.id]) {
      toast.error("Please complete the last question");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await axios.post(`${API_URL}/api/student/voice-onboarding`, {
        firebaseUid: user.uid,
        answers: finalAnswers
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        onProfileUpdate?.(response.data.data);
        onOpenChange(false);
      } else {
        throw new Error(response.data.message || "Failed");
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Render Helpers ---

  const currentQ = ONBOARDING_QUESTIONS[currentStep];
  const progressPercent = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-none shadow-2xl ring-1 ring-white/10">

        {/* Header Section */}
        <div className="p-6 bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              AI Profile Assistant
            </h2>
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative group">
                <Globe className="w-4 h-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-muted/50 rounded-full border border-transparent hover:border-border focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Step {currentStep + 1} / {ONBOARDING_QUESTIONS.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" indicatorClassName="bg-gradient-to-r from-primary to-purple-500" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 min-h-[400px] flex flex-col justify-between relative overflow-hidden">

          {/* Background Decor */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 z-10"
            >
              {/* Question Card */}
              <div className="space-y-2">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => speakQuestion(currentQ.subtext)}
                    className={cn(
                      "mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm",
                      isSpeaking ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                    title="Read Question"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">{currentQ.question}</h3>
                    <p className="text-lg text-muted-foreground mt-1 leading-relaxed">
                      {currentQ.subtext}
                    </p>
                  </div>
                </div>

                {/* Hint Box */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="ml-14 p-4 bg-muted/30 border border-border/50 rounded-xl rounded-tl-none text-sm text-muted-foreground italic"
                >
                  💡 {currentQ.hint}
                </motion.div>
              </div>

              {/* Input Area */}
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-0.5 rounded-xl bg-linear-to-r from-primary to-purple-500 opacity-0 transition duration-500 blur user-select-none",
                  isListening && "opacity-20 group-hover:opacity-30 animate-pulse"
                )} />

                <div className="relative bg-card rounded-xl border shadow-sm p-4 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      {isListening ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          Listening... {interim && <span className="text-primary font-normal ml-1">"{interim}"</span>}
                        </>
                      ) : (
                        <>
                          <Keyboard className="w-3 h-3" />
                          Your Answer
                        </>
                      )}
                    </label>
                    {transcript && (
                      <button onClick={() => setTranscript("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                    )}
                  </div>

                  <Textarea
                    ref={textareaRef}
                    value={transcript}
                    onChange={(e) => {
                      setTranscript(e.target.value);
                      setIsManualInput(true);
                      if (isListening) setIsListening(false); // Stop listening if user types
                    }}
                    placeholder={isListening ? "Listening to your voice..." : "Tap the microphone to speak, or type your answer here..."}
                    className="min-h-[120px] resize-none border-none shadow-none p-0 focus-visible:ring-0 text-lg bg-transparent leading-relaxed placeholder:text-muted-foreground/40"
                  />

                  {/* Mic Controls Overlay - Floating or Integrated? Integrated for cleaner look */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {browserSupported && (
                      <Button
                        size="icon"
                        variant={isListening ? "destructive" : "default"}
                        className={cn(
                          "h-12 w-12 rounded-full shadow-lg transition-all duration-300",
                          isListening ? "scale-110 ring-4 ring-red-500/20" : "hover:scale-105"
                        )}
                        onClick={toggleListening}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between mt-8 z-10">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </span>
              )}
              {currentStep === ONBOARDING_QUESTIONS.length - 1 ? (
                <Button onClick={handleFinish} disabled={isProcessing} className="bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Complete Profile
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!transcript.trim()} className="px-6">
                  Next Question <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceOnboarding;
