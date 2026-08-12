import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Leaf, AlertTriangle, CheckCircle, History, Shield } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeLeafImage } from "@/services/geminiVisionService";
import { toast } from "sonner";

const pastDetections = [
  { disease: "Early Blight", crop: "Tomato", date: "2 days ago", confidence: 91 },
  { disease: "Healthy", crop: "Rice", date: "5 days ago", confidence: 98 },
  { disease: "Powdery Mildew", crop: "Wheat", date: "1 week ago", confidence: 87 },
];

export default function DiseaseDetection() {
  const [result, setResult] = useState<null | { disease: string; confidence: number; treatment: string; severity: string }>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setAnalyzing(true);
      setResult(null);
      try {
        const analysis = await analyzeLeafImage(file);
        setResult(analysis);
      } catch (error: any) {
        console.error("Disease detection failed:", error);
        toast.error(error?.message || "Failed to analyze image. Please try again.");
      } finally {
        setAnalyzing(false);
      }
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
            <h1 className="text-3xl font-bold font-heading">Plant Disease Detection</h1>
            <p className="text-muted-foreground text-sm">Upload a leaf photo to instantly identify diseases using AI.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Upload area */}
          <Card className="card-shadow lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Upload Leaf Image</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300">
                {preview ? (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={preview}
                    alt="Uploaded leaf"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Click to upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    {/* Leaf illustrations */}
                    <div className="flex gap-4 mt-6 opacity-30">
                      <span className="text-3xl">🍃</span>
                      <span className="text-3xl">🌿</span>
                      <span className="text-3xl">🍂</span>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              {preview && (
                <Button variant="outline" className="w-full mt-4" onClick={() => { setPreview(null); setResult(null); }}>
                  Upload Another
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Result */}
          <Card className={`card-shadow lg:col-span-2 ${result ? "border-l-4 border-l-destructive" : ""}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!result && !preview && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-center py-8">
                      <div className="text-5xl mb-4">🌱</div>
                      <p className="text-muted-foreground text-sm">Upload an image to see the AI analysis result.</p>
                      <p className="text-xs text-muted-foreground mt-2">Our AI can detect 50+ plant diseases with 98% accuracy.</p>
                    </div>
                  </motion.div>
                )}

                {analyzing && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col items-center py-8">
                      <div className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="font-medium">Analyzing leaf image...</p>
                      <p className="text-xs text-muted-foreground mt-1">AI model processing your upload</p>
                    </div>
                  </motion.div>
                )}

                {result && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Disease name + severity */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <span className="font-bold text-lg text-destructive">{result.disease}</span>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${result.severity === "High" ? "bg-destructive/10 text-destructive" :
                        result.severity === "Moderate" ? "bg-accent/10 text-accent" :
                          "bg-primary/10 text-primary"
                        }`}>
                        {result.severity} Severity
                      </span>
                    </div>

                    {/* Confidence */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">AI Confidence</span>
                        <span className="font-bold">{result.confidence}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full hero-gradient rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>

                    {/* Treatment */}
                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Treatment</p>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm flex gap-3">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{result.treatment}</span>
                      </div>
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
              <History className="h-4 w-4 text-muted-foreground" /> Recent Detections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pastDetections.map((det, i) => (
                <div key={i} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${det.disease === "Healthy" ? "text-primary" : "text-destructive"}`}>
                      {det.disease}
                    </span>
                    <span className="text-xs text-muted-foreground">{det.confidence}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{det.crop} • {det.date}</p>
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
