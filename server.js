const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Gemini SDK එක Initialize කිරීම
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Chat Endpoint (Meken pallaha oya liyapu code eka ehemma thiyanna)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
// 2. Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // System prompt එක එක්ක user ගේ මැසේජ් එක යවනවා
        const prompt = `ඔබ Kondaya.lk හි හිසකෙස් පිළිබඳ විශේෂඥයෙකි. මිත්‍රශීලීව සිංහලෙන් පිළිතුරු දෙන්න.\n\nප්‍රශ්නය: ${message}`;
        
        const result = await model.generateContent(prompt);
        res.json({ reply: result.response.text() });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "AI එකට කනෙක්ට් වෙන්න බැරි වුණා මචං." });
    }
});

// 3. Face Analysis Endpoint (Vision)
app.post('/api/analyze-face', async (req, res) => {
    try {
        const { image, lang } = req.body; 

        // Base64 format එකෙන් data කෑල්ලයි, image type එකයි වෙන් කරගන්නවා
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        // UI එකට ගැළපෙන්නම JSON Format එකෙන් උත්තරේ ඉල්ලනවා
        const prompt = `Analyze this face and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
        Provide the explanations and tips in Sinhala.
        Use this exact JSON structure:
        {
          "faceShape": "Oval / Round / Square / Heart / Diamond (Pick one)",
          "confidence": 95,
          "features": ["මුහුණේ කැපී පෙනෙන ලක්ෂණ 2ක් සිංහලෙන්"],
          "tip": "මේ මුහුණට ගැළපෙන Hair care tip එකක් සිංහලෙන්",
          "avoid": ["නොකළ යුතු කොණ්ඩා මෝස්තර 2ක් (English)"],
          "suggestions": [
            { "name": "Hairstyle Name (English)", "reason": "මේක ගැළපෙන්නේ ඇයි කියලා සිංහලෙන්" },
            { "name": "Another Hairstyle (English)", "reason": "හේතුව සිංහලෙන්" }
          ]
        }`;
        
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // සමහරවිට AI එක එවන Markdown (```json) කෑලි අයින් කරලා පිරිසිදු කරනවා
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const finalData = JSON.parse(cleanJson);
        
        res.json(finalData);
    } catch (error) {
        console.error("Face Analysis Error:", error);
        res.status(500).json({ error: "Face analysis failed." });
    }
});
// ... (කලින් කෝඩ් එක)

//const PORT = 3000;
//app.listen(PORT, () => {
    //console.log("🚀 Kondaya Gemini Server running on port 3000");
//});
module.exports = app;
