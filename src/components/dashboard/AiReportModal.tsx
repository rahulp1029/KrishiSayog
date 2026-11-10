import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    Sparkles, Printer, FileText, CheckCircle2, RefreshCw, Layers, 
    Droplets, Thermometer, Leaf, MessageSquare, Send, Mic, MicOff, 
    Globe, Bot, User, Loader2, CloudRain 
} from "lucide-react";
import { SensorReading } from "@/services/iotConfig";
import { WeatherData } from "@/types/weather";
import { generateAIReport, answerReportQuestionStream, SUPPORTED_LANGUAGES, FarmAIReport } from "@/services/aiReportService";

interface AiReportModalProps {
    sensorData?: Partial<SensorReading>;
    weatherData?: WeatherData | null;
}

type ChatMessage = {
    role: "user" | "bot";
    text: string;
    timestamp: number;
};

// Weather-aware Quick Questions per Language
const QUICK_QUESTIONS_BY_LANG: Record<string, { label: string; text: string }[]> = {
    English: [
        { label: "🌧️ Will it rain tomorrow?", text: "Will it rain tomorrow? Please tell me the exact rain probability." },
        { label: "📅 Will it rain this week?", text: "Will it rain this week? Show me the 7-day forecast." },
        { label: "🌾 Should I irrigate today?", text: "Based on my soil moisture and rain forecast, should I irrigate today?" },
        { label: "🌡️ Tomorrow's temp?", text: "What will the maximum and minimum temperature be tomorrow?" },
        { label: "🧪 Soil pH & Fertilizer", text: "Is my soil pH good and should I add Urea or DAP right now?" }
    ],
    Hindi: [
        { label: "🌧️ कल बारिश होगी क्या?", text: "क्या कल बारिश होगी? मुझे सटिक बारिश की संभावना (%) बताएं।" },
        { label: "📅 इस हफ्ते बारिश होगी?", text: "क्या इस हफ़्ते बारिश होगी? 7 दिनों का मौसम बताओ।" },
        { label: "🌾 क्या आज सिंचाई करूँ?", text: "मेरी मिट्टी की नमी और बारिश के पूर्वानुमान के आधार पर क्या आज सिंचाई करनी चाहिए?" },
        { label: "🌡️ कल का तापमान?", text: "कल अधिकतम और न्यूनतम तापमान कितना रहेगा?" }
    ],
    Marathi: [
        { label: "🌧️ उद्या पाऊस पडेल का?", text: "उद्या पाऊस पडण्याची शक्यता किती टक्के आहे?" },
        { label: "📅 या आठवड्यात पाऊस?", text: "या आठवड्यात पाऊस पडेल का? हवामानाचा अंदाज सांगा." },
        { label: "🌾 आज पाणी द्यावे का?", text: "मातीच्या ओलाव्यानुसार मी आज पाणी दिले पाहिजे का?" }
    ],
    Kannada: [
        { label: "🌧️ ನಾಳೆ ಮಳೆ ಬರುತ್ತದೆಯೇ?", text: "ನಾಳೆ ಮಳೆ ಬೀಳುವ ಸಾಧ್ಯತೆ ಎಷ್ಟು ಪ್ರತಿಶತ?" },
        { label: "📅 ಈ ವಾರ ಮಳೆ ಇದೆಯೇ?", text: "ಈ ವಾರ ಮಳೆ ಬೀಳುತ್ತದೆಯೇ? 7 ದಿನಗಳ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ತಿಳಿಸಿ." }
    ]
};

export function AiReportModal({ sensorData, weatherData }: AiReportModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<FarmAIReport | null>(null);
    const [selectedLang, setSelectedLang] = useState<string>("English");
    const [activeTab, setActiveTab] = useState<"report" | "chat">("report");

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [isListening, setIsListening] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (activeTab === "chat" && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [chatMessages, streamingText, activeTab]);

    const handleGenerate = async (langToUse: string = selectedLang) => {
        setLoading(true);
        try {
            const data = await generateAIReport(sensorData || {}, langToUse, weatherData);
            setReport(data);
            
            const tomProb = weatherData?.daily?.precipitationProbabilityMax?.[1] ?? 0;
            const initialGreeting = langToUse === "Hindi"
                ? `🌱 **नमस्ते! मैं आपका मौसम और मृदा AI सहायक हूँ।**\n\nआपकी रिपोर्ट तैयार है! कल बारिश की संभावना **${tomProb}%** है। मौसम, सिंचाई या खादों के बारे में कोई भी सवाल पूछें!`
                : langToUse === "Marathi"
                ? `🌱 **नमस्कार! मी तुमचा हवामान व माती रिपोर्ट AI सहाय्यक आहे.**\n\nउद्या पाऊस पडण्याची शक्यता **${tomProb}%** आहे. कोणताही प्रश्न विचारा!`
                : `🌱 **Namaste! I am your Weather-Aware AI Agronomist for this report.**\n\nLive Open-Meteo weather data shows a **${tomProb}%** rain chance tomorrow. Ask me anything about rain forecasts, irrigation, or fertilizer advice!`;

            setChatMessages([
                { role: "bot", text: initialGreeting, timestamp: Date.now() }
            ]);
        } catch (err) {
            console.error("Report Generation Failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLang: string) => {
        setSelectedLang(newLang);
        if (report) {
            handleGenerate(newLang);
        }
    };

    const handlePrintPDF = () => {
        window.print();
    };

    const startVoiceListening = () => {
        const w = window as any;
        const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {
            alert("Your browser does not support voice recognition. Please use Google Chrome.");
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const langConfig = SUPPORTED_LANGUAGES.find(l => l.value === selectedLang);
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = langConfig?.code || "en-IN";
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
                setChatInput(transcript);
                setTimeout(() => {
                    handleSendMessage(transcript);
                }, 400);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
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
    };

    const stopVoiceListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
        setIsListening(false);
    };

    const handleSendMessage = async (textToSend?: string) => {
        const query = textToSend || chatInput;
        if (!query.trim() || isBotThinking || !report) return;

        const userMsg: ChatMessage = { role: "user", text: query, timestamp: Date.now() };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput("");
        setIsBotThinking(true);
        setStreamingText("");

        try {
            const botAnswer = await answerReportQuestionStream(
                query,
                report,
                sensorData || {},
                selectedLang,
                chatMessages,
                (chunk) => setStreamingText(chunk),
                weatherData
            );

            setChatMessages(prev => [
                ...prev,
                { role: "bot", text: botAnswer, timestamp: Date.now() }
            ]);
        } catch {
            setChatMessages(prev => [
                ...prev,
                { role: "bot", text: "⚠️ Connection error. Please ask again.", timestamp: Date.now() }
            ]);
        } finally {
            setIsBotThinking(false);
            setStreamingText("");
        }
    };

    const renderMarkdownText = (text: string) => {
        return text.split("\n").map((line, idx) => {
            const rendered = line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/FACT \(Open-Meteo\)/g, "<span class='bg-blue-100 text-blue-900 px-1 rounded font-bold'>FACT (Open-Meteo)</span>")
                .replace(/RECOMMENDATION/g, "<span class='bg-emerald-100 text-emerald-900 px-1 rounded font-bold'>RECOMMENDATION</span>");
            if (rendered.startsWith("• ") || rendered.startsWith("- ")) {
                return <p key={idx} className="ml-3" dangerouslySetInnerHTML={{ __html: rendered }} />;
            }
            if (rendered.trim() === "") return <br key={idx} />;
            return <p key={idx} dangerouslySetInnerHTML={{ __html: rendered }} />;
        });
    };

    const quickQuestions = QUICK_QUESTIONS_BY_LANG[selectedLang] || QUICK_QUESTIONS_BY_LANG.English;
    const tomRainProb = weatherData?.daily?.precipitationProbabilityMax?.[1] ?? 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    onClick={() => { if (!report) handleGenerate(selectedLang); }}
                    className="hero-gradient text-white shadow-lg hover:shadow-xl transition-all gap-2"
                >
                    <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                    AI Soil & Weather Report
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 print:p-0 print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0">
                {/* Header Control Bar */}
                <DialogHeader className="print:hidden pb-2 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold font-heading text-emerald-950">
                            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
                            KrishiSayog AI Soil & Weather Advisory
                        </DialogTitle>

                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                <Globe className="h-4 w-4 text-emerald-700" />
                                <select 
                                    value={selectedLang} 
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
                                >
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <option key={lang.value} value={lang.value}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {report && (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => handleGenerate(selectedLang)} disabled={loading} className="gap-1 text-xs">
                                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                                        Regenerate
                                    </Button>
                                    <Button size="sm" onClick={handlePrintPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                                        <Printer className="h-3.5 w-3.5" />
                                        Print PDF
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    {report && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setActiveTab("report")}
                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    activeTab === "report" 
                                        ? "bg-emerald-700 text-white shadow-sm" 
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                📄 Official Report ({selectedLang})
                            </button>
                            <button
                                onClick={() => setActiveTab("chat")}
                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all relative ${
                                    activeTab === "chat" 
                                        ? "bg-emerald-700 text-white shadow-sm" 
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                            >
                                <MessageSquare className="h-3.5 w-3.5 text-yellow-300" />
                                💬 Ask AI Agronomist & Weather Q&A
                                <span className="absolute -top-1 -right-1 bg-yellow-400 text-emerald-950 font-black text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                                    LIVE
                                </span>
                            </button>
                        </div>
                    )}
                </DialogHeader>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pt-3">
                    {loading ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="relative inline-flex">
                                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                <Sparkles className="h-6 w-6 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <h3 className="text-lg font-bold text-emerald-900">
                                Evaluating Open-Meteo weather & sensor telemetry in {selectedLang}...
                            </h3>
                        </div>
                    ) : report && activeTab === "report" ? (
                        /* TAB 1: Printable Multilingual Soil & Weather Report */
                        <div className="space-y-5 print:space-y-4 font-sans text-slate-800 print:text-xs">
                            {/* Header Banner */}
                            <div className="border-2 border-emerald-600 rounded-xl p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 print:bg-white print:border-emerald-700 print:p-4 break-inside-avoid">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-200 pb-3 mb-3 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md print:w-10 print:h-10 print:text-xl">
                                            🌾
                                        </div>
                                        <div>
                                            <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-950 tracking-tight print:text-lg">
                                                KRISHISAYOG SMART AGRICULTURE
                                            </h1>
                                            <p className="text-xs font-bold text-emerald-700">
                                                Official AI Soil Health & Weather Advisory Card ({selectedLang})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
                                        <p><strong>Report Date:</strong> {report.generatedAt}</p>
                                        <p><strong>Weather Source:</strong> Open-Meteo API</p>
                                        <p><strong>Location:</strong> {weatherData?.locationName || weatherData?.location || "Nashik, Maharashtra"}</p>
                                    </div>
                                </div>

                                {/* Live Summary Badge Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                        <span className="text-[11px] text-slate-500 block font-medium">Health Index</span>
                                        <span className="text-xl font-bold text-emerald-700">{report.soilHealthScore}/100</span>
                                    </div>
                                    <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                        <span className="text-[11px] text-slate-500 block font-medium">Soil Moisture</span>
                                        <span className="text-base font-bold text-blue-700">{sensorData?.moisture ?? 58}%</span>
                                    </div>
                                    <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                        <span className="text-[11px] text-slate-500 block font-medium">Tomorrow's Rain</span>
                                        <span className="text-base font-bold text-indigo-700">{tomRainProb}% Prob</span>
                                    </div>
                                    <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                        <span className="text-[11px] text-slate-500 block font-medium">Soil pH</span>
                                        <span className="text-base font-bold text-purple-700">{sensorData?.soilPH ?? 6.57}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Full Agronomic Advisory & Action Plan */}
                            <div className="space-y-4 print:space-y-3 text-xs sm:text-sm">
                                <Card className="border-emerald-200 bg-emerald-50/40 print:bg-white print:border-slate-300 break-inside-avoid">
                                    <CardContent className="pt-4 text-xs sm:text-sm space-y-2">
                                        <h3 className="font-bold text-emerald-950 flex items-center gap-2 text-sm sm:text-base border-b border-emerald-200 pb-1.5">
                                            <Sparkles className="h-4 w-4 text-emerald-600" />
                                            Executive Agronomic & Weather Summary ({selectedLang})
                                        </h3>
                                        <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                                            {report.summary}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300 space-y-3 break-inside-avoid">
                                    <h3 className="font-bold text-emerald-950 text-sm sm:text-base border-b border-slate-200 pb-1.5 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        Detailed Agronomic & Irrigation Advisory ({selectedLang})
                                    </h3>
                                    <div className="text-slate-800 leading-relaxed text-xs sm:text-sm space-y-3">
                                        {report.fullMarkdown
                                            .split("\n\n")
                                            .map((paragraph, pIdx) => {
                                                const trimmed = paragraph.trim();
                                                if (!trimmed) return null;

                                                if (trimmed.startsWith("###")) {
                                                    return (
                                                        <h4 key={pIdx} className="font-bold text-emerald-900 text-sm pt-2 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                                            🌿 {trimmed.replace(/###\s*\d*\.?\s*/g, "")}
                                                        </h4>
                                                    );
                                                }

                                                return (
                                                    <p key={pIdx} className="leading-relaxed">
                                                        {trimmed.replace(/\*\*/g, "").replace(/\*/g, "")}
                                                    </p>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : report && activeTab === "chat" ? (
                        /* TAB 2: Interactive Voice & Text Q&A Chatbot with Weather Facts */
                        <div className="flex flex-col h-[520px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <div className="bg-emerald-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-yellow-300" />
                                    <span className="font-bold">AI Weather & Agronomist Assistant</span>
                                    <span className="bg-emerald-800 px-2 py-0.5 rounded text-[10px] text-emerald-200">
                                        Lang: {selectedLang}
                                    </span>
                                </div>
                                <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                                    <CloudRain className="h-3 w-3" /> Open-Meteo Live Facts Active
                                </span>
                            </div>

                            {/* Quick Suggestion Chips */}
                            <div className="p-2.5 bg-white border-b flex gap-1.5 overflow-x-auto scrollbar-thin">
                                {quickQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendMessage(q.text)}
                                        disabled={isBotThinking}
                                        className="shrink-0 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-full border border-emerald-200 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Log */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                                {chatMessages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {msg.role === "bot" && (
                                            <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                                <Bot className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                                                msg.role === "user"
                                                    ? "bg-emerald-600 text-white rounded-br-none shadow"
                                                    : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm"
                                            }`}
                                        >
                                            {msg.role === "bot" ? renderMarkdownText(msg.text) : msg.text}
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                                                <User className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isBotThinking && streamingText && (
                                    <div className="flex gap-2.5 justify-start">
                                        <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="max-w-[85%] rounded-2xl rounded-bl-none px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 shadow-sm leading-relaxed">
                                            {renderMarkdownText(streamingText)}
                                            <span className="inline-block w-1.5 h-3.5 bg-emerald-600 animate-pulse ml-1 align-middle rounded-sm" />
                                        </div>
                                    </div>
                                )}

                                {isBotThinking && !streamingText && (
                                    <div className="flex gap-2.5 justify-start">
                                        <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="rounded-2xl rounded-bl-none px-4 py-2.5 bg-white border border-slate-200 shadow-sm flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                                            <span className="text-xs text-slate-500">Checking Open-Meteo weather facts in {selectedLang}...</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Input bar */}
                            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={isListening ? "destructive" : "outline"}
                                    size="icon"
                                    onClick={isListening ? stopVoiceListening : startVoiceListening}
                                    className={`shrink-0 rounded-full h-9 w-9 ${isListening ? "animate-pulse ring-2 ring-red-400" : ""}`}
                                    title={isListening ? "Stop voice listening" : `Speak in ${selectedLang}`}
                                >
                                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-emerald-700" />}
                                </Button>
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                                    placeholder={
                                        selectedLang === "Hindi" ? "पूछें: कल बारिश होगी क्या? या सिंचाई कब करें?" :
                                        selectedLang === "Marathi" ? "विचारा: उद्या पाऊस पडेल का?" :
                                        "Ask: Will it rain tomorrow? Or should I irrigate?"
                                    }
                                    disabled={isBotThinking}
                                    className="rounded-full text-xs sm:text-sm h-9"
                                />
                                <Button
                                    onClick={() => handleSendMessage()}
                                    disabled={!chatInput.trim() || isBotThinking}
                                    className="shrink-0 rounded-full h-9 w-9 bg-emerald-700 hover:bg-emerald-800 text-white"
                                    size="icon"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center space-y-4">
                            <FileText className="h-12 w-12 text-emerald-600 mx-auto" />
                            <h3 className="text-lg font-semibold">Generate AI Soil & Weather Report</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Select your language and click below to evaluate Open-Meteo weather data and IoT telemetry.
                            </p>
                            <Button onClick={() => handleGenerate(selectedLang)} className="hero-gradient text-white gap-2">
                                <Sparkles className="h-4 w-4" />
                                Generate Report ({selectedLang})
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
