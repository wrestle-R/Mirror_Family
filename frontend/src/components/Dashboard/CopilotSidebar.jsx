import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const COPILOT_WIDTH_DEFAULT = 380;
const COPILOT_STORAGE_VERSION = 1;

function getCopilotStorageKey(firebaseUid) {
  return `moneycouncil:copilot:v${COPILOT_STORAGE_VERSION}:${firebaseUid}`;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeStoredMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      isError: !!m.isError,
    }));
}

function tryPersistWithEviction(storageKey, nextMessages) {
  let working = [...nextMessages];

  // Keep bounded even if quota is large
  const HARD_CAP = 200;
  if (working.length > HARD_CAP) working = working.slice(working.length - HARD_CAP);

  while (working.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(working));
      return working;
    } catch {
      const dropCount = Math.max(1, Math.floor(working.length * 0.1));
      working = working.slice(dropCount);
    }
  }

  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
  return [];
}

export function CopilotSidebar({ open = true, onOpenChange }) {
  const location = useLocation();
  const { user } = useUser();
  const [selectedMode, setSelectedMode] = useState("budget");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [modePopoverOpen, setModePopoverOpen] = useState(false);
  const [context, setContext] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);

  const storageKey = useMemo(() => {
    if (!user?.uid) return null;
    return getCopilotStorageKey(user.uid);
  }, [user?.uid]);

  const fetchContext = useCallback(async () => {
    try {
      setLoadingContext(true);
      const response = await axios.get(`${API_URL}/api/copilot/context/${user.uid}`);
      setContext(response.data);
    } catch (error) {
      console.error('Error fetching context:', error);
    } finally {
      setLoadingContext(false);
    }
  }, [user?.uid]);

  // Keep selected mode in sync with URL if on agent page
  useEffect(() => {
    if (location.pathname.includes('/agent/')) {
      const type = location.pathname.split('/').pop();
      if (['budget', 'savings', 'debt', 'investment'].includes(type)) {
        setSelectedMode(type);
      }
    }
  }, [location]);

  // Fetch user context on mount
  useEffect(() => {
    if (user?.uid) {
      fetchContext();
    }
  }, [user?.uid, fetchContext]);

  // Load from localStorage when user changes
  useEffect(() => {
    if (!storageKey) return;
    const raw = localStorage.getItem(storageKey);
    const parsed = safeJsonParse(raw, []);
    setMessages(normalizeStoredMessages(parsed));
  }, [storageKey]);

  // Persist on changes (evict old messages if quota exceeded)
  useEffect(() => {
    if (!storageKey) return;
    const serializable = messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      isError: m.isError,
    }));

    const persisted = tryPersistWithEviction(storageKey, serializable);
    if (persisted.length !== serializable.length) {
      setMessages(normalizeStoredMessages(persisted));
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    
    const userMessage = {
      role: 'user', 
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsSending(true);
    
    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await axios.post(`${API_URL}/api/copilot/chat`, {
        firebaseUid: user.uid,
        message: inputMessage,
        mode: selectedMode,
        conversationHistory
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update context with latest stats if provided
      if (response.data.context) {
        setContext(prev => ({
          ...prev,
          profile: {
            ...prev?.profile,
            ...response.data.context
          }
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure your backend is running and try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    setMessages([]);
  }, [storageKey]);

  const setOpen = useCallback((value) => {
    onOpenChange?.(value);
  }, [onOpenChange]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const modes = [
    { id: 'budget', label: 'Budget Agent', icon: Wallet, description: 'Spending reduction & tracking', color: 'text-blue-500' },
    { id: 'savings', label: 'Savings Agent', icon: PiggyBank, description: 'Goal-based plans', color: 'text-green-500' },
    { id: 'debt', label: 'Debt Manager', icon: TrendingDown, description: 'Repayment strategies', color: 'text-red-500' },
    { id: 'investment', label: 'Investment Scout', icon: TrendingUp, description: 'Beginner options', color: 'text-purple-500' },
  ];

  const currentMode = modes.find(m => m.id === selectedMode) || modes[0];

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "hidden xl:flex w-[380px] border-l bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 flex-col fixed right-0 top-0 bottom-0 z-40",
        "transition-transform duration-300 ease-in-out will-change-transform",
        open ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
      style={{ width: `${COPILOT_WIDTH_DEFAULT}px` }}
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center gap-2 font-semibold"> 
          <Sparkles className="w-4 h-4 text-primary fill-primary" />
          <span>Money Copilot</span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearHistory}
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
              title="Close"
            >
              <PanelRightClose className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Mode Display */}
      <div className="p-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <currentMode.icon className={cn("w-4 h-4", currentMode.color)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentMode.label}</p>
            <p className="text-xs text-muted-foreground truncate">{currentMode.description}</p>
          </div>
          <Link to={`/agent/${selectedMode}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Open
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5"/> 
                  Financial Snapshot
                </p>
                {loadingContext ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading your data...
                  </div>
                ) : context ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Income:</span>
                      <span className="font-semibold">₹{context.profile.monthlyIncome?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Savings:</span>
                      <span className="font-semibold text-green-600">₹{context.profile.currentSavings?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Expenses:</span>
                      <span className="font-semibold text-red-600">₹{context.thisMonth?.expenses?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    {context.thisMonth && (
                      <>
                        <div className="border-t border-border/50 pt-1 mt-1">
                          <p className="text-muted-foreground font-medium mb-0.5">This Month:</p>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Transactions:</span>
                            <span>{context.thisMonth.transactions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Net:</span>
                            <span className={cn(
                              "font-semibold",
                              (context.thisMonth.income - context.thisMonth.expenses) >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              ₹{((context.thisMonth.income - context.thisMonth.expenses) || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {context.profile.totalDebt > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Debt:</span>
                        <span className="font-semibold text-orange-600">₹{context.profile.totalDebt?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">Unable to load data</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Quick Questions</h4>
                <div className="space-y-1">
                  {selectedMode === 'budget' && (
                      <>
                          <button 
                            onClick={() => handleQuickQuestion("Where can I cut my spending?")} 
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            💡 Where can I cut spending?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("Show my expense trends this month")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            📊 Show my expense trends
                          </button>
                      </>
                  )}
                  {selectedMode === 'savings' && (
                      <>
                          <button 
                            onClick={() => handleQuickQuestion("How can I reach my savings goal faster?")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            🎯 How to reach my savings goal?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("What are the best savings strategies for students?")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            💰 Best savings strategies?
                          </button>
                      </>
                  )}
                  {selectedMode === 'debt' && (
                      <>
                          <button 
                            onClick={() => handleQuickQuestion("Create a debt repayment plan for me")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            📅 Create repayment plan
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("What's the fastest way to pay off my debt?")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            ⚡ Fastest payoff method?
                          </button>
                      </>
                  )}
                  {selectedMode === 'investment' && (
                      <>
                          <button 
                            onClick={() => handleQuickQuestion("What are the best stocks for beginners in India?")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            📈 Best stocks for beginners?
                          </button>
                          <button 
                            onClick={() => handleQuickQuestion("What's my investment risk level?")}
                            className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            🎲 What's my risk level?
                          </button>
                      </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground ml-4" 
                      : msg.isError
                      ? "bg-destructive/10 text-destructive mr-4"
                      : "bg-muted mr-4"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {isSending && (
                <div className="bg-muted rounded-lg p-3 text-sm mr-4 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t shrink-0">
        <div className="p-3 space-y-2">
          <div className="flex gap-2 items-end">
            {/* Mode Selector Popover */}
            <Popover open={modePopoverOpen} onOpenChange={setModePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="shrink-0 h-9 w-9"
                >
                  <currentMode.icon className={cn("w-4 h-4", currentMode.color)} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start" side="top">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Select Agent Mode</p>
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setSelectedMode(mode.id);
                        setModePopoverOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded text-sm transition-colors",
                        selectedMode === mode.id 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted"
                      )}
                    >
                      <mode.icon className={cn("w-4 h-4", mode.color)} />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-xs">{mode.label}</p>
                        <p className="text-[10px] text-muted-foreground">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Message Input */}
            <Textarea
              placeholder={`Ask ${currentMode.label}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-[36px] max-h-[120px] resize-none"
              rows={1}
              disabled={isSending}
            />
            
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="shrink-0 h-9 w-9"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground">
            • Powered by Groq Llama 3.1
          </p>
        </div>
      </div>
    </div>
  );
}
