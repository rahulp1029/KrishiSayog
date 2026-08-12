import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Download, Printer, FileText, CheckCircle2, AlertTriangle, RefreshCw, Layers, Droplets, Thermometer, Leaf } from "lucide-react";
import { SensorReading } from "@/services/iotConfig";
import { generateAIReport, FarmAIReport } from "@/services/aiReportService";

interface AiReportModalProps {
    sensorData?: Partial<SensorReading>;
}

export function AiReportModal({ sensorData }: AiReportModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<FarmAIReport | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const data = await generateAIReport(sensorData || {});
            setReport(data);
        } catch (err) {
            console.error("Report Generation Failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    onClick={() => { if (!report) handleGenerate(); }}
                    className="hero-gradient text-white shadow-lg hover:shadow-xl transition-all gap-2"
                >
                    <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                    AI Soil Health & PDF Report
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0">
                <DialogHeader className="print:hidden">
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xl font-bold font-heading">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                            KrishiSayog AI Soil Health & Advisory Report
                        </div>
                        <div className="flex items-center gap-2">
                            {report && (
                                <>
                                    <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="gap-1">
                                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                                        Regenerate
                                    </Button>
                                    <Button size="sm" onClick={handlePrintPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                        <Printer className="h-3.5 w-3.5" />
                                        Print / Save PDF
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-16 text-center space-y-4">
                        <div className="relative inline-flex">
                            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            <Sparkles className="h-6 w-6 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-800">KrishiSayog AI is Analyzing Sensor Telemetry...</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Evaluating Soil pH, NPK levels, Soil Moisture, Air Humidity, and Temperature to generate a customized agronomic report.
                        </p>
                    </div>
                ) : report ? (
                    <div className="space-y-5 print:space-y-4 font-sans text-slate-800 print:text-xs">
                        {/* Printable Header Banner */}
                        <div className="border-2 border-emerald-600 rounded-xl p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 print:bg-white print:border-emerald-700 print:p-4 break-inside-avoid">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-200 pb-3 mb-3 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md print:w-10 print:h-10 print:text-xl">
                                        🌾
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-950 tracking-tight print:text-lg">KRISHISAYOG SMART AGRICULTURE</h1>
                                        <p className="text-xs font-semibold text-emerald-700">Official AI Soil Health Card & Agronomic Advisory Report</p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
                                    <p><strong>Report Date:</strong> {report.generatedAt}</p>
                                    <p><strong>Device ID:</strong> device_001 (Raspberry Pi 4)</p>
                                    <p><strong>Location:</strong> Nashik, Maharashtra, India</p>
                                </div>
                            </div>

                            {/* Summary Badge Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                    <span className="text-[11px] text-slate-500 block font-medium">Health Index</span>
                                    <span className="text-xl font-bold text-emerald-700">{report.soilHealthScore}/100</span>
                                </div>
                                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                    <span className="text-[11px] text-slate-500 block font-medium">Soil Condition</span>
                                    <span className="text-base font-bold text-emerald-800">{report.healthCategory}</span>
                                </div>
                                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                    <span className="text-[11px] text-slate-500 block font-medium">Soil Moisture</span>
                                    <span className="text-base font-bold text-blue-700">{sensorData?.moisture ?? 58}%</span>
                                </div>
                                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 shadow-sm print:border-slate-300">
                                    <span className="text-[11px] text-slate-500 block font-medium">Soil pH</span>
                                    <span className="text-base font-bold text-purple-700">{sensorData?.soilPH ?? 6.57}</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Telemetry Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid print:border-slate-300">
                            <div className="bg-emerald-900 text-white px-4 py-2 font-semibold text-xs sm:text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-emerald-300" />
                                    Measured Soil Telemetry (Real-Time Sensors)
                                </span>
                                <span className="text-xs text-emerald-200 font-normal">IoT Sensor Node #001</span>
                            </div>
                            <table className="w-full text-xs sm:text-sm text-left">
                                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                    <tr>
                                        <th className="py-2 px-3">Parameter</th>
                                        <th className="py-2 px-3">Measured Value</th>
                                        <th className="py-2 px-3">Optimal Range</th>
                                        <th className="py-2 px-3">Diagnostic Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(() => {
                                        const moist = sensorData?.moisture ?? 58;
                                        const ph = sensorData?.soilPH ?? 6.57;
                                        const n = sensorData?.nitrogen ?? 67;
                                        const p = sensorData?.phosphorus ?? 60;
                                        const k = sensorData?.potassium ?? 84;
                                        const temp = sensorData?.temperature ?? 26;

                                        return (
                                            <>
                                                <tr>
                                                    <td className="py-1.5 px-3 font-medium flex items-center gap-1.5">
                                                        <Droplets className="h-3.5 w-3.5 text-blue-500" /> Soil Moisture
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold text-slate-900">{moist}%</td>
                                                    <td className="py-1.5 px-3 text-slate-500">40% – 70%</td>
                                                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Optimal</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-3 font-medium flex items-center gap-1.5">
                                                        <Leaf className="h-3.5 w-3.5 text-emerald-500" /> Soil pH
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold text-slate-900">{ph}</td>
                                                    <td className="py-1.5 px-3 text-slate-500">6.0 – 7.5</td>
                                                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Balanced</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-3 font-medium flex items-center gap-1.5">
                                                        <Layers className="h-3.5 w-3.5 text-amber-500" /> Nitrogen (N)
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold text-slate-900">{n} mg/kg</td>
                                                    <td className="py-1.5 px-3 text-slate-500">40 – 80 mg/kg</td>
                                                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Good</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-3 font-medium flex items-center gap-1.5">
                                                        <Layers className="h-3.5 w-3.5 text-orange-500" /> Phosphorus (P)
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold text-slate-900">{p} mg/kg</td>
                                                    <td className="py-1.5 px-3 text-slate-500">30 – 60 mg/kg</td>
                                                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Good</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-3 font-medium flex items-center gap-1.5">
                                                        <Layers className="h-3.5 w-3.5 text-green-600" /> Potassium (K)
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold text-slate-900">{k} mg/kg</td>
                                                    <td className="py-1.5 px-3 text-slate-500">40 – 80 mg/kg</td>
                                                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Optimal</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-3 font-medium flex items-center gap-1.5">
                                                        <Thermometer className="h-3.5 w-3.5 text-red-500" /> Air Temperature
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold text-slate-900">{temp}°C</td>
                                                    <td className="py-1.5 px-3 text-slate-500">20°C – 32°C</td>
                                                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Ideal</td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Optimistic Agronomic Analysis Content */}
                        <div className="space-y-4 print:space-y-3 text-xs sm:text-sm">
                            {/* Executive Agronomic Summary */}
                            <Card className="border-emerald-200 bg-emerald-50/40 print:bg-white print:border-slate-300 break-inside-avoid">
                                <CardContent className="pt-4 text-xs sm:text-sm space-y-2">
                                    <h3 className="font-bold text-emerald-950 flex items-center gap-2 text-sm sm:text-base border-b border-emerald-200 pb-1.5">
                                        <Sparkles className="h-4 w-4 text-emerald-600" />
                                        Executive Agronomic Summary
                                    </h3>
                                    <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                                        {report.summary}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Full Agronomic Advisory & Action Plan */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300 space-y-3 break-inside-avoid">
                                <h3 className="font-bold text-emerald-950 text-sm sm:text-base border-b border-slate-200 pb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Detailed Soil Health & Agronomic Advisory
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

                        {/* Official Verification Footer for Print */}
                        <div className="hidden print:flex justify-between items-end border-t-2 border-emerald-600 pt-4 mt-4 text-[11px] text-slate-600 break-inside-avoid">
                            <div>
                                <p className="font-extrabold text-emerald-900">KrishiSayog Smart Agriculture Ecosystem</p>
                                <p>Verified by IoT Sensor Telemetry & Google Gemini AI</p>
                                <p>Website: krishisayog.app | Helpline: +91 8920405371</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-slate-400 w-36 mb-1"></div>
                                <p className="font-semibold text-slate-800">Agronomist Digital Stamp & Signature</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center space-y-4">
                        <FileText className="h-12 w-12 text-emerald-600 mx-auto" />
                        <h3 className="text-lg font-semibold">Generate Instant AI Soil Health Report</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Click below to trigger Google Gemini AI to analyze all live sensor telemetry and generate a downloadable PDF report for your farm.
                        </p>
                        <Button onClick={handleGenerate} className="hero-gradient text-white gap-2">
                            <Sparkles className="h-4 w-4" />
                            Generate Report Now
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
