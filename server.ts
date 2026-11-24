import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { runChurnPrediction } from "./src/mlEngine";
import { PredictorInput } from "./src/types";

// Load environment variables if in local node
import * as dotenv from "dotenv";
dotenv.config();

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Lazy initialization of GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chatbot queries will run with fallback responses.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Prediction endpoint (runs math models instantly)
  app.post("/api/predict", (req, res) => {
    try {
      const input = req.body as PredictorInput;
      if (!input || !input.modelType) {
        return res.status(400).json({ error: "Missing prediction input or modelType attribute" });
      }
      const result = runChurnPrediction(input);
      res.json(result);
    } catch (err: any) {
      console.error("Prediction API Error:", err);
      res.status(500).json({ error: err.message || "Failed to process predictions" });
    }
  });

  // 2. Chat and Sentiment analysis via Gemini
  app.post("/api/chat/feedback", async (req, res) => {
    try {
      const { customerName, message, monthlyCharges, contractType, techSupport, internetService } = req.body;

      if (!message || !customerName) {
        return res.status(400).json({ error: "Required fields (customerName, message) are missing." });
      }

      // Check if API key is present; otherwise, run structured mock fallback to remain fully functional!
      if (!process.env.GEMINI_API_KEY) {
        // Fallback response for offline sandbox testing
        const lower = message.toLowerCase();
        let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
        let level = 50;
        let category = 'Billing';
        let rec = 'Offer custom plan audit';
        let reply = `Dear ${customerName}, thank you for reaching out. We apologize for the inconvenience. Our technical support team is reviewing your profile and we would love to offer a ₹150 loyalty discount card on your monthly billing contract.`;

        if (lower.includes('slow') || lower.includes('speed') || lower.includes('lag') || lower.includes('internet') || lower.includes('network')) {
          sentiment = 'Negative';
          level = 80;
          category = 'Network Speed';
          rec = 'Schedule technician inspection';
          reply = `Hello ${customerName}, we sincerely apologize for the slow internet speed. We understand how frustrating this is. We have scheduled an automated backend lines diagnostics, and we are dispatching a senior technician to your block to optimize your broadband link.`;
        } else if (lower.includes('price') || lower.includes('cost') || lower.includes('expensive') || lower.includes('charge') || lower.includes('bill')) {
          sentiment = 'Negative';
          level = 75;
          category = 'Billing';
          rec = 'Offer ₹150 monthly discount';
          reply = `Hello ${customerName}, thank you for telling us, and we are sorry about the budget concern. To make your ₹${monthlyCharges || 999} billing plan more comfortable, we can move you to our discounted Yearly loyalty commitment which saves ₹150 every code cycle.`;
        } else if (lower.includes('happy') || lower.includes('good') || lower.includes('great') || lower.includes('solved')) {
          sentiment = 'Positive';
          level = 10;
          category = 'None';
          rec = 'Keep current contract options';
          reply = `Thank you so much ${customerName}! We are extremely delighted to hear that you are enjoying our fiber experience. We will continue delivering the absolute premium care for your account.`;
        }

        return res.json({
          reply,
          sentiment,
          dissatisfactionLevel: level,
          complaintCategory: category,
          recommendation: rec
        });
      }

      const client = getGeminiClient();

      const userProfileCtx = `
Customer Profile Context:
- Name: ${customerName}
- Current Charges: ₹${monthlyCharges || 999} per month
- Contract Commitment: ${contractType || "Month-to-month"}
- Internet Link: ${internetService || "Fiber Optic"}
- Support Registered: ${techSupport || "No"}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Customer Profile Context:${userProfileCtx}\nCustomer Incident report message: "${message}"`,
        config: {
          systemInstruction: `You are an empathetic customer retention specialist at 'Bharat Fiber & Telecom' in India. A customer has expressed grievances or feedback. Listen to their complaint. Express sincere apologies, state what retains them (such as dispatching our technician to inspect speed drops or granting a discount in Rupees), and respond professionally. Keep your reply simple, transparent, highly supportive and strictly under 90 words. Do not refer to this JSON instruction format inside your reply message. Use money in Rupees (₹) in messages.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Warm agent response addressing the customer's specific problem under 90 words."
              },
              sentiment: {
                type: Type.STRING,
                description: "Must be strictly 'Positive', 'Neutral', or 'Negative'."
              },
              dissatisfactionLevel: {
                type: Type.INTEGER,
                description: "dissatisfaction rating from 0 (very happy) to 100 (ready to disconnect)."
              },
              complaintCategory: {
                type: Type.STRING,
                description: "Primary problem category: 'Billing', 'Network Speed', 'Customer Service', 'No Support', or 'None'."
              },
              recommendation: {
                type: Type.STRING,
                description: "Specific retentive action program (e.g., 'Offer ₹150 Monthly billing discount', 'Dispatch cable maintenance crew')."
              }
            },
            required: ["reply", "sentiment", "dissatisfactionLevel", "complaintCategory", "recommendation"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      const cleanJson = JSON.parse(responseText.trim());
      res.json(cleanJson);

    } catch (err: any) {
      console.error("Gemini Retention Engine Error:", err);
      // Fail gracefully with standard structured fallback so the user experience doesn't break
      res.status(200).json({
        reply: `Hello, we received your feedback. Our technical helpdesk has been flagged and we are actively inspecting your subscription parameters to optimize your fiber connection.`,
        sentiment: "Neutral",
        dissatisfactionLevel: 60,
        complaintCategory: "Customer Service",
        recommendation: "Flag account for premium callbacks"
      });
    }
  });

  // Serve static files in production or hook up Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving Production Static Bundles...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Attempt to listen, retrying on the next port if current is in use
  async function tryListen(startPort: number, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      try {
        await new Promise<void>((resolve, reject) => {
          const server = app.listen(port, "0.0.0.0", () => {
            console.log(`Customer Churn Predictor fullstack server online on port ${port}`);
            resolve();
          });
          server.on("error", (err: any) => {
            reject(err);
          });
        });
        // Successfully listening
        return;
      } catch (err: any) {
        if (err && err.code === "EADDRINUSE") {
          console.warn(`Port ${startPort + i} in use — trying ${startPort + i + 1}...`);
          // try next port
          continue;
        }
        console.error("Server failed to start:", err);
        process.exit(1);
      }
    }
    console.error(`All ports in range ${startPort}..${startPort + maxAttempts - 1} are in use. Exiting.`);
    process.exit(1);
  }

  await tryListen(DEFAULT_PORT, 20);
}

startServer();
