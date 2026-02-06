import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  DollarSign,
  Activity,
  Shield,
  Zap,
  Brain,
  Search,
  Info,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { toast } from "sonner";
import { Money } from "@/components/ui/money";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const SECTORS = [
  'IT Services',
  'Banking',
  'FMCG',
  'Energy & Petrochemicals',
  'Automobile',
  'Pharmaceuticals',
  'Telecom',
  'Financial Services'
];

export default function StockRecommendations() {
  const { user } = useUser();
  const [step, setStep] = useState('questionnaire'); // questionnaire, loading, results
  const [qStep, setQStep] = useState(0);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  // Questionnaire state
  const [preferences, setPreferences] = useState({
    investmentHorizon: 'medium',
    riskAppetite: 'moderate',
    investmentAmount: 10000,
    sectors: [],
    investmentGoal: '',
    experienceLevel: 'beginner'
  });

  // Fetch existing recommendations on mount
  useEffect(() => {
    if (!user) return;

    const fetchRecommendations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/stocks/${user.uid}`);
        if (res.data.data) {
          setRecommendations(res.data.data);
          setStep('results');
        }
      } catch (error) {
        console.log('No existing recommendations found');
      }
    };

    fetchRecommendations();
  }, [user]);

  const handleGenerateRecommendations = async () => {
    if (!preferences.investmentGoal.trim()) {
      toast.error('Please describe your investment goal');
      return;
    }

    setLoading(true);
    setStep('loading');

    try {
      const res = await axios.post(`${API_URL}/api/stocks/generate`, {
        firebaseUid: user.uid,
        preferences
      });

      setRecommendations(res.data.data);
      setStep('results');
      toast.success('Recommendations generated successfully!');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
      setStep('questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setStep('questionnaire');
    setRecommendations(null);
  };

  const toggleSector = (sector) => {
    setPreferences(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const handleSearchStock = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await axios.get(`${API_URL}/api/stocks/search?query=${searchQuery}`);
      if (res.data.data) {
        setSearchResult(res.data.data);
      } else {
        toast.info("No stocks found matching that query.");
      }
    } catch (error) {
      console.error("Search error", error);
      toast.error("Failed to search stock");
    } finally {
      setSearching(false);
    }
  };

  // Questionnaire View
  if (step === 'questionnaire') {
    const handleNext = () => {
      if (qStep < totalSteps - 1) setQStep(prev => prev + 1);
    };

    const handleBack = () => {
      if (qStep > 0) setQStep(prev => prev - 1);
    };

    return (
      <div className="h-full w-full p-4 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary rounded-2xl shadow-lg">
                <TrendingUp className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold">Stock Recommendations</h1>
            <p className="text-muted-foreground text-lg">
              Get personalized stock picks based on your financial profile and goals
            </p>
          </div>

          <Card className="border-2 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/50 pb-6">
              <div className="flex items-center justify-between mb-2">
                 <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    {qStep === 0 && "Step 1: The Basics"}
                    {qStep === 1 && "Step 2: Risk Profile"}
                    {qStep === 2 && "Step 3: Investment Strategy"}
                 </CardTitle>
                 <span className="text-sm text-muted-foreground font-medium">
                   Step {qStep + 1} of {totalSteps}
                 </span>
              </div>
              <Progress value={((qStep + 1) / totalSteps) * 100} className="h-2" />
              <CardDescription className="mt-2">
                {qStep === 0 && "Let's start with your investment timeline and experience."}
                {qStep === 1 && "Help us understand your comfort with risk and your goals."}
                {qStep === 2 && "Define your capital and sector preferences."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={qStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Step 1: Basics */}
                  {qStep === 0 && (
                    <>
                      {/* Investment Horizon */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">How long do you plan to invest?</Label>
                        <RadioGroup
                          value={preferences.investmentHorizon}
                          onValueChange={(value) => setPreferences({ ...preferences, investmentHorizon: value })}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <Label
                            htmlFor="short"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.investmentHorizon === 'short'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="short" id="short" />
                            <div>
                              <div className="font-semibold">Short Term</div>
                              <div className="text-xs text-muted-foreground">Less than 1 year</div>
                            </div>
                          </Label>
                          <Label
                            htmlFor="medium"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.investmentHorizon === 'medium'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="medium" id="medium" />
                            <div>
                              <div className="font-semibold">Medium Term</div>
                              <div className="text-xs text-muted-foreground">1-3 years</div>
                            </div>
                          </Label>
                          <Label
                            htmlFor="long"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.investmentHorizon === 'long'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="long" id="long" />
                            <div>
                              <div className="font-semibold">Long Term</div>
                              <div className="text-xs text-muted-foreground">3+ years</div>
                            </div>
                          </Label>
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Experience Level */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Your investment experience level?</Label>
                        <RadioGroup
                          value={preferences.experienceLevel}
                          onValueChange={(value) => setPreferences({ ...preferences, experienceLevel: value })}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <Label
                            htmlFor="beginner"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.experienceLevel === 'beginner'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="beginner" id="beginner" />
                            <div>
                              <div className="font-semibold">Beginner</div>
                              <div className="text-xs text-muted-foreground">New to investing</div>
                            </div>
                          </Label>
                          <Label
                            htmlFor="intermediate"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.experienceLevel === 'intermediate'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="intermediate" id="intermediate" />
                            <div>
                              <div className="font-semibold">Intermediate</div>
                              <div className="text-xs text-muted-foreground">Some experience</div>
                            </div>
                          </Label>
                          <Label
                            htmlFor="advanced"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.experienceLevel === 'advanced'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="advanced" id="advanced" />
                            <div>
                              <div className="font-semibold">Advanced</div>
                              <div className="text-xs text-muted-foreground">Experienced investor</div>
                            </div>
                          </Label>
                        </RadioGroup>
                      </div>
                    </>
                  )}

                  {/* Step 2: Risk Profile */}
                  {qStep === 1 && (
                    <>
                      {/* Risk Appetite */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">What is your risk tolerance?</Label>
                        <RadioGroup
                          value={preferences.riskAppetite}
                          onValueChange={(value) => setPreferences({ ...preferences, riskAppetite: value })}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <Label
                            htmlFor="conservative"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.riskAppetite === 'conservative'
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                : 'border-border hover:border-green-500/50'
                            }`}
                          >
                            <RadioGroupItem value="conservative" id="conservative" />
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                Conservative
                              </div>
                              <div className="text-sm text-muted-foreground">Stable, low risk</div>
                            </div>
                          </Label>
                          <Label
                            htmlFor="moderate"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.riskAppetite === 'moderate'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                : 'border-border hover:border-blue-500/50'
                            }`}
                          >
                            <RadioGroupItem value="moderate" id="moderate" />
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Moderate
                              </div>
                              <div className="text-sm text-muted-foreground">Balanced approach</div>
                            </div>
                          </Label>
                          <Label
                            htmlFor="aggressive"
                            className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              preferences.riskAppetite === 'aggressive'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                                : 'border-border hover:border-orange-500/50'
                            }`}
                          >
                            <RadioGroupItem value="aggressive" id="aggressive" />
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                Aggressive
                              </div>
                              <div className="text-sm text-muted-foreground">High growth potential</div>
                            </div>
                          </Label>
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Investment Goal */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          What is your primary investment goal?
                        </Label>
                        <textarea
                          value={preferences.investmentGoal}
                          onChange={(e) => setPreferences({ ...preferences, investmentGoal: e.target.value })}
                          placeholder="E.g., Building wealth for retirement, saving for a car, generating passive income..."
                          className="w-full min-h-[120px] p-4 border-2 rounded-xl bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </>
                  )}

                  {/* Step 3: Strategy */}
                  {qStep === 2 && (
                    <>
                      {/* Investment Amount */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-base font-semibold">How much do you want to invest?</Label>
                          <Badge variant="secondary" className="text-lg font-semibold">
                            <Money>₹{preferences.investmentAmount.toLocaleString()}</Money>
                          </Badge>
                        </div>
                        <Slider
                          value={[preferences.investmentAmount]}
                          min={5000}
                          max={500000}
                          step={5000}
                          onValueChange={(value) => setPreferences({ ...preferences, investmentAmount: value[0] })}
                          className="py-4 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>₹5,000</span>
                          <span>₹5,00,000</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Sector Preferences */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Preferred sectors (optional - select multiple)
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {SECTORS.map((sector) => (
                            <Label
                              key={sector}
                              className={`flex items-center space-x-2 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                preferences.sectors.includes(sector)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <Checkbox
                                checked={preferences.sectors.includes(sector)}
                                onCheckedChange={() => toggleSector(sector)}
                              />
                              <span className="text-sm">{sector}</span>
                            </Label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            {/* Navigation Buttons */}
            <div className="p-6 bg-muted/20 border-t flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                disabled={qStep === 0 || loading}
                size="lg"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {qStep < totalSteps - 1 ? (
                <Button 
                  onClick={handleNext} 
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateRecommendations}
                  disabled={loading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get Recommendations
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Loading View
  if (step === 'loading') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-12 h-12 text-primary-foreground animate-pulse" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto">
              <Loader2 className="w-24 h-24 animate-spin text-primary/30" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Analyzing Market Data</h2>
            <p className="text-muted-foreground">
              Our AI is crafting personalized stock recommendations for you...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Results View
  if (step === 'results' && recommendations) {
    const { recommendations: stocks, portfolioAnalysis, marketInsights } = recommendations;

    // Prepare chart data
    const allocationData = stocks.map(stock => ({
      name: stock.symbol.replace('.BSE', ''),
      value: stock.allocation
    }));

    const riskDistribution = stocks.reduce((acc, stock) => {
      const risk = stock.riskLevel;
      acc[risk] = (acc[risk] || 0) + stock.allocation;
      return acc;
    }, {});

    const riskData = Object.entries(riskDistribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    const sectorDistribution = stocks.reduce((acc, stock) => {
      const sector = stock.sector;
      acc[sector] = (acc[sector] || 0) + stock.allocation;
      return acc;
    }, {});

    const sectorData = Object.entries(sectorDistribution).map(([name, value]) => ({
      name,
      value
    }));

    return (
      <div className="h-full w-full p-4 lg:p-8 max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Disclaimer */}
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Investment Disclaimer</p>
                  <p>
                    These recommendations are AI-generated based on your profile and current market data. 
                    Past performance does not guarantee future results. Please conduct your own research 
                    and consult with a financial advisor before making investment decisions. Invest only 
                    what you can afford to lose.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <TrendingUp className="w-8 h-8 text-primary-foreground" />
                </div>
                Your Stock Recommendations
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered personalized stock picks based on your profile
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>

          {/* Stock Lookup Section */}
          <Card className="border-2 border-primary/20 shadow-md">
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Search className="w-5 h-5 text-primary" />
                 Stock Lookup
               </CardTitle>
               <CardDescription>Search for any stock to get instant market data</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="flex gap-2 max-w-xl">
                 <Input 
                   placeholder="Enter symbol or company name (e.g. RELIANCE)" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearchStock()}
                 />
                 <Button onClick={handleSearchStock} disabled={searching}>
                   {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                 </Button>
               </div>

               {searchResult && (
                 <div className="mt-6 p-4 rounded-xl bg-muted/40 border animate-in fade-in slide-in-from-top-4">
                   <div className="flex items-start justify-between">
                     <div>
                       <h4 className="font-bold text-lg">{searchResult.match.name}</h4>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="font-semibold bg-background px-1.5 py-0.5 rounded border">{searchResult.match.symbol}</span>
                          <span>•</span>
                          <span>{searchResult.match.region}</span>
                          <span>•</span>
                          <span>{searchResult.match.currency}</span>
                       </div>
                     </div>
                     <div className="text-right">
                        <div className="text-2xl font-bold"><Money>₹{searchResult.marketData.price.toLocaleString()}</Money></div>
                        <div className={`text-sm font-medium flex items-center justify-end gap-1 ${searchResult.marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {searchResult.marketData.change >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3" />}
                           {searchResult.marketData.change.toFixed(2)} ({searchResult.marketData.changePercent.toFixed(2)}%)
                        </div>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Volume</div>
                        <div className="font-medium">{searchResult.marketData.volume.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Day High</div>
                        <div className="font-medium"><Money>₹{searchResult.marketData.high.toLocaleString()}</Money></div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Day Low</div>
                        <div className="font-medium"><Money>₹{searchResult.marketData.low.toLocaleString()}</Money></div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Prev. Close</div>
                        <div className="font-medium"><Money>₹{(searchResult.marketData.price - searchResult.marketData.change).toFixed(2)}</Money></div>
                      </div>
                   </div>
                 </div>
               )}
             </CardContent>
          </Card>

          {/* Recommended Stocks (Moved to Top as requested) */}
          <Card className="border-2 border-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-primary" />
                 Recommended Stocks for You
              </CardTitle>
              <CardDescription>
                Top picks based on your profile and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {stocks.map((stock, index) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border hover:border-primary/50 transition-all">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          {/* Stock Info */}
                          <div className="lg:col-span-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{stock.name}</h3>
                                <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                              </div>
                              <Badge
                                variant={
                                  stock.recommendedAction === 'buy'
                                    ? 'default'
                                    : stock.recommendedAction === 'hold'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="uppercase"
                              >
                                {stock.recommendedAction}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{stock.sector}</Badge>
                              <Badge
                                variant="outline"
                                className={
                                  stock.riskLevel === 'low'
                                    ? 'border-green-500 text-green-700 dark:text-green-400'
                                    : stock.riskLevel === 'medium'
                                    ? 'border-blue-500 text-blue-700 dark:text-blue-400'
                                    : 'border-orange-500 text-orange-700 dark:text-orange-400'
                                }
                              >
                                {stock.riskLevel} risk
                              </Badge>
                            </div>
                          </div>

                          {/* Price Info */}
                          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Current Price</p>
                              <p className="text-xl font-bold"><Money>₹{stock.currentPrice.toFixed(2)}</Money></p>
                              <p
                                className={`text-xs flex items-center gap-1 ${
                                  stock.marketData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {stock.marketData.changePercent >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {stock.marketData.changePercent.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Target Price</p>
                              <p className="text-xl font-bold text-green-600"><Money>₹{stock.targetPrice.toFixed(2)}</Money></p>
                              <p className="text-xs text-muted-foreground">
                                Upside: {(((stock.targetPrice - stock.currentPrice) / stock.currentPrice) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* Allocation & Timeline */}
                          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Allocation</p>
                              <p className="text-2xl font-bold">{stock.allocation}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Time Horizon</p>
                              <p className="text-sm font-semibold">{stock.timeHorizon}</p>
                            </div>
                          </div>

                          {/* Rationale */}
                          <div className="lg:col-span-3">
                            <p className="text-xs text-muted-foreground mb-1">Investment Rationale</p>
                            <p className="text-sm leading-relaxed">{stock.rationale}</p>
                          </div>
                        </div>

                        {/* Stop Loss */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-muted-foreground">Stop Loss:</span>
                            <span className="font-semibold"><Money>₹{stock.stopLoss.toFixed(2)}</Money></span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Volume: {(stock.marketData.volume / 1000000).toFixed(2)}M
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Insights Banner */}
          <Card className="border-2 border-primary/20 bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary rounded-xl">
                  <Activity className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Market Insights</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {marketInsights.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {marketInsights.trends.map((trend, i) => (
                      <Badge key={i} variant="secondary">
                        {trend}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Diversification</p>
                    <p className="text-2xl font-bold">{portfolioAnalysis.diversificationScore}/100</p>
                  </div>
                  <PieChart className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold">{portfolioAnalysis.riskScore}/10</p>
                  </div>
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Return</p>
                    <p className="text-2xl font-bold text-green-600">{portfolioAnalysis.expectedReturn}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stocks</p>
                    <p className="text-2xl font-bold">{stocks.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{portfolioAnalysis.summary}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {portfolioAnalysis.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    Considerations
                  </h4>
                  <ul className="space-y-1">
                    {portfolioAnalysis.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Portfolio Allocation - Wide Card */}
            <Card className="md:col-span-2 border-primary/10 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Portfolio Allocation
                </CardTitle>
                <CardDescription>Recommended distribution across selected stocks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          fontWeight: 'bold',
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--popover-foreground))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Risk Distribution
                </CardTitle>
                <CardDescription>Risk level breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                      />
                      <YAxis 
                        hide 
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          fontWeight: 'bold',
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--popover-foreground))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]}
                      >
                        {riskData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sector Distribution */}
            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Sector Split
                </CardTitle>
                <CardDescription>Diversification by industry</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          fontWeight: 'bold',
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--popover-foreground))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px'}} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Market Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketInsights.opportunities.map((opportunity, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{opportunity}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>




        </motion.div>
      </div>
    );
  }

  return null;
}
