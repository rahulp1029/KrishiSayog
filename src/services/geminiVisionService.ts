export type DiseaseResult = {
    disease: string;
    confidence: number;
    severity: string;
    treatment: string;
};

/**
 * Local Hybrid Mode: Uses the local Python GPU-capable backend for disease detection.
 * Calls localhost:8000/predict.
 */
export async function analyzeLeafImage(file: File): Promise<DiseaseResult> {
    console.log("Analyzing leaf image via Local Python AI...");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Local AI server is not responding. Please run python_backend/local_ai_backend.py");
        }

        const data = await response.json();
        return {
            disease: data.disease,
            confidence: data.confidence,
            severity: data.severity,
            treatment: data.treatment
        };
    } catch (error: any) {
        console.error("Local detection failed:", error);
        throw new Error(error?.message || "Detection failed. Make sure the local python backend is running.");
    }
}
