import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Leaf, AlertTriangle, CheckCircle, History, Shield, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeLeafImage, DiseaseResult } from "@/services/geminiVisionService";
import { toast } from "sonner";

const pastDetections = [
  { disease: "Tomato Early Blight", crop: "Tomato", date: "Today", confidence: 94 },
  { disease: "Powdery Mildew", crop: "Wheat", date: "2 days ago", confidence: 91 },
  { disease: "Healthy Foliage", crop: "Rice", date: "5 days ago", confidence: 98 },
];

export default function DiseaseDetection() {
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const processFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setUploadedFile(file);
    setAnalyzing(true);
    setResult(null);

    try {
      const analysis = await analyzeLeafImage(file);
      setResult(analysis);
      toast.success(`Analysis complete: ${analysis.disease} identified!`);
    } catch (error: any) {
      console.error("Disease detection failed:", error);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12 max-w-5xl page-enter">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl hero-gradient flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">AI Plant Disease Detection</h1>
            <p className="text-muted-foreground text-sm">Upload a crop leaf photo to instantly identify plant pathogens, leaf blights, and curative remedies.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Upload area */}
          <Card className="card-shadow lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Upload Leaf Image</span>
                {uploadedFile && (
                  <span className="text-[11px] text-muted-foreground font-normal truncate max-w-[120px]">
                    {uploadedFile.name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300">
                {preview ? (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={preview}
                    alt="Uploaded leaf"
                    className="w-full h-52 object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">Click to upload photo</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG up to 10MB</p>
                    <div className="flex gap-4 mt-6 opacity-40">
                      <span className="text-3xl">🍃</span>
                      <span className="text-3xl">🌿</span>
                      <span className="text-3xl">🌾</span>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>

              {preview && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="default" 
                    className="flex-1 text-xs hero-gradient"
                    onClick={() => { if (uploadedFile) processFile(uploadedFile); }}
                    disabled={analyzing}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${analyzing ? 'animate-spin' : ''}`} />
                    {analyzing ? "Analyzing..." : "Re-Analyze"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-xs" 
                    onClick={() => { setPreview(null); setResult(null); setUploadedFile(null); }}
                  >
                    Change
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result card */}
          <Card className={`card-shadow lg:col-span-2 transition-all duration-300 ${result ? (result.severity === "High" ? "border-l-4 border-l-destructive" : "border-l-4 border-l-emerald-600") : ""}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> AI Diagnostic Result
                </span>
                {result && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    result.severity === "High" ? "bg-red-100 text-red-800" :
                    result.severity === "Moderate" ? "bg-amber-100 text-amber-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>
                    {result.severity} Risk
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {/* State 1: Nothing uploaded */}
                {!preview && !analyzing && !result && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-center py-12 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
                        🔬
                      </div>
                      <h3 className="font-semibold text-foreground">No leaf photo uploaded yet</h3>
                      <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                        Upload a clear close-up picture of your infected or healthy crop leaf. KrishiSayog AI will diagnose the pathogen, severity, and recommend curative sprays.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* State 2: Analyzing */}
                {analyzing && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative">
                        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <Sparkles className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <p className="font-semibold text-foreground">Analyzing leaf pathology...</p>
                      <p className="text-xs text-muted-foreground">Evaluating chlorophyll discoloration, lesion spots, and fungal patterns</p>
                    </div>
                  </motion.div>
                )}

                {/* State 3: Analysis Result */}
                {result && !analyzing && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Disease Header */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                            Diagnosed Condition ({result.crop || "Crop"})
                          </span>
                          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            {result.severity === "High" ? (
                              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                            )}
                            {result.disease}
                          </h2>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">Confidence</span>
                          <span className="text-xl font-black text-primary">{result.confidence}%</span>
                        </div>
                      </div>

                      {/* Confidence bar */}
                      <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full hero-gradient rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Symptoms & Causes */}
                    {result.symptoms && result.symptoms.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-lg bg-red-50/50 border border-red-200/60">
                          <span className="text-xs font-bold text-red-900 block mb-1.5 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-red-600" /> Visible Symptoms
                          </span>
                          <ul className="text-xs text-slate-700 space-y-1">
                            {result.symptoms.map((s, idx) => (
                              <li key={idx} className="flex gap-1.5 items-start">
                                <span className="text-red-500 font-bold">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {result.causes && (
                          <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/60">
                            <span className="text-xs font-bold text-amber-900 block mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Environmental Causes
                            </span>
                            <ul className="text-xs text-slate-700 space-y-1">
                              {result.causes.map((c, idx) => (
                                <li key={idx} className="flex gap-1.5 items-start">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Treatment Plan */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Recommended Treatment & Prescribed Sprays
                      </p>
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs sm:text-sm flex gap-3 text-emerald-950">
                        <CheckCircle className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="space-y-1 leading-relaxed">
                          <p className="font-semibold text-emerald-900">Curative Agronomic Action:</p>
                          <p>{result.treatment}</p>
                        </div>
                      </div>
                    </div>

                    {/* Prevention Tips */}
                    {result.prevention && result.prevention.length > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-xs font-bold text-slate-800 block mb-1">
                          🛡️ Long-Term Preventive Measures:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-0.5">
                          {result.prevention.map((p, idx) => (
                            <li key={idx} className="flex gap-1.5 items-start">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* State 4: Uploaded but failed to analyze */}
                {preview && !analyzing && !result && (
                  <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-center py-10 space-y-3">
                      <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
                      <h4 className="font-semibold text-sm">Image ready for diagnostic</h4>
                      <p className="text-xs text-muted-foreground">Click the button below to initiate AI disease detection.</p>
                      <Button 
                        onClick={() => { if (uploadedFile) processFile(uploadedFile); }}
                        className="hero-gradient text-xs text-white"
                      >
                        Start Diagnostic Analysis
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Past detections */}
        <Card className="card-shadow mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Recent Verified Detections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pastDetections.map((det, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{det.disease}</p>
                    <p className="text-muted-foreground">{det.crop} • {det.date}</p>
                  </div>
                  <span className="font-bold text-primary">{det.confidence}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
