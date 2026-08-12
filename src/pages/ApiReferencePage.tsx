import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function ApiReferencePage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-20">
                <div className="container max-w-4xl">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">Developers</span>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                            API Reference
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Integrate KrishiSayog's powerful agronomic ML models and real-time data pipelines directly into your own applications.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 border-r border-border pr-6 hidden lg:block">
                            <h3 className="font-bold mb-4 px-2">Endpoints</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li><a href="#auth" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Authentication</a></li>
                                <li><a href="#predict" className="block px-2 py-1.5 rounded-md text-primary font-medium bg-primary/5">Crop Prediction</a></li>
                                <li><a href="#weather" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Weather Forecast</a></li>
                                <li><a href="#disease" className="block px-2 py-1.5 rounded-md hover:bg-muted transition-colors">Disease Analysis</a></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-3 space-y-12">
                            <div className="bg-card rounded-2xl border border-border overflow-hidden" id="auth">
                                <div className="p-6 md:p-8">
                                    <h3 className="text-2xl font-bold mb-4">Authentication</h3>
                                    <p className="text-muted-foreground mb-4">
                                        All API endpoints require a Bearer token in the `Authorization` header. You can generate an API key from your Developer Settings dashboard.
                                    </p>
                                    <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm font-mono text-foreground border border-border">
                                        {`Authorization: Bearer ks_live_xxxxxxxxxxxxxxxxx`}
                                    </pre>
                                </div>
                            </div>

                            <div className="bg-card rounded-2xl border border-border overflow-hidden" id="predict">
                                <div className="bg-muted p-4 border-b border-border flex items-center justify-between">
                                    <span className="font-mono text-sm font-semibold">Base URL</span>
                                    <code className="text-xs bg-background px-2 py-1 rounded">https://api.krishisayog.com/v1</code>
                                </div>

                                <div className="p-6 md:p-8 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 flexItems-center gap-3">
                                            <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-md mb-1 inline-block font-mono uppercase">POST</span>
                                            /predict/crop
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4">Fetches the top 3 recommended crops based on provided soil telemetry.</p>

                                        <h4 className="font-semibold text-sm mb-2">Request Body</h4>
                                        <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm font-mono text-foreground">
                                            {`{
  "nitrogen": 85,
  "phosphorus": 42,
  "potassium": 43,
  "temperature": 25.6,
  "humidity": 68.2,
  "ph": 6.5,
  "rainfall": 150
}`}
                                        </pre>
                                        <h4 className="font-semibold text-sm mt-6 mb-2">Response (200 OK)</h4>
                                        <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm font-mono text-foreground">
                                            {`{
  "status": "success",
  "data": {
    "predictions": [
      { "crop": "wheat", "confidence": 0.92 },
      { "crop": "maize", "confidence": 0.85 },
      { "crop": "cotton", "confidence": 0.64 }
    ],
    "model_version": "v2.1.0"
  }
}`}
                                        </pre>
                                    </div>

                                    <hr className="border-border hidden" />

                                </div>
                            </div>

                            <div className="bg-card rounded-2xl border border-border overflow-hidden p-6 md:p-8" id="weather">
                                <h3 className="text-xl font-bold mb-2 flexItems-center gap-3">
                                    <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-md mb-1 inline-block font-mono uppercase">GET</span>
                                    /weather/forecast
                                </h3>
                                <p className="text-muted-foreground text-sm mb-4">Retrieves the 7-day hyperlocal weather prediction for a specified coordinate.</p>

                                <h4 className="font-semibold text-sm mb-2">Query Parameters</h4>
                                <ul className="text-sm space-y-2 mb-4 list-disc list-inside text-muted-foreground">
                                    <li><code className="text-foreground">lat</code> (number, required) - Latitude</li>
                                    <li><code className="text-foreground">lon</code> (number, required) - Longitude</li>
                                </ul>
                                <h4 className="font-semibold text-sm mt-6 mb-2">Response (200 OK)</h4>
                                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm font-mono text-foreground">
                                    {`{
  "location": { "lat": 19.9975, "lon": 73.7898, "city": "Nashik" },
  "current": {
    "temp": 32.5,
    "humidity": 45,
    "condition": "Sunny"
  },
  "forecast_7d": [ ... ]
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
