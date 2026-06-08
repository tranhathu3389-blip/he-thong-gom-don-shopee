import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for large screenshot files (base64) to prevent PayloadTooLargeError
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK with telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper function to call Gemini API with robust retries and multi-model fallback on 503/UNAVAILABLE/high-demand errors
async function generateContentWithRetry(params: any, maxRetries = 3, baseDelay = 1000) {
  const originalModel = params.model || "gemini-3.5-flash";
  // Fallback models chain for resilient service delivery if the primary model is overloaded
  const modelsToTry = [originalModel, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  
  let lastError: any = null;
  
  for (const currentModel of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const queryParams = { ...params, model: currentModel };
        console.log(`[Gemini API] Invoking model: ${currentModel} (Attempt ${attempt + 1}/${maxRetries})`);
        return await ai.models.generateContent(queryParams);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorStr = String(error?.message || error?.status || error || "");
        
        const isTemporary =
          errorStr.includes("503") ||
          errorStr.includes("UNAVAILABLE") ||
          errorStr.includes("high demand") ||
          error?.status === "UNAVAILABLE" ||
          error?.statusCode === 503;

        if (isTemporary) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(1.5, attempt) + Math.random() * 300;
            console.warn(`[Gemini API] Temporary error on model ${currentModel} (${errorStr.slice(0, 150)}). Retrying model in ${Math.round(delay)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          } else {
            console.warn(`[Gemini API] Model ${currentModel} exhausted all retries due to overload. Switching to next fallback model...`);
          }
        } else {
          // If it is a fatal non-transient error (e.g., parsing, bad request, API schema issues), do not fallback, fail fast.
          throw error;
        }
      }
    }
  }
  // If all models in the fallback chain were exhausted
  throw lastError;
}

// API endpoint to parse Shopee order via Gemini 3.5 Flash
app.post("/api/parse-order", async (req, res): Promise<any> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Nội dung văn bản không được để trống." });
    }

    const systemInstruction = `
Bạn là một trợ lý thông minh chuyên nghiệp giúp trích xuất và chuẩn hóa thông tin đơn hàng Shopee từ tin nhắn chat, hình ảnh chat, ghi chú của người mua, hoặc danh sách đặt hàng thủ công của khách hàng.
Nhiệm vụ của bạn là đọc kỹ đoạn văn bản tiếng Việt do người dùng cung cấp và chuyển đổi thành cấu trúc JSON rõ ràng.

QUY TẮC BẮT BUỘC:
1. Tự động viết hoa chữ cái đầu của mỗi từ trong tất cả các tên riêng (Họ và Tên của học sinh/bé, hoặc tên trường học). Ví dụ: "nguyễn hoàng nam" -> "Nguyễn Hoàng Nam", "đỗ minh khang" -> "Đỗ Minh Khang", "mầm non hoa hướng dương" -> "Mầm Non Hoa Hướng Dương".
2. Thông tin nào KHÔNG CÓ trong tin nhắn đoạn chat thì phải để rỗng "" (để trống), tuyệt đối KHÔNG tự ý suy diễn hoặc điền các giá trị mặc định / bừa bãi. Nếu thiếu trường, lớp hay mẫu dán, ghi chú thì cứ để chuỗi rỗng "".
3. Thu thập thêm các thông tin quan trọng sau:
   - Mã đơn hàng (orderId): Trích xuất chính xác chuỗi mã số đặt hàng dài của Shopee (thường là chuỗi chữ số hoặc kết hợp số và chữ). Nếu hoàn toàn không có trong đoạn chat, để rỗng "".
   - Ngày đơn hàng (orderDate): Trích xuất ngày đặt đơn hoặc thời gian gửi tin nhắn xuất hiện trong cuộc trò chuyện (ví dụ: "08/06/2026", "08-06-2026 14:30" hoặc "08-06-2026"). Nếu không có thông tin ngày, để rỗng "".
   - Ghi chú (notes) của từng dòng: Hoạt cảnh ghi chú riêng của từng sản phẩm dán cho bé (ví dụ: "chữ màu xanh", "cắt viền tròn", v.v.).
4. ĐẶC BIỆT - TỰ ĐỘNG GHI ĐÚNG MÃ MẪU SẢN PHẨM (model):
   Khi phát hiện khách hàng nhắc đến tên chủ đề, hình thù dán, phân loại hoặc mã số của sản phẩm, bạn phải tự động rà soát, đối đối chiếu và điền ĐÚNG CHÍNH XÁC một trong số các Mã sản phẩm chính thức sẵn có dưới đây (giữ nguyên ký tự '#' và tên mẫu chữ hoa/thường):

MẪU NHÃN VỞ CHÍNH THỨC SẴN CÓ:
- #1 Classmate
- #2 Roblox
- #3 Cute Animals
- #4 Caro
- #5 Astronaut
- #6 Kpop Demon Hunter
- #7 Bubu dudu
- #8 MineCraft
- #9 Bare Bears
- #10 Frozen
- #11 Doraemon
- #12 Paw Patrol
- #13 Demon Slayer
- #24 Sticker Cute
- #16 Lotso
- #25 Spider - Man
- #26 Dragon Ball
- #27 Naruto
- #28 OnePiece
- #29 Sanrio
- #31 Capybara
- #34 Dinosaur
- #30 Hello Kitty
- #32 Stitch
- #17 Nhãn in hình  bé chủ đề PawPatrol
- #18 Nhãn in hình bé chủ đề  ToyStory
- #19 Nhãn in hình bé chủ đề Lotso
- #20 Nhãn in hình bé chủ đề Doreamon
- #21 Nhãn in hình bé chủ đề Sắc màu
- #22 Nhãn in hình bé chủ đề Elsa
- #23 Nhãn in hình bé chủ đề Hello Kitty
- #37 Nhãn in hình bé Gundam

MẪU STICKER CHÍNH THỨC SẴN CÓ:
- #1 Bé gái 100
- #2 Bé trai 100
- #3 Elsa 100
- #4 Bé trai 1
- #5 Bé trai 2
- #6 Bé gái
- #7 Siêu nhân
- #8 Doreamon
- #9 Sắc màu
- #10 Cute Animals
- #11 Paw Paltro
- #12 Cute rabit
- #13 Cậu bé bút chì
- #14 Ếch xanh
- #15 Toy Story
- #18 Kuromi 100
- #22 Capybara
- #23 Kuromi
- #24 Cinnamoroll
- #25 Melody
- #26 Dâu Cute
- #27 Cute Kawaii
- #28 Cỏ may mắn
- #29 Cute Cat
- #30 Bé Bơ
- #31 Bé sóc
- #32 Bánh ngọt
- #33 Bé Sâu

Nếu người dùng đưa tin nhắn chỉ ghi tắt hay chung chung như 'nhãn siêu nhân', 'lobo', 'bubu', 'nhãn frozen', 'sticker doreamon', v.v. hãy suy luận ánh xạ sang tên mã có dấu '#' chuẩn ở trên (ví dụ: 'roblox' -> '#2 Roblox', 'unicharm' hay 'gundam nhãn' -> '#37 Nhãn in hình bé Gundam', 'stitch' -> '#32 Stitch', 'bubu' -> '#7 Bubu dudu', 'frozen' -> '#10 Frozen', 'siêu nhân' -> '#7 Siêu nhân').

5. PHÂN TÁCH NHÃN VỞ VÀ STICKER THÀNH 2 TRƯỜNG RIÊNG VÀ TRƯỜNG HỢP STICKER:
   - Bạn chỉ được điền vào một trong 2 trường 'labelModel' (Mẫu nhãn vở) hoặc 'stickerModel' (Mẫu sticker) tương ứng với loại sản phẩm được trích xuất. Trường còn lại phải được gán chuỗi rỗng "".
   - Đối với sản phẩm sticker (có 'stickerModel' khác rỗng), bạn bắt buộc phải:
     + Để trống hoàn toàn thông tin của các trường: 'school' (trường), 'class' (lớp), 'schoolYear' (năm học) (để giá trị là "").
     + Chỉ ghi nhận thông tin mô tả ngắn cần in lên sticker vào cột 'name'.

Hãy phân tích cực kỳ chính xác văn bản tiếng Việt, tách thành danh sách các bé được in tương ứng.
`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: `Hãy phân tích đoạn văn bản sau và trích xuất thông tin chi tiết:
---
${text}
---`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["orderId", "orderDate", "items"],
          properties: {
            orderId: {
               type: Type.STRING,
               description: "Mã đơn hàng Shopee trích xuất được hoặc để rỗng \"\"",
            },
            orderDate: {
               type: Type.STRING,
               description: "Ngày đặt hàng/ngày gửi tin nhắn Shopee trích xuất được hoặc để rỗng \"\"",
            },
            items: {
              type: Type.ARRAY,
              description: "Danh sách sản phẩm hoặc thông tin từng học sinh/khách hàng đặt trong đơn",
              items: {
                type: Type.OBJECT,
                required: ["name", "school", "class", "schoolYear", "labelModel", "stickerModel", "quantity", "notes"],
                properties: {
                  name: { type: Type.STRING, description: "Tên in lên nhãn vở hoặc sticker. Đối với sticker, thông tin in ngắn chỉ ghi vào đây, còn trường, lớp, năm học phải để trống hoàn toàn." },
                  school: { type: Type.STRING, description: "Tên trường học (phải để trống rỗng \"\" đối với sản phẩm sticker)" },
                  class: { type: Type.STRING, description: "Lớp học (phải để trống rỗng \"\" đối với sản phẩm sticker)" },
                  schoolYear: { type: Type.STRING, description: "Năm học (phải để trống rỗng \"\" đối với sản phẩm sticker)" },
                  labelModel: { type: Type.STRING, description: "Mẫu nhãn vở trích xuất được (ví dụ: '#1 Classmate', '#10 Frozen') hoặc để rỗng \"\"" },
                  stickerModel: { type: Type.STRING, description: "Mẫu sticker trích xuất được (ví dụ: '#7 Siêu nhân', '#22 Capybara') hoặc để rỗng \"\"" },
                  quantity: { type: Type.INTEGER, description: "Số lượng đặt hàng cho bé này, mặc định là 1 nếu không ghi rõ" },
                  notes: { type: Type.STRING, description: "Mọi ghi chú riêng đi kèm, nếu không có để rỗng \"\"" },
                },
              },
            },
          },
        },
      },
    });

    const parsedResult = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("Lỗi khi gọi Gemini API:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Đã xảy ra lỗi khi phân tích đơn hàng bằng AI.",
    });
  }
});

// New API endpoint to parse Shopee order via screenshots using Gemini 3.5 Flash (multimodal)
app.post("/api/parse-screenshot", async (req, res): Promise<any> => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Dữ liệu hình ảnh (base64) không được để trống." });
    }

    let mimeType = "image/png";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const systemInstruction = `
Bạn là một trợ lý thông minh chuyên nghiệp giúp trích xuất và chuẩn hóa thông tin đơn hàng Shopee từ hình ảnh chụp màn hình tin nhắn chat, hình ảnh thông tin người mua gửi, hoặc ảnh danh sách đặt hàng tiếng Việt.
Nhiệm vụ của bạn là phân tích kỹ hình ảnh do người dùng cung cấp và chuyển đổi thành cấu trúc JSON rõ ràng.

QUY TẮC BẮT BUỘC:
1. Tự động viết hoa chữ cái đầu của mỗi từ trong tất cả các tên riêng (Họ và Tên của học sinh/bé, hoặc tên trường học). Ví dụ: "nguyễn hoàng nam" -> "Nguyễn Hoàng Nam", "đỗ minh khang" -> "Đỗ Minh Khang", "mầm non hoa hướng dương" -> "Mầm Non Hoa Hướng Dương".
2. Thông tin nào KHÔNG CÓ trong ảnh chụp thì phải để rỗng "" (để trống), tuyệt đối KHÔNG tự ý suy diễn hoặc điền các giá trị mặc định / bừa bãi. Nếu thiếu trường, lớp hay mẫu dán, ghi chú thì cứ để chuỗi rỗng "".
3. Thu thập thêm các thông tin quan trọng sau:
   - Mã đơn hàng (orderId): Trích xuất chính xác chuỗi mã số đặt hàng dài của Shopee (thường là chuỗi chữ số hoặc kết hợp số và chữ). Nếu hoàn toàn không có trong ảnh chụp, để rỗng "".
   - Ngày đơn hàng (orderDate): Trích xuất ngày đặt đơn hoặc thời gian gửi tin nhắn xuất hiện trong cuộc trò chơi hay nhãn thời gian của ảnh chụp (ví dụ: "08/06/2026", "08-06-2026 14:30" hoặc "08-06-2026"). Nếu không có thông tin ngày, để rỗng "".
   - Ghi chú (notes) của từng dòng: Hoạt cảnh ghi chú riêng của từng sản phẩm dán cho bé (ví dụ: "chữ màu xanh", "cắt viền tròn", v.v.).
4. ĐẶC BIỆT - TỰ ĐỘNG GHI ĐÚNG MÃ MẪU SẢN PHẨM (model):
   Khi phát hiện khách hàng nhắc đến tên chủ đề, hình thù dán, phân loại hoặc mã số của sản phẩm hiển thị trên ảnh chụp màn hình đơn hàng, bạn phải tự động rà soát, đối đối chiếu và điền ĐÚNG CHÍNH XÁC một trong số các Mã sản phẩm chính thức sẵn có dưới đây (giữ nguyên ký tự '#' và tên mẫu chữ hoa/thường):

MẪU NHÃN VỞ CHÍNH THỨC SẴN CÓ:
- #1 Classmate
- #2 Roblox
- #3 Cute Animals
- #4 Caro
- #5 Astronaut
- #6 Kpop Demon Hunter
- #7 Bubu dudu
- #8 MineCraft
- #9 Bare Bears
- #10 Frozen
- #11 Doraemon
- #12 Paw Patrol
- #13 Demon Slayer
- #24 Sticker Cute
- #16 Lotso
- #25 Spider - Man
- #26 Dragon Ball
- #27 Naruto
- #28 OnePiece
- #29 Sanrio
- #31 Capybara
- #34 Dinosaur
- #30 Hello Kitty
- #32 Stitch
- #17 Nhãn in hình  bé chủ đề PawPatrol
- #18 Nhãn in hình bé chủ đề  ToyStory
- #19 Nhãn in hình bé chủ đề Lotso
- #20 Nhãn in hình bé chủ đề Doreamon
- #21 Nhãn in hình bé chủ đề Sắc màu
- #22 Nhãn in hình bé chủ đề Elsa
- #23 Nhãn in hình bé chủ đề Hello Kitty
- #37 Nhãn in hình bé Gundam

MẪU STICKER CHÍNH THỨC SẴN CÓ:
- #1 Bé gái 100
- #2 Bé trai 100
- #3 Elsa 100
- #4 Bé trai 1
- #5 Bé trai 2
- #6 Bé gái
- #7 Siêu nhân
- #8 Doreamon
- #9 Sắc màu
- #10 Cute Animals
- #11 Paw Paltro
- #12 Cute rabit
- #13 Cậu bé bút chì
- #14 Ếch xanh
- #15 Toy Story
- #18 Kuromi 100
- #22 Capybara
- #23 Kuromi
- #24 Cinnamoroll
- #25 Melody
- #26 Dâu Cute
- #27 Cute Kawaii
- #28 Cỏ may mắn
- #29 Cute Cat
- #30 Bé Bơ
- #31 Bé sóc
- #32 Bánh ngọt
- #33 Bé Sâu

Nếu trên ảnh chụp màn hình chỉ hiển thị các từ viết tắt hay chung chung như 'nhãn siêu nhân', 'lobo', 'bubu', 'nhãn frozen', 'sticker doreamon', v.v. hãy suy luận ánh xạ sang tên mã có dấu '#' chuẩn ở trên (ví dụ: 'roblox' -> '#2 Roblox', 'unicharm' hay 'gundam nhãn' -> '#37 Nhãn in hình bé Gundam', 'stitch' -> '#32 Stitch', 'bubu' -> '#7 Bubu dudu', 'frozen' -> '#10 Frozen', 'siêu nhân' -> '#7 Siêu nhân').

5. PHÂN TÁCH NHÃN VỞ VÀ STICKER THÀNH 2 TRƯỜNG RIÊNG VÀ TRƯỜNG HỢP STICKER:
   - Bạn chỉ được điền vào một trong 2 trường 'labelModel' (Mẫu nhãn vở) hoặc 'stickerModel' (Mẫu sticker) tương ứng với loại sản phẩm được trích xuất. Trường còn lại phải được gán chuỗi rỗng "".
   - Đối với sản phẩm sticker (có 'stickerModel' khác rỗng), bạn bắt buộc phải:
     + Để trống hoàn toàn thông tin của các trường: 'school' (trường), 'class' (lớp), 'schoolYear' (năm học) (để giá trị là "").
     + Chỉ ghi nhận thông tin mô tả ngắn cần in lên sticker vào cột 'name'.

Hãy phân tích cực kỳ chính xác văn bản hiển thị trên ảnh để trích xuất danh sách các bé được in tương ứng.
`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: "Hãy phân tích hình ảnh chụp màn hình tin nhắn chat Shopee này và trích xuất mọi chi tiết đặt hàng thành định dạng JSON chuẩn.",
    };

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["orderId", "orderDate", "items"],
          properties: {
            orderId: {
              type: Type.STRING,
              description: "Mã đơn hàng Shopee trích xuất được hoặc để rỗng \"\"",
            },
            orderDate: {
              type: Type.STRING,
              description: "Ngày đặt hàng/ngày gửi tin nhắn Shopee trích xuất được hoặc để rỗng \"\"",
            },
            items: {
              type: Type.ARRAY,
              description: "Danh sách sản phẩm hoặc thông tin từng học sinh/khách hàng đặt trong đơn",
              items: {
                type: Type.OBJECT,
                required: ["name", "school", "class", "schoolYear", "labelModel", "stickerModel", "quantity", "notes"],
                properties: {
                  name: { type: Type.STRING, description: "Tên in lên nhãn vở hoặc sticker. Đối với sticker, thông tin in ngắn chỉ ghi vào đây, còn trường, lớp, năm học phải để trống hoàn toàn." },
                  school: { type: Type.STRING, description: "Tên trường học (phải để trống rỗng \"\" đối với sản phẩm sticker)" },
                  class: { type: Type.STRING, description: "Lớp học (phải để trống rỗng \"\" đối với sản phẩm sticker)" },
                  schoolYear: { type: Type.STRING, description: "Năm học (phải để trống rỗng \"\" đối với sản phẩm sticker)" },
                  labelModel: { type: Type.STRING, description: "Mẫu nhãn vở trích xuất được (ví dụ: '#1 Classmate', '#10 Frozen') hoặc để rỗng \"\"" },
                  stickerModel: { type: Type.STRING, description: "Mẫu sticker trích xuất được (ví dụ: '#7 Siêu nhân', '#22 Capybara') hoặc để rỗng \"\"" },
                  quantity: { type: Type.INTEGER, description: "Số lượng đặt hàng cho bé này, mặc định là 1 nếu không ghi rõ" },
                  notes: { type: Type.STRING, description: "Mọi ghi chú riêng đi kèm, nếu không có để rỗng \"\"" },
                },
              },
            },
          },
        },
      },
    });

    const parsedResult = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error("Lỗi khi gọi Gemini API phân tích màn hình:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Đã xảy ra lỗi khi phân tích hình ảnh bằng AI.",
    });
  }
});

// Setup Vite development server or production static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Đang khởi động Server ở chế độ Phát triển (Development)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Đang khởi động Server ở chế độ Vận hành (Production)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ứng dụng đang chạy tại cổng http://localhost:${PORT}`);
  });
}

setupServer();
