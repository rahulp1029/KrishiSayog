export type DiseaseInfo = {
  symptoms: string;
  causes: string;
  treatment: string;
  prevention: string;
};

export const DISEASE_KNOWLEDGE: Record<string, DiseaseInfo> = {
  "Tomato Late Blight": {
    symptoms: "Water-soaked spots on leaves that turn brown/black. White fungal growth may appear on the underside.",
    causes: "Fungal pathogen Phytophthora infestans.",
    treatment: "Remove and destroy infected plants. Use copper-based fungicides if the outbreak is early.",
    prevention: "Ensure good air circulation, avoid overhead watering."
  },
  "Tomato Early Blight": {
    symptoms: "Oldest leaves show small, brown spots with concentric rings (bullseye look).",
    causes: "Fungus Alternaria solani.",
    treatment: "Apply fungicides like Chlorothalonil or Mancozeb. Prune lower leaves.",
    prevention: "Crop rotation and maintain consistent soil moisture."
  },
  "Potato Late Blight": {
    symptoms: "Dark, water-soaked patches on leaves that expand rapidly.",
    causes: "Phytophthora infestans.",
    treatment: "Instant removal of infected foliage. Protective fungicide sprays.",
    prevention: "Plant certified disease-free seed potatoes."
  },
  "Potato Early Blight": {
    symptoms: "Dark brown spots with concentric rings on older leaves.",
    causes: "Fungus Alternaria solani.",
    treatment: "Fungicide application and proper fertilization.",
    prevention: "Avoid overhead irrigation."
  },
  "Corn Common Rust": {
    symptoms: "Small, cinnamon-brown pustules on both upper and lower leaf surfaces.",
    causes: "Puccinia sorghi fungus.",
    treatment: "Fungicide treatments are only needed for severe cases.",
    prevention: "Plant resistant hybrids and manage nitrogen levels."
  },
  "Healthy": {
    symptoms: "Leaves are green and vibrant with no visible spots.",
    causes: "Optimal care and healthy environment.",
    treatment: "Continue regular monitoring and balanced fertilization.",
    prevention: "Proper care and hygiene."
  }
};

export function getLocalAdvisory(disease: string): string {
  const info = DISEASE_KNOWLEDGE[disease] || {
    symptoms: "Unknown symptoms.",
    causes: "Unknown causes.",
    treatment: "Please consult a local agricultural expert.",
    prevention: "Maintain general crop hygiene."
  };

  return `
🌾 **Symptoms**: 
${info.symptoms}

🦠 **Causes**: 
${info.causes}

💊 **Treatment**: 
${info.treatment}

🛡️ **Prevention**: 
${info.prevention}
  `.trim();
}
