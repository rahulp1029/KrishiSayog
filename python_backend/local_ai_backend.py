from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
from PIL import Image
import numpy as np

# In-memory local knowledge base
DISEASE_KNOWLEDGE = {
    "Tomato Late Blight": "Symptoms: Brown/black spots with white fungal growth. Treatment: Remove infected plants and use copper-based fungicide.",
    "Tomato Early Blight": "Symptoms: Concentric brown rings on older leaves. Treatment: Use fungicides and practice crop rotation.",
    "Potato Late Blight": "Symptoms: Water-soaked patches on leaves. Treatment: Destroy infected vines and apply protective sprays.",
    "Healthy": "The plant is healthy! Continue regular care and monitoring."
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "KrishiSayog Local AI is running"}

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    try:
        # Mocking the Vision Model (since real .h5 is missing)
        diseases = list(DISEASE_KNOWLEDGE.keys())
        import random
        disease = random.choice(diseases)
        confidence = round(random.uniform(0.88, 0.99), 2)
        
        return {
            "disease": disease,
            "confidence": confidence * 100,
            "severity": "None" if disease == "Healthy" else "Moderate",
            "treatment": DISEASE_KNOWLEDGE[disease]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
