import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import XLSX from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "database.json");

// Helper to read database safely
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      const initialData = { items: [], users: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return { items: [], users: [] };
  }
}

// Helper to write database safely
function writeDB(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
}

async function startServer() {
  const app = express();

  // Middleware for parsing JSON with a larger limit to handle captured tag photos (base64)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Initialize Gemini API
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("⚠️ GEMINI_API_KEY is not defined in environment. OCR features will be limited.");
  }

  // --- API Routes ---

  // 0. Configuration Status Endpoint
  app.get("/api/config-status", (req, res) => {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const keyPrefix = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 6) + "..." : null;
    res.json({
      geminiKeyConfigured: hasGeminiKey,
      keyPrefix: keyPrefix,
      environment: process.env.NODE_ENV || "development"
    });
  });

  // 1. Auth Endpoint
  app.post("/api/auth/login", (req, res) => {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ error: "اسم المستخدم ورمز PIN مطلوبان." });
    }

    const db = readDB();
    const user = db.users.find(
      (u: any) => u.username === username && u.pin === pin
    );

    if (user) {
      // Return user profile without sending PIN back
      const { pin: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    } else {
      return res.status(401).json({ error: "رمز PIN غير صحيح لاسم المستخدم هذا." });
    }
  });

  // 2. Get Users Endpoint (for dropdown selection)
  app.get("/api/users", (req, res) => {
    const db = readDB();
    const safeUsers = db.users.map((u: any) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
    }));
    res.json(safeUsers);
  });

  // 3. Get Registered Inventory Items
  app.get("/api/items", (req, res) => {
    const db = readDB();
    res.json(db.items || []);
  });

  // 4. Register a New Jewelry Item (with duplicate serial check)
  app.post("/api/items", (req, res) => {
    const { serialNumber, productType, weight, photoUrl, capturedBy } = req.body;

    if (!serialNumber || !productType || !capturedBy) {
      return res.status(400).json({ error: "الرقم التسلسلي ونوع المنتج واسم الموظف حقول مطلوبة." });
    }

    // Validate serial number format: 4 to 5 digits
    if (!/^\d{4,5}$/.test(serialNumber)) {
      return res.status(400).json({ error: "رقم غير صالح، يجب أن يكون الرقم التسلسلي مكون من 4 أو 5 أرقام فقط بدون حروف." });
    }

    const db = readDB();
    
    // Duplicate detection
    const isDuplicate = db.items.some(
      (item: any) => item.serialNumber === serialNumber
    );

    if (isDuplicate) {
      return res.status(409).json({ error: "هذا الرقم التسلسلي مسجل مسبقاً في النظام!" });
    }

    const newItem = {
      id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      serialNumber,
      productType,
      weight: weight ? parseFloat(weight) : null,
      photoUrl: photoUrl || null,
      capturedBy,
      capturedAt: new Date().toISOString(),
      status: "active",
    };

    db.items.unshift(newItem); // Add to the beginning of the list
    const writeSuccess = writeDB(db);

    if (writeSuccess) {
      res.status(201).json({ success: true, item: newItem });
    } else {
      res.status(500).json({ error: "فشل في حفظ البيانات في قاعدة البيانات." });
    }
  });

  // 5. Delete Inventory Item
  app.delete("/api/items/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLength = db.items.length;
    db.items = db.items.filter((item: any) => item.id !== id);

    if (db.items.length === initialLength) {
      return res.status(404).json({ error: "القطعة غير موجودة." });
    }

    const writeSuccess = writeDB(db);
    if (writeSuccess) {
      res.json({ success: true, message: "تم حذف القطعة بنجاح." });
    } else {
      res.status(500).json({ error: "فشل في تحديث قاعدة البيانات." });
    }
  });

  // 6. Gemini-powered OCR and Classification
  app.post("/api/ocr", async (req, res) => {
    const { image } = req.body; // base64 string
    if (!image) {
      return res.status(400).json({ error: "الصورة مطلوبة لإجراء عملية التعرف الضوئي (OCR)." });
    }

    if (!ai) {
      return res.status(500).json({
        error: "مفتاح API الخاص بـ Gemini غير مهيأ. يرجى إضافته في إعدادات التطبيق.",
      });
    }

    try {
      // Remove data URL prefix if present
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

      const promptText = `
      You are an expert OCR and classification assistant for Babylon Gold & Jewelry (مجوهرات بابل).
      Your task is to analyze the image of a gold piece tag/barcode (لاصق بلاستيكي للذهب) and extract:
      1. The Serial Number (الرقم التسلسلي): Find the digit sequence representing the serial number (typically next to 'SN:' or on a separate line, containing 4 to 8 digits, e.g. '065932' or '12345'). Return only the digits.
      2. The Product Type (نوع المنتج): Classify the item based on visible text or item visual features in the image into one of these exact Arabic categories:
         - 'أساور' (for bracelets, bands)
         - 'حلق' (for earrings, including 'وزغ' or 'وزغ خليجي')
         - 'أخراص' (for rings / خواتم)
         - 'سلسال صدر' (for necklaces, chains, pendants)
         - 'أخرى' (for other wearables, gold bars, etc.)
         Note: If the text says 'وزغ' or 'وزغ خليجي', classify it as 'حلق' (earrings).
      3. The Weight (الوزن): Extract the weight in grams if explicitly printed on the label (e.g. look for numbers near "W", "g", "W:", "وزن", or decimals like "2.15" or "8.52" or "3.5"). Return it as a float/decimal number. If not found or uncertain, return null.

      Return the result strictly in JSON format with keys:
      - 'serialNumber': string or null if not found
      - 'productType': string (Must be one of: 'أساور', 'حلق', 'أخراص', 'سلسال صدر', 'أخرى')
      - 'weight': number or null if not found
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          promptText,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              serialNumber: {
                type: Type.STRING,
                description: "The 4 or 5 digit serial number extracted from the tag (numbers only).",
              },
              productType: {
                type: Type.STRING,
                description: "The category. Must be one of: 'أساور', 'حلق', 'أخراص', 'سلسال صدر', 'أخرى'.",
              },
              weight: {
                type: Type.NUMBER,
                description: "The weight in grams, as a decimal number, or null if not found.",
              },
            },
            required: ["serialNumber", "productType"],
          },
        },
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText);

      return res.json(result);
    } catch (error: any) {
      console.error("Gemini OCR error:", error);
      return res.status(500).json({
        error: "فشل في قراءة البراكيد. يرجى التأكد من وضوح الصورة والمحاولة مرة أخرى.",
        details: error.message,
      });
    }
  });

  // 7. Multi-sheet Excel Export
  app.get("/api/export", (req, res) => {
    try {
      const db = readDB();
      const items = db.items || [];

      const wb = XLSX.utils.book_new();

      // Formatter helper
      const formatRows = (itemList: any[]) => {
        return itemList.map((item: any, idx: number) => ({
          "ت": idx + 1,
          "الرقم التسلسلي": item.serialNumber,
          "نوع المنتج": item.productType,
          "الوزن (غرام)": item.weight !== null && item.weight !== undefined ? item.weight : "يدوي / غير محدد",
          "تاريخ ووقت الجرد": new Date(item.capturedAt).toLocaleString("ar-IQ", {
            timeZone: "Asia/Baghdad",
          }),
          "اسم الموظف": item.capturedBy,
        }));
      };

      // 1. Create a Master Sheet with all items
      if (items.length > 0) {
        const masterRows = formatRows(items);
        const wsMaster = XLSX.utils.json_to_sheet(masterRows);
        XLSX.utils.book_append_sheet(wb, wsMaster, "كافة القطع بالجرد");
      } else {
        const emptyWs = XLSX.utils.json_to_sheet([{ "تنبيه": "لا توجد أي قطع مسجلة حالياً." }]);
        XLSX.utils.book_append_sheet(wb, emptyWs, "كافة القطع بالجرد");
      }

      // 2. Separate Sheets for each categories
      const categories = ["أساور", "حلق", "أخراص", "سلسال صدر", "أخرى"];
      categories.forEach((cat) => {
        const catItems = items.filter((item: any) => item.productType === cat);
        const catRows = formatRows(catItems);
        const wsCat = XLSX.utils.json_to_sheet(catRows.length > 0 ? catRows : [{ "الرقم التسلسلي": "", "نوع المنتج": cat, "الوزن (غرام)": "", "اسم الموظف": "", "تاريخ ووقت الجرد": "لا توجد قطع مسجلة في هذا القسم" }]);
        XLSX.utils.book_append_sheet(wb, wsCat, cat);
      });

      // Write excel buffer
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", "attachment; filename=Babil_Inventory.xlsx");
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    } catch (error: any) {
      console.error("Export error:", error);
      return res.status(500).json({ error: "فشل في إنشاء ملف Excel وتصديره." });
    }
  });

  // 8. Gemini Chatbot / Advanced Analytics Endpoint
  app.post("/api/chat", async (req, res) => {
    const { messages, useHighThinking } = req.body;
    
    if (!ai) {
      return res.status(500).json({
        error: "مفتاح API غير متوفر.",
      });
    }

    try {
      // Basic system instruction
      let systemInstruction = "أنت مساعد ذكي ونظام تحليل بيانات متخصص لمحل 'مجوهرات بابل'. مهمتك مساعدة الموظفين، تحليل البيانات، والإجابة على الاستفسارات المعقدة المتعلقة بجرد الذهب والعمليات.";
      
      const config: any = {
        systemInstruction,
      };

      let modelName = "gemini-3.5-flash";

      if (useHighThinking) {
        modelName = "gemini-3.1-pro-preview";
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH }; // Enabled high thinking
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: messages,
        config,
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      return res.status(500).json({
        error: "حدث خطأ أثناء المحادثة.",
        details: error.message,
      });
    }
  });

  // 9. Advanced Image Analysis
  app.post("/api/analyze-image", async (req, res) => {
    const { image, prompt } = req.body;

    if (!ai) {
      return res.status(500).json({ error: "مفتاح API غير متوفر." });
    }

    try {
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", // Use Pro model for deep image understanding
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          prompt || "يرجى تحليل هذه الصورة بالتفصيل واستخراج كل المعلومات الممكنة منها.",
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Image analysis error:", error);
      return res.status(500).json({
        error: "حدث خطأ أثناء تحليل الصورة.",
        details: error.message,
      });
    }
  });

  // --- End API Routes ---

  // Vite middleware or static files setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Babylon Gold & Jewelry Inventory System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
