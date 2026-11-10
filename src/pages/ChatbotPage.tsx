import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Mic, MicOff, Globe, Loader2 } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { getAIResponseStream, type ChatMessage } from "@/services/geminiService";

const LANGUAGES = ["English", "हिंदी", "ಕನ್ನಡ", "मराठी"];

const LANG_CODES: Record<number, string> = {
  0: "en-IN",
  1: "hi-IN",
  2: "kn-IN",
  3: "mr-IN",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

const QUICK_QUESTIONS = [
  { label: "🌾 Best crop for this season?", text: "What is the best crop to grow this season based on current weather?" },
  { label: "🌍 Soil health tips", text: "How can I improve my soil health for better crop yield?" },
  { label: "🐛 Pest control advice", text: "What are the best organic methods for pest control?" },
  { label: "🏛️ Government schemes", text: "What government schemes are available for farmers in India?" },
  { label: "💧 Irrigation guide", text: "How to save water with smart irrigation methods?" },
  { label: "📈 When to sell crops?", text: "When is the best time to sell my crops for maximum profit?" },
];

const HINDI_QUESTIONS = [
  { label: "🌾 कौन सी फसल उगाएं?", text: "इस मौसम में कौन सी फसल उगानी चाहिए?" },
  { label: "🌍 मिट्टी सुधार कैसे करें?", text: "मिट्टी को कैसे स्वस्थ बनाएं? उर्वरक और जैविक तरीके बताएं।" },
  { label: "🏛️ सरकारी योजनाएं", text: "किसानों के लिए कौन-कौन सी सरकारी योजनाएं उपलब्ध हैं?" },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "🌱 **Namaste! I'm KrishiBot** — your AI farming assistant.\n\nI can help you with crop advice, soil health, pest control, weather, market prices, and government schemes — **in any language!**\n\nTry asking me anything about farming! 🌾",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedLang, setSelectedLang] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);
  const sendMessageRef = useRef<(text?: string) => void>(null);
  const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: "user", text: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setStreamingText("");

    try {
      const fullResponse = await getAIResponseStream(
        msg,
        messages,
        (chunk) => setStreamingText(chunk)
      );

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: fullResponse, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Connection error. Please try again.", timestamp: Date.now() },
      ]);
    }

    setIsTyping(false);
    setStreamingText("");
    inputRef.current?.focus();
  }, [input, isTyping, messages]);

  // Keep sendMessageRef in sync
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Your browser does not support voice recognition. Please use Google Chrome.");
      return;
    }

    // Stop any existing session
    stopListening();

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = LANG_CODES[selectedLang] || "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
        // Auto-send after a short delay so the user can see what was recognized
        setTimeout(() => {
          sendMessageRef.current?.(transcript);
        }, 400);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone access in your browser settings.");
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [selectedLang, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering
  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet
      if (rendered.startsWith("• ") || rendered.startsWith("- ")) {
        return <p key={i} className="ml-3" dangerouslySetInnerHTML={{ __html: rendered }} />;
      }
      if (rendered.trim() === "") return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const quickQuestions = selectedLang === 1 ? HINDI_QUESTIONS : QUICK_QUESTIONS;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container py-6 flex flex-col max-w-4xl page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl hero-gradient flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading flex items-center gap-2">
                KrishiBot
              </h1>
              <p className="text-xs text-muted-foreground">Multilingual AI farming assistant</p>
            </div>
          </div>
          {/* Language selector */}
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {LANGUAGES.map((lang, i) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(i)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${selectedLang === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Quick questions */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-thin">
          {quickQuestions.map((q) => (
            <button
              key={q.label}
              onClick={() => sendMessage(q.text)}
              disabled={isTyping}
              className="shrink-0 text-xs px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full border border-border/50 transition-colors disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <Card className="flex-1 card-shadow flex flex-col min-h-[400px] max-h-[600px]">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <div className="h-8 w-8 rounded-full hero-gradient flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                      }`}
                  >
                    {msg.role === "bot" ? renderText(msg.text) : msg.text}
                    <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground/50"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming response */}
            {isTyping && streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="h-8 w-8 rounded-full hero-gradient flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm bg-muted leading-relaxed">
                  {renderText(streamingText)}
                  <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle rounded-sm" />
                </div>
              </motion.div>
            )}

            {/* Typing indicator (before streaming starts) */}
            {isTyping && !streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="h-8 w-8 rounded-full hero-gradient flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-muted flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">KrishiBot is thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </CardContent>

          {/* Input bar */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={`shrink-0 rounded-full h-10 w-10 transition-all ${isListening ? "animate-pulse ring-2 ring-red-400/50" : ""
                  }`}
                onClick={isListening ? stopListening : startListening}
                disabled={isTyping}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Input
                ref={inputRef}
                placeholder={
                  selectedLang === 1
                    ? "यहाँ अपना सवाल लिखें..."
                    : "Ask anything about farming..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="rounded-full"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="shrink-0 rounded-full h-10 w-10"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!hasGeminiKey && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                ⚡ Enhanced mode active. For full AI: add <code className="bg-muted px-1 rounded">VITE_GEMINI_API_KEY</code> to your <code className="bg-muted px-1 rounded">.env</code> file
              </p>
            )}
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
