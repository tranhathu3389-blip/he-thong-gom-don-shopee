import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  Save,
  FileSpreadsheet,
  Sparkles,
  Check,
  AlertCircle,
  School,
  User,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Layers,
  ChevronDown,
  X,
  Info,
  Layers3,
  Calendar,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  UploadCloud,
  Clipboard,
  ExternalLink
} from "lucide-react";
import { OrderItem, ShopeeOrder } from "./types";


export default function App() {
  // --- CORE STATE ---
  const [orders, setOrders] = useState<ShopeeOrder[]>(() => {
  const saved = localStorage.getItem("shopee_orders");
  return saved ? JSON.parse(saved) : [];
});

  const [items, setItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem("shopee_items");
    const loadedData = saved ? JSON.parse(saved) : [];
    return loadedData.map((it: any) => {
      // Compatibility mapping
      const labelModel = it.labelModel !== undefined ? it.labelModel : (it.model && !it.model.toLowerCase().includes("sticker") ? it.model : "");
      const stickerModel = it.stickerModel !== undefined ? it.stickerModel : (it.model && it.model.toLowerCase().includes("sticker") ? it.model : "");
      
      const isSticker = stickerModel && stickerModel.trim() !== "";
      return {
        ...it,
        school: isSticker ? "" : (it.school || ""),
        class: isSticker ? "" : (it.class || ""),
        schoolYear: isSticker ? "" : (it.schoolYear || ""),
        labelModel,
        stickerModel,
      };
    });
  });

  // Pages tab: 'page1' (Thống kê Doanh Số), 'page2' (Nhập thông tin đơn hàng), 'page3' (Bảng kê chi tiết)
  const [activeTab, setActiveTab] = useState<"page1" | "page2" | "page3">("page2");

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // General Filter Date (Default to the latest available date or 'all')
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");

  // Keywords & Filters in Page 2
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelFilter, setSelectedModelFilter] = useState("all");

  // Add order code form state (manual list)
  const [newOrderId, setNewOrderId] = useState("");
  const [newOrderNotes, setNewOrderNotes] = useState("");
  const [isAddingOrderCode, setIsAddingOrderCode] = useState(false);

  // Manual creation of single item
  const [isAddingManualItem, setIsAddingManualItem] = useState(false);
  const [newItemOrderId, setNewItemOrderId] = useState("");
  const [newItemOrderDate, setNewItemOrderDate] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemSchool, setNewItemSchool] = useState("");
  const [newItemClass, setNewItemClass] = useState("");
  const [newItemSchoolYear, setNewItemSchoolYear] = useState("");
  const [newItemLabelModel, setNewItemLabelModel] = useState("");
  const [newItemStickerModel, setNewItemStickerModel] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newItemConfirmed, setNewItemConfirmed] = useState(false); // default "chưa làm"

  // Inline entry editing state
  const [edittedItemId, setEdittedItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemOrderDate, setEditItemOrderDate] = useState("");
  const [editItemSchool, setEditItemSchool] = useState("");
  const [editItemClass, setEditItemClass] = useState("");
  const [editItemSchoolYear, setEditItemSchoolYear] = useState("");
  const [editItemLabelModel, setEditItemLabelModel] = useState("");
  const [editItemStickerModel, setEditItemStickerModel] = useState("");
  const [editItemQty, setEditItemQty] = useState(1);
  const [editItemNotes, setEditItemNotes] = useState("");

  // Helper inside component to auto-capitalize student and school names correctly
  const capitalizeProperName = (str: string): string => {
    if (!str) return "";
    return str
      .trim()
      .split(/\s+/)
      .map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  // AI text parsing state
  const [aiText, setAiText] = useState("");
  const [isParsingText, setIsParsingText] = useState(false);

  // AI screenshot parsing state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isParsingScreenshot, setIsParsingScreenshot] = useState(false);
  const [activeParserTab, setActiveParserTab] = useState<"text" | "screenshot">("text");

  // --- GOOGLE SHEETS INTEGRATION STATE ---
  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem("shopee_sheet_url") || "https://docs.google.com/spreadsheets/d/1D-pZhVcx0qjqrwL6nQiI2yUs7roby8eXXn4-pVUNTEQ/edit?usp=sharing";
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem("shopee_apps_script_url") || "";
  });

  const handleSheetUrlChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.includes("script.google.com/macros/s/")) {
      setAppsScriptUrl(trimmed);
      showToast("Tự động phát hiện & chuyển địa chỉ Apps Script vào ô bên cạnh! 🔮", "info");
      return;
    }
    setSheetUrl(trimmed);
  };

  const handleAppsScriptUrlChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.includes("docs.google.com/spreadsheets/d/")) {
      setSheetUrl(trimmed);
      showToast("Tự động phát hiện & chuyển đường dẫn Google Sheet vào ô bên cạnh! 🔮", "info");
      return;
    }
    setAppsScriptUrl(trimmed);
  };
  const [autoSyncSheets, setAutoSyncSheets] = useState(() => {
    const saved = localStorage.getItem("shopee_auto_sync_sheets");
    return saved !== "false";
  });
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [showSheetsConfigHelp, setShowSheetsConfigHelp] = useState(false);

  // Save Google Sheets parameters to localStorage
  useEffect(() => {
    localStorage.setItem("shopee_sheet_url", sheetUrl);
  }, [sheetUrl]);

  useEffect(() => {
    localStorage.setItem("shopee_apps_script_url", appsScriptUrl);
  }, [appsScriptUrl]);

  useEffect(() => {
    localStorage.setItem("shopee_auto_sync_sheets", String(autoSyncSheets));
  }, [autoSyncSheets]);

  // Helper to extract sheet ID safely
  const getSpreadsheetId = (url: string) => {
    try {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : "1D-pZhVcx0qjqrwL6nQiI2yUs7roby8eXXn4-pVUNTEQ";
    } catch {
      return "1D-pZhVcx0qjqrwL6nQiI2yUs7roby8eXXn4-pVUNTEQ";
    }
  };

  const spreadsheetId = getSpreadsheetId(sheetUrl);

  const syncItemsToSheets = async (itemsToSync: OrderItem[], silent = false): Promise<boolean> => {
    if (itemsToSync.length === 0) return false;
    
    const currentScriptUrl = localStorage.getItem("shopee_apps_script_url") || appsScriptUrl;
    if (!currentScriptUrl) {
      if (!silent) {
        showToast("Vui lòng cấu hình URL Google Apps Script để đồng bộ với Sheet!", "error");
        setShowSheetsConfigHelp(true);
      }
      return false;
    }

    setIsSyncingSheets(true);
    try {
      const payload = itemsToSync.map(it => ({
  orderId: it.orderId || "",
  labelModel: it.labelModel || "",
  stickerModel: it.stickerModel || "",
  quantity: it.quantity || "",
  school: it.school || "",
  class: it.class || "",
  name: it.name || "",
  schoolYear: it.schoolYear || "",
  notes: it.notes || "",
  createdAt: new Date(it.createdAt).toLocaleString("vi-VN")
}));
   
  
   
   
   
 
  

    
 
      
   


await fetch(currentScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      // Mark these items as synced locally
      const syncedIds = itemsToSync.map(it => it.id);
      setItems(prevItems => {
        const updated = prevItems.map(it => {
          if (syncedIds.includes(it.id)) {
            return { ...it, syncedToSheets: true };
          }
          return it;
        });
        localStorage.setItem("shopee_items", JSON.stringify(updated));
        return updated;
      });

      if (!silent) {
        showToast(`Đã đồng bộ thành công ${itemsToSync.length} sản phẩm sang Google Sheet! 🟢`);
      }
      return true;
    } catch (error: any) {
      console.error("Lỗi đồng bộ google sheet:", error);
      if (!silent) {
        showToast(`Gặp lỗi khi ghi sang Google Sheet: ${error.message || error}`, "error");
      }
      return false;
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // --- NOTIFICATION MANAGER ---
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- LOCAL PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("shopee_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("shopee_items", JSON.stringify(items));
    
    // Auto-update order itemCount
    setOrders(prevOrders => {
      return prevOrders.map(ord => {
        const count = items.filter(it => it.orderId === ord.orderId).length;
        return { ...ord, itemCount: count };
      });
    });
  }, [items]);

  // Get distinct dates present in our items
  const uniqueDates: string[] = Array.from(
    new Set(items.map(it => it.createdAt.slice(0, 10)))
  ) as string[];
  uniqueDates.sort((a, b) => b.localeCompare(a));

  // Default date filter fallback
  useEffect(() => {
    if (selectedDateFilter === "all" && uniqueDates.length > 0) {
      // Auto set to latest date for better default visualization in reports
      setSelectedDateFilter(uniqueDates[0]);
    }
  }, []);

  // --- ACTIONS ---

  // 1. Manual order code initialization
  const handleAddOrderCode = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = newOrderId.trim();
    if (!formattedId) {
      showToast("Mã đơn hàng không được bỏ trống!", "error");
      return;
    }

    if (orders.some(o => o.orderId.toLowerCase() === formattedId.toLowerCase())) {
      showToast("Mã đơn hàng này đã tồn tại!", "error");
      return;
    }

    const newOrder: ShopeeOrder = {
      orderId: formattedId,
      createdAt: new Date().toISOString(),
      status: "pending",
      notes: newOrderNotes.trim(),
      itemCount: 0,
    };

    setOrders([newOrder, ...orders]);
    setNewOrderId("");
    setNewOrderNotes("");
    setIsAddingOrderCode(false);
    showToast(`Đã khởi tạo đơn hàng số ${formattedId} thành công!`);
  };

  const [deleteOrderConfirmId, setDeleteOrderConfirmId] = useState<string | null>(null);
  const [deleteItemConfirmId, setDeleteItemConfirmId] = useState<string | null>(null);

  const handleDeleteOrder = (orderIdToDelete: string) => {
    setDeleteOrderConfirmId(orderIdToDelete);
  };

  const handleConfirmDeleteOrder = () => {
    if (deleteOrderConfirmId) {
      setOrders(orders.filter(o => o.orderId !== deleteOrderConfirmId));
      setItems(items.filter(it => it.orderId !== deleteOrderConfirmId));
      showToast(`Đã xóa đơn hàng ${deleteOrderConfirmId}`);
      setDeleteOrderConfirmId(null);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: "pending" | "processing" | "completed") => {
    setOrders(orders.map(o => (o.orderId === orderId ? { ...o, status } : o)));
    showToast("Đã cập nhật trạng thái đơn hàng!");
  };

  // 2. Direct designer checklist toggle ("Đã làm" status button)
  const handleToggleConfirmItem = (id: string) => {
    setItems(items.map(it => {
      if (it.id === id) {
        const nextStatus = !it.confirmed;
        showToast(nextStatus ? "Đã đánh dấu Đã làm thiết kế ✓" : "Đã hủy đánh dấu Đã làm", "info");
        return { ...it, confirmed: nextStatus };
      }
      return it;
    }));
  };

  // 3. Manual order item addition
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemOrderId) {
      showToast("Vui lòng nhập hoặc chọn mã đơn hàng liên kết!", "error");
      return;
    }

    if (!newItemName.trim()) {
      showToast("Vui lòng điền họ và tên!", "error");
      return;
    }

    if (!newItemLabelModel.trim() && !newItemStickerModel.trim()) {
      showToast("Vui lòng điền Mẫu nhãn vở hoặc Mẫu sticker!", "error");
      return;
    }

    const isSticker = newItemStickerModel.trim() !== "";

    const createdItem: OrderItem = {
      id: `item-${Date.now()}`,
      orderId: newItemOrderId.trim(),
      name: capitalizeProperName(newItemName.trim()),
      school: isSticker ? "" : capitalizeProperName(newItemSchool.trim()),
      class: isSticker ? "" : newItemClass.trim(),
      schoolYear: isSticker ? "" : newItemSchoolYear.trim(),
      labelModel: newItemLabelModel.trim(),
      stickerModel: newItemStickerModel.trim(),
      model: (newItemLabelModel.trim() || newItemStickerModel.trim()),
      quantity: Math.max(1, newItemQty),
      notes: newItemNotes.trim(),
      createdAt: new Date().toISOString(),
      confirmed: newItemConfirmed,
      orderDate: newItemOrderDate.trim(),
    };

    // Auto-create order if custom orderId doesn't exist
    if (!orders.some(o => o.orderId.toLowerCase() === newItemOrderId.trim().toLowerCase())) {
      const newOrder: ShopeeOrder = {
        orderId: newItemOrderId.trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
        notes: "Khởi tạo tự động khi thêm khách đặt.",
        itemCount: 1,
      };
      setOrders(prev => [newOrder, ...prev]);
    }

    setItems([createdItem, ...items]);

    // Google Sheets Auto Sync
    if (autoSyncSheets && appsScriptUrl) {
      syncItemsToSheets([createdItem], true);
    }

    // Reset fields
    setNewItemName("");
    setNewItemSchool("");
    setNewItemClass("");
    setNewItemSchoolYear("");
    setNewItemLabelModel("");
    setNewItemStickerModel("");
    setNewItemQty(1);
    setNewItemNotes("");
    setNewItemOrderDate("");
    setNewItemConfirmed(false);
    setIsAddingManualItem(false);
    showToast("Đã nhập thủ công thông tin in sản phẩm thành công!");
  };

  // 4. Inline editors
  const handleStartEditItem = (item: OrderItem) => {
    setEdittedItemId(item.id);
    setEditItemName(item.name);
    setEditItemSchool(item.school);
    setEditItemClass(item.class);
    setEditItemSchoolYear(item.schoolYear || "");
    setEditItemLabelModel(item.labelModel || "");
    setEditItemStickerModel(item.stickerModel || "");
    setEditItemQty(item.quantity);
    setEditItemNotes(item.notes);
    setEditItemOrderDate(item.orderDate || "");
  };

  const handleSaveEditItem = (id: string) => {
    if (!editItemName.trim()) {
      showToast("Tên khách hàng không được để trống!", "error");
      return;
    }
    if (!editItemLabelModel.trim() && !editItemStickerModel.trim()) {
      showToast("Mẫu nhãn vở hoặc Mẫu sticker không được để trống!", "error");
      return;
    }

    const isSticker = editItemStickerModel.trim() !== "";

    setItems(items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          name: capitalizeProperName(editItemName.trim()),
          school: isSticker ? "" : capitalizeProperName(editItemSchool.trim()),
          class: isSticker ? "" : editItemClass.trim(),
          schoolYear: isSticker ? "" : editItemSchoolYear.trim(),
          labelModel: editItemLabelModel.trim(),
          stickerModel: editItemStickerModel.trim(),
          model: (editItemLabelModel.trim() || editItemStickerModel.trim()),
          quantity: editItemQty,
          notes: editItemNotes.trim(),
          orderDate: editItemOrderDate.trim(),
        };
      }
      return it;
    }));

    setEdittedItemId(null);
    showToast("Cập nhật thông tin chi tiết thành công!");
  };

  const handleDeleteItem = (id: string) => {
    setDeleteItemConfirmId(id);
  };

  const handleConfirmDeleteItem = () => {
    if (deleteItemConfirmId) {
      setItems(items.filter(it => it.id !== deleteItemConfirmId));
      showToast("Đã xóa dòng thông tin sản phẩm!");
      setDeleteItemConfirmId(null);
    }
  };

  // 5. AI TEXT MESSAGE PARSING
  const handleParseWithAI = async () => {
    if (!aiText.trim()) {
      showToast("Vui lòng nhập hoặc dán nội dung đoạn chat trước!", "info");
      return;
    }

    setIsParsingText(true);
    showToast("AI đang đọc và bóc tách thông tin in, vui lòng chờ...", "info");

    try {
      const response = await fetch(`https://he-thong-gom-don-shopee.onrender.com/api/parse-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      let resData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(textError.slice(0, 150) || "Phản hồi từ máy chủ không hợp lệ (HTML thay vì JSON).");
      }

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Gặp sự cố khi kết nối tới AI.");
      }

      const { data } = resData;
      const parsedOrderId = data.orderId || "";
      const parsedItems = responseData.items || [];

setItems(parsedItems);

      if (parsedItems.length === 0) {
        showToast("Gemini AI không phát hiện ra danh sách in tên nào trong văn bản này.", "error");
        return;
      }

      // Check order
      if (!orders.some(o => o.orderId === parsedOrderId)) {
        const newOrder: ShopeeOrder = {
          orderId: parsedOrderId,
          createdAt: new Date().toISOString(),
          status: "pending",
          notes: parsedOrderId ? `Gom thông tin của học sinh tự động từ tin nhắn chat.` : `Bóc tách tự động đoạn chat không mã`,
          itemCount: parsedItems.length,
        };
        setOrders(prev => [newOrder, ...prev]);
      }

      const newCreatedItems: OrderItem[] = parsedItems.map((pi: any, idx: number) => {
        const isSticker = pi.stickerModel && pi.stickerModel.trim() !== "";
        return {
          id: `item-ai-txt-${Date.now()}-${idx}`,
          orderId: parsedOrderId,
          name: pi.name ? capitalizeProperName(pi.name) : "",
          school: isSticker ? "" : (pi.school ? capitalizeProperName(pi.school) : ""),
          class: isSticker ? "" : (pi.class || ""),
          schoolYear: isSticker ? "" : (pi.schoolYear || ""),
          labelModel: pi.labelModel || "",
          stickerModel: pi.stickerModel || "",
          model: pi.labelModel || pi.stickerModel || "",
          quantity: typeof pi.quantity === "number" ? pi.quantity : 1,
          notes: pi.notes || "",
          createdAt: new Date().toISOString(),
          confirmed: false, // Default uncompleted
          orderDate: data.orderDate || "",
        };
      });

      setItems(prev => [...newCreatedItems, ...prev]);

      // Google Sheets Auto Sync
      if (autoSyncSheets && appsScriptUrl) {
        syncItemsToSheets(newCreatedItems, true);
      }

      setAiText("");
      showToast(`AI đã xử lý thành công! Thu hoạch ${newCreatedItems.length} sản phẩm tương ứng với Đơn ${parsedOrderId || "Chưa có mã"}.`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi bất ngờ phát sinh từ máy chủ AI.", "error");
    } finally {
      setIsParsingText(false);
    }
  };

  // 6. CLIPBOARD & FILE SCREENSHOT PARSING
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        showToast("Đã tải ảnh lên! Hãy bấm nút 'Phân tích ảnh chụp màn hình' bên dưới.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct paste image setup
  const handleContainerPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setScreenshotPreview(reader.result as string);
            showToast("Đã dán ảnh từ Clipboard thành công! Bấm nút bên dưới để giải trình bằng AI.", "success");
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleParseScreenshotWithAI = async () => {
    if (!screenshotPreview) {
      showToast("Vui lòng dán hoặc tải tệp ảnh chụp màn hình lên trước!", "info");
      return;
    }

    setIsParsingScreenshot(true);
    showToast("Gemini Vision AI đang đọc ảnh chụp tin nhắn để tách đơn hàng phức tạp...", "info");

    try {
      const response = await fetch(`https://he-thong-gom-don-shopee.onrender.com/api/parse-screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: screenshotPreview }),
      });

      let resData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(textError.slice(0, 150) || "Phản hồi từ máy chủ không hợp lệ (HTML thay vì JSON).");
      }

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Không thể phân tích ảnh chụp.");
      }

      const { data } = resData;
      const parsedOrderId = data.orderId || "";
      const parsedItems = responseData.items || [];

setItems(parsedItems);

      if (parsedItems.length === 0) {
        showToast("AI không phát hiện được danh sách in nào từ hình ảnh này.", "error");
        return;
      }

      if (!orders.some(o => o.orderId === parsedOrderId)) {
        const newOrder: ShopeeOrder = {
          orderId: parsedOrderId,
          createdAt: new Date().toISOString(),
          status: "pending",
          notes: parsedOrderId ? `Bóc tách thông qua ảnh chụp màn hình Shopee Chat.` : `Bóc tách tự động ảnh chụp không mã`,
          itemCount: parsedItems.length,
        };
        setOrders(prev => [newOrder, ...prev]);
      }

      const newCreatedItems: OrderItem[] = parsedItems.map((pi: any, idx: number) => {
        const isSticker = pi.stickerModel && pi.stickerModel.trim() !== "";
        return {
          id: `item-ai-img-${Date.now()}-${idx}`,
          orderId: parsedOrderId,
          name: pi.name ? capitalizeProperName(pi.name) : "",
          school: isSticker ? "" : (pi.school ? capitalizeProperName(pi.school) : ""),
          class: isSticker ? "" : (pi.class || ""),
          schoolYear: isSticker ? "" : (pi.schoolYear || ""),
          labelModel: pi.labelModel || "",
          stickerModel: pi.stickerModel || "",
          model: pi.labelModel || pi.stickerModel || "",
          quantity: typeof pi.quantity === "number" ? pi.quantity : 1,
          notes: pi.notes || "",
          createdAt: new Date().toISOString(),
          confirmed: false, // designer completed flag: default "chưa làm"
          orderDate: data.orderDate || "",
        };
      });

      setItems(prev => [...newCreatedItems, ...prev]);

      // Google Sheets Auto Sync
      if (autoSyncSheets && appsScriptUrl) {
        syncItemsToSheets(newCreatedItems, true);
      }

      setScreenshotPreview(null);
      showToast(`AI đã xử lý hình ảnh thành công! Thêm ${newCreatedItems.length} sản phẩm in lên Đơn ${parsedOrderId}.`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gặp lỗi dịch vụ AI Vision.", "error");
    } finally {
      setIsParsingScreenshot(false);
    }
  };

  // --- FILTERED DATA PREPARATION ---
  const filteredItems = items.filter(it => {
    // 1. General Day filter
    const matchDate = selectedDateFilter === "all" || it.createdAt.startsWith(selectedDateFilter);
    
    // 2. Search textbox (Mã đơn hàng, Tên sản phẩm, trường, lớp, tên, năm học)
    const normalizedSearch = searchQuery.toLowerCase().trim();
    const matchSearch =
      !normalizedSearch ||
      it.orderId.toLowerCase().includes(normalizedSearch) ||
      it.name.toLowerCase().includes(normalizedSearch) ||
      it.school.toLowerCase().includes(normalizedSearch) ||
      it.class.toLowerCase().includes(normalizedSearch) ||
      (it.schoolYear && it.schoolYear.toLowerCase().includes(normalizedSearch)) ||
      it.model.toLowerCase().includes(normalizedSearch) ||
      (it.notes && it.notes.toLowerCase().includes(normalizedSearch));

    // 3. Selection model filter
    const matchModel =
      selectedModelFilter === "all" || it.model.toLowerCase() === selectedModelFilter.toLowerCase();

    return matchDate && matchSearch && matchModel;
  });

  // Extract variables for drop selections
  const uniqueModels = Array.from(new Set(items.map(it => it.model).filter(Boolean)));
  const uniqueSchools = Array.from(new Set(items.map(it => it.school).filter(Boolean)));

  // --- DAILY REPORT PROCESS (Page 1) ---
  const dailyOrdersCount = new Set(filteredItems.map(it => it.orderId)).size;
  const dailyTotalQty = filteredItems.reduce((acc, curr) => acc + curr.quantity, 0);
  
  // Design metrics calculation
  const dailyFinishedDesign = filteredItems.filter(it => it.confirmed).length;
  const dailyPendingDesign = filteredItems.length - dailyFinishedDesign;

  // Designs/models popularity map
  const modelUsageMap: { [key: string]: number } = {};
  filteredItems.forEach(it => {
    modelUsageMap[it.model] = (modelUsageMap[it.model] || 0) + it.quantity;
  });
  const modelUsageStats = Object.entries(modelUsageMap).sort((a, b) => b[1] - a[1]);

  // School analytics list map
  const schoolUsageMap: { [key: string]: { qty: number; lines: number } } = {};
  filteredItems.forEach(it => {
    const sName = it.school || "Không điền trường";
    if (!schoolUsageMap[sName]) {
      schoolUsageMap[sName] = { qty: 0, lines: 0 };
    }
    schoolUsageMap[sName].qty += it.quantity;
    schoolUsageMap[sName].lines += 1;
  });
  const schoolUsageStats = Object.entries(schoolUsageMap).sort((a, b) => b[1].qty - a[1].qty);

  // --- GOOGLE APPS SCRIPT COPY CODE ---
  const handleCopyScriptCode = () => {
    const code = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (Array.isArray(data)) {
    data.forEach(function(row) {
      sheet.appendRow([
        row.orderId,
        row.name,
        row.school,
        row.class,
        row.schoolYear,
        row.labelModel,
        row.stickerModel,
        row.quantity,
        row.notes,
        row.createdAt,
        row.status
      ]);
    });
  } else {
    sheet.appendRow([
      data.orderId,
      data.name,
      data.school,
      data.class,
      data.schoolYear,
      data.labelModel,
      data.stickerModel,
      data.quantity,
      data.notes,
      data.createdAt,
      data.status
    ]);
  }
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(code);
    showToast("Đã copy bộ mã Google Apps Script vào Clipboard!", "success");
  };

  // --- EXCEL & SPREADSHEET DOWNLOADING UTILITIES ---
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      showToast("Không có dữ liệu đơn hàng nào khớp với các bộ lọc hiện tại để xuất!", "error");
      return;
    }

    const headers = [
      "Mã đơn hàng",
      "Ngày đơn hàng",
      "Tên khách hàng/Tên in",
      "Trường học",
      "Lớp",
      "Năm học",
      "Mẫu nhãn vở",
      "Mẫu sticker",
      "Số lượng",
      "Thông tin yêu cầu/Ghi chú",
      "Ngày đồng bộ",
      "Trạng thái thiết kế"
    ];

    const rows = filteredItems.map(it => [
      `"${it.orderId.replace(/"/g, '""')}"`,
      `"${(it.orderDate || "").replace(/"/g, '""')}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${it.school.replace(/"/g, '""')}"`,
      `"${it.class.replace(/"/g, '""')}"`,
      `"${(it.schoolYear || "").replace(/"/g, '""')}"`,
      `"${(it.labelModel || "").replace(/"/g, '""')}"`,
      `"${(it.stickerModel || "").replace(/"/g, '""')}"`,
      it.quantity,
      `"${it.notes.replace(/"/g, '""')}"`,
      `"${new Date(it.createdAt).toLocaleDateString("vi-VN")}"`,
      `"${it.confirmed ? "Đã làm xong" : "Chờ thiết kế"}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const BOM = "\uFEFF"; // Fix Vietnamese accents in Microsoft Excel
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Naming according to date selection
    const dateLabel = selectedDateFilter === "all" ? "TatCaNgay" : selectedDateFilter;
    link.download = `Danh_Sach_In_Shopee_${dateLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải tệp Excel (.CSV) bảng kê chi tiết thành công!");
  };

  const handleCopyExcelClipboard = () => {
    if (filteredItems.length === 0) {
      showToast("Không có thông tin đơn hàng nào để sao chép!", "error");
      return;
    }

    const headers = [
      "Mã Đơn Shopee",
      "Ngày Đơn Hàng",
      "Họ Và Tên In",
      "Trường Học",
      "Lớp",
      "Năm Học",
      "Mẫu Nhãn Vở",
      "Mẫu Sticker",
      "Số Lượng",
      "Chi Tiết Ghi Chú",
      "Ngày Đồng Bộ",
      "Xác Nhận Thiết Kế"
    ];

    const rows = filteredItems.map(it => [
      it.orderId,
      it.orderDate || "",
      it.name,
      it.school,
      it.class,
      it.schoolYear || "",
      it.labelModel || "",
      it.stickerModel || "",
      it.quantity,
      it.notes,
      new Date(it.createdAt).toLocaleDateString("vi-VN"),
      it.confirmed ? "Đã làm xong" : "Chờ thiết kế"
    ]);

    const tsvContent = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");

    navigator.clipboard.writeText(tsvContent)
      .then(() => {
        showToast("Đã sao chép toàn bộ bảng! Hãy nhấn Ctrl+V trực tiếp vào Excel hoặc Google Sheets.", "success");
      })
      .catch(err => {
        console.error(err);
        showToast("Không hỗ trợ sao chép tự động trên trình duyệt này.", "error");
      });
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedModelFilter("all");
    setSelectedDateFilter("all");
    showToast("Đã thiết lập lại toàn bộ bộ lọc!", "info");
  };

  return (
    <div id="shopee-app-container" className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all" onPaste={handleContainerPaste}>
      {/* Toast Notification helper */}
      {toast && (
        <div
          id="shopee-toast-alert"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border transition-all duration-300 max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
          {toast.type === "info" && <Info className="h-5 w-5 text-indigo-600 shrink-0" />}
          <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0 ml-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modern Dashboard Header */}
      <header id="shopee-header" className="bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20 shadow-inner">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                  Hệ Thống Gom Đơn Shopee
                  <span className="bg-white/20 text-[10px] py-0.5 px-2 rounded-full font-mono tracking-wider font-bold">EXCEL PRO</span>
                </h1>
                <p className="text-orange-100 text-xs mt-0.5 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-200 inline" /> Trợ lý trích xuất đơn hàng thông minh bằng AI từ dán tin nhắn & ảnh chụp màn hình
                </p>
              </div>
            </div>

            {/* Micro summary cards */}
            <div className="flex items-center gap-2 sm:gap-4 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 text-xs font-mono select-none self-start md:self-auto">
              <div className="px-1">
                <span className="text-orange-200">Mã đơn:</span>{" "}
                <span className="text-white font-extrabold">{orders.length}</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="px-1">
                <span className="text-orange-200">Tổng sản phẩm:</span>{" "}
                <span className="text-white font-extrabold">
                  {items.reduce((acc, curr) => acc + curr.quantity, 0)} cái
                </span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="text-emerald-300 font-bold flex items-center gap-1.5 px-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span> Live AI
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main navigation tabs */}
      <nav id="shopee-nav" className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Custom Tab Selection for User specification */}
            <div className="flex -mb-px space-x-1 sm:space-x-4 py-2">
              <button
                id="shopee-tab-page1"
                onClick={() => setActiveTab("page1")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === "page1"
                    ? "bg-orange-50 text-orange-600 shadow-xs border border-orange-150"
                     : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                 }`}
               >
                 <Layers3 className="h-4 w-4 shrink-0" />
                 Trang 1: Thống Kê Doanh Số
               </button>

               <button
                 id="shopee-tab-page2"
                 onClick={() => setActiveTab("page2")}
                 className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                   activeTab === "page2"
                     ? "bg-orange-50 text-orange-600 shadow-xs border border-orange-155"
                     : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                 }`}
               >
                 <PlusCircle className="h-4 w-4 shrink-0" />
                 Trang 2: Nhập Thông Tin Đơn Hàng
               </button>

               <button
                 id="shopee-tab-page3"
                 onClick={() => setActiveTab("page3")}
                 className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                   activeTab === "page3"
                     ? "bg-orange-50 text-orange-600 shadow-xs border border-orange-155"
                     : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                 }`}
               >
                 <FileText className="h-4 w-4 shrink-0" />
                 Trang 3: Bảng Kê Chi Tiết Đơn Hàng
                 <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-extrabold ml-1 text-slate-500 font-mono">
                   {items.length}
                 </span>
               </button>
             </div>

            {/* Quick time picker for stats context */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs hidden sm:inline-block font-medium">Lọc xem theo ngày:</span>
              <select
                id="shopee-global-date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="all">Tất cả ngày đã gom</option>
                {uniqueDates.map(dateStr => (
                  <option key={dateStr} value={dateStr}>
                    Ngày: {new Date(dateStr).toLocaleDateString("vi-VN")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container Area */}
      <main id="shopee-workspace" className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 overflow-y-auto">
        
        {/* ======================================================== */}
        {/* TRANG 1: THỐNG KÊ & BÁO CÁO TRONG NGÀY (PAGE 1)          */}
        {/* ======================================================== */}
        {activeTab === "page1" && (
          <div id="view-reporting-day" className="space-y-6">
            
            {/* Day specific stats label */}
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 shadow-3xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-6">
                    Mốc Báo Cáo: {selectedDateFilter === "all" ? "Tổng Hợp Tất Cả Ngày" : `Ngày ${new Date(selectedDateFilter).toLocaleDateString("vi-VN")}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Số liệu đơn hàng, mẫu mã bán ra phục vụ thiết kế sản phẩm in.
                  </p>
                </div>
              </div>
              <div className="text-xs bg-white text-orange-600 border border-orange-200 font-bold py-1.5 px-3.5 rounded-xl shadow-3xs shrink-0 self-stretch sm:self-auto text-center">
                📊 Tổng gom: {dailyTotalQty} sản phẩm
              </div>
            </div>

            {/* Standard Metrics Bento Grid row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Orders Count */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số Đơn Hàng Shopee</div>
                  <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{dailyOrdersCount}</div>
                  <div className="text-[10px] text-slate-500">Mã đơn chứa tên in</div>
                </div>
              </div>

              {/* Card 2: Total Items Count */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số Khách/Chi Tiết</div>
                  <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{filteredItems.length}</div>
                  <div className="text-[10px] text-slate-500">Số dòng gom chi tiết</div>
                </div>
              </div>

              {/* Card 3: Completed Designs Checklist progress */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Kỹ Thuật Đã Làm Xong</div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {dailyFinishedDesign} <span className="text-xs text-slate-400 font-medium">/ {filteredItems.length}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Đạt: {filteredItems.length ? Math.round((dailyFinishedDesign / filteredItems.length) * 100) : 0}% tiến độ
                  </div>
                </div>
              </div>

              {/* Card 4: Remaining design files */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                  <RefreshCw className="h-5 w-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Còn Chờ Thiết Kế</div>
                  <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{dailyPendingDesign}</div>
                  <div className="text-[10px] text-rose-500 font-medium">Bản thảo in chưa hoàn thiện</div>
                </div>
              </div>
            </div>

            {/* Analysis breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Side: Popularity Statistics per models and designs */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <h3 className="text-sm font-bold text-slate-800">Thống Kê Số Lượng Bán Theo Mẫu Mã (Sản phẩm)</h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Sắp xếp: Cao ➜ Thấp</span>
                </div>

                {modelUsageStats.length === 0 ? (
                  <div className="p-12 text-center text-slate-405 italic text-slate-400 text-xs">
                    Chưa có thiết kế nào bán ra vào ngày đã chọn.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modelUsageStats.map(([modelName, count], idx) => {
                      const pct = Math.round((count / Math.max(1, dailyTotalQty)) * 100);
                      return (
                        <div key={modelName} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                              <span className="text-slate-400 font-mono w-4">#{idx+1}</span>
                              {modelName}
                            </span>
                            <span className="font-mono font-bold text-slate-600">
                              {count} sản phẩm <span className="text-slate-400">({pct}%)</span>
                            </span>
                          </div>
                          {/* Rich progress bar */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Side: Group statistics by Schools and Custom classes in orders */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    <h3 className="text-sm font-bold text-slate-800">Báo Cáo Gom Nhóm Đặt Hàng Theo Trường</h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Trường học của phụ huynh</span>
                </div>

                {schoolUsageStats.length === 0 ? (
                  <div className="p-12 text-center text-slate-405 italic text-slate-400 text-xs">
                    Chưa có thống kê trường học nào phù hợp.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {schoolUsageStats.map(([schoolName, stats]) => (
                      <div
                        key={schoolName}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                            <School className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-800 truncate">{schoolName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 font-medium font-mono shrink-0">
                          <div>
                            Số học sinh: <span className="text-slate-800 font-bold">{stats.lines}</span>
                          </div>
                          <div className="h-3 w-px bg-slate-200"></div>
                          <div>
                            Số lượng: <span className="text-orange-600 font-extrabold">{stats.qty} cái</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Dynamic Export Excel of the Day Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                <FileSpreadsheet className="h-40 w-40 text-white" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <h3 className="text-base font-black flex items-center gap-2 text-orange-400 uppercase tracking-wider">
                    <FileSpreadsheet className="h-5 w-5" /> Tập Hợp & Xuất Excel Cho Ngày Này
                  </h3>
                  <p className="text-slate-350 text-xs leading-relaxed max-w-xl">
                    Hệ thống sẽ gom toàn bộ {filteredItems.length} chi tiết in tên, trường học, mẫu sản phẩm bán ra của ngày gom đã chọn để đóng thành một tệp Excel duy nhất. Sẵn sàng chuyển giao cho kỹ thuật đóng khối hoặc in lụa!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    id="btn-stats-copy"
                    onClick={handleCopyExcelClipboard}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    <Clipboard className="h-4 w-4 text-orange-400" /> Sao chép bảng (Ctrl+V vào Excel)
                  </button>

                  <button
                    id="btn-stats-download"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-white" /> Xuất Excel (.CSV) Ngày Này
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TRANG 2: BẢNG KÊ CHI TIẾT & GOM ĐƠN HÀNG (PAGE 2)         */}
        {/* ======================================================== */}
        {activeTab === "page2" && (
          <div id="view-order-details" className="space-y-6">
            
            {/* AI HARVESTING AND MANUAL CREATION CONTROL CENTRE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs p-5 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500" /> 
                    Bảng Thu Thập Thông Tin Đơn Hàng (AI & Thủ Công)
                  </h3>
                  <p className="text-slate-500 text-[11px]">Chọn cách thức thuận tiện nhất để thu hoạch thông tin đơn hàng của bạn</p>
                </div>

                {/* Sub choices buttons */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveParserTab("text")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeParserTab === "text" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Dán tin nhắn Chat
                  </button>
                  <button
                    onClick={() => setActiveParserTab("screenshot")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeParserTab === "screenshot" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Ảnh chụp màn hình 📸
                  </button>
                </div>
              </div>

              {/* Sub tab content: TEXT PARSING */}
              {activeParserTab === "text" && (
                <div className="space-y-3">
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Hãy sao chép các tin nhắn chat thương lượng với khách trên Shopee chat (hoặc dán danh sách khách order thủ công gửi qua chat) dán trực tiếp vào ô bên dưới. Gemini AI sẽ tự động tách mã vận đơn, mẫu, tên, lớp, trường học cho bạn.
                  </p>

                  <textarea
                    id="ai-pasted-chat-box"
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Ví dụ dán: 
Mã đơn: 260608SHP_NHAN_VO
Bé Trần Hoàng Nam, Trường Tiểu học Kim Đồng, Lớp 1A3, mẫu nhãn vở Siêu Nhân Nhện, Số lượng 2 bộ nha shop.
Còn bé Nguyễn Thuỳ Lâm cùng lớp thì lấy mẫu Công Chúa Elsa, dán nhãn bóng sl 3 bộ."
                    className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 h-28 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none transition-all placeholder:text-slate-400 leading-relaxed"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAiText(`Bế lẻ decal sticker chống nước cho bé:
Bé Lê Mỹ Chi, trường Mầm non Tuổi Thơ, Lớp Chồi 1, năm học 2026-2027 đặt mua:
- 2 bộ sticker dán bình nước Mẫu Thỏ Hồng siêu dễ thương nha shop ơi.
Mã đơn Shopee là 260608SHP_STICKERS_VIP`);
                        showToast("Đã dán dữ liệu mẫu!", "info");
                      }}
                      className="text-orange-600 hover:text-orange-700 text-xs font-bold hover:underline"
                    >
                      Sử dụng đoạn chat mẫu 💡
                    </button>

                    <button
                      onClick={handleParseWithAI}
                      disabled={isParsingText || !aiText.trim()}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-3xs transition-all ${
                        isParsingText || !aiText.trim() ? "bg-slate-300 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 cursor-pointer active:scale-95"
                      }`}
                    >
                      {isParsingText ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Đang đọc bóc tách...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Bóc tách & Thêm bằng AI ✨
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Sub tab content: IMAGE/SCREENSHOT PARSING */}
              {activeParserTab === "screenshot" && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex gap-2.5 items-start text-amber-900 text-xs">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                    <div>
                      <p className="font-bold">Tính năng Độc quyền bằng AI Vision:</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                        Khách chụp ảnh màn hình hoặc gửi ảnh danh sách in thêu viết tay? 
                        Bạn chỉ cần <strong>Sao chép bức ảnh đó (Ctrl+C)</strong> rồi nhấp vào trang này và nhấn <strong>Ctrl+V</strong> để dán trực tiếp! Hoặc chọn tải tệp ảnh từ điện thoại/máy tính của bạn lên.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Visual drag drop & paste box target */}
                    <div className="md:col-span-7">
                      <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl h-36 bg-slate-50 hover:bg-slate-100 hover:border-orange-400 transition-all cursor-pointer group text-center px-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                        <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-orange-500 mb-2 transition-colors" />
                        <span className="text-xs font-bold text-slate-700">Dán ảnh (Ctrl+V) hoặc Chọn tệp ảnh tải lên</span>
                        <span className="text-[10px] text-slate-400 mt-1">Hỗ trợ PNG, JPG, JPEG từ ảnh chụp tin nhắn, ảnh viết tay</span>
                      </label>
                    </div>

                    {/* Screenshot Preview */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-100 rounded-2xl border border-slate-200 p-2.5 h-36 relative overflow-hidden">
                      {screenshotPreview ? (
                        <>
                          <img
                            src={screenshotPreview}
                            alt="Screenshot Preview"
                            className="h-full w-full object-contain rounded-xl"
                          />
                          <button
                            onClick={() => setScreenshotPreview(null)}
                            className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-950 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-slate-400 text-[11px] flex flex-col items-center">
                          <HelpCircle className="h-6 w-6 text-slate-300 mb-1" />
                          <span>Chưa có ảnh chụp</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {screenshotPreview && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleParseScreenshotWithAI}
                        disabled={isParsingScreenshot}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md transition-all ${
                          isParsingScreenshot ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer active:scale-95"
                        }`}
                      >
                        {isParsingScreenshot ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Đang xử lý ảnh Vision AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-yellow-300" />
                            Gom đơn từ ảnh chụp bằng AI ✨
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* Extra button selection for manual form dropdown toggles */}
              <div className="flex flex-wrap items-center gap-3 pt-2 justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingManualItem(!isAddingManualItem)}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    {isAddingManualItem ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {isAddingManualItem ? "Đóng form thủ công" : "Tự viết/Nhập thủ công ✍️"}
                  </button>

                  <button
                    onClick={() => setIsAddingOrderCode(!isAddingOrderCode)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 border-l border-slate-200 pl-3.5"
                  >
                    {isAddingOrderCode ? <X className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                    {isAddingOrderCode ? "Đóng form mã đơn" : "Tạo mã đơn trước 📦"}
                  </button>
                </div>

                {isAddingOrderCode && (
                  <form onSubmit={handleAddOrderCode} className="w-full bg-slate-55 rounded-xl p-3.5 border border-slate-200 max-w-lg mt-3 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-grow space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Mã đơn Shopee</label>
                      <input
                        type="text"
                        value={newOrderId}
                        onChange={(e) => setNewOrderId(e.target.value.replace(/\s+/g, ""))}
                        placeholder="Ví dụ: 260608SHP_ALOP"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div className="flex-grow space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Mô tả/Nhãn</label>
                      <input
                        type="text"
                        value={newOrderNotes}
                        onChange={(e) => setNewOrderNotes(e.target.value)}
                        placeholder="Ví dụ: Đơn Chu Văn An 12A1"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-1.5 px-4 rounded-lg block cursor-pointer transition-all self-stretch sm:self-auto text-center"
                    >
                      Lưu mã
                    </button>
                  </form>
                )}

                {/* Sub manual single item insertion form */}
                {isAddingManualItem && (
                  <form onSubmit={handleAddNewItem} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    
                    {/* Link Shopee Id option */}
                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Chọn mã đơn *</label>
                      <select
                        value={newItemOrderId}
                        onChange={(e) => setNewItemOrderId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      >
                        <option value="">-- Chọn mã --</option>
                        {orders.map(o => (
                          <option key={o.orderId} value={o.orderId}>{o.orderId}</option>
                        ))}
                        <option value={`NEW_${Date.now().toString().slice(-4)}`}>+ Tạo mới</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Tên khách/học sinh *</label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nhập họ tên"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Trường học</label>
                      <input
                        type="text"
                        value={newItemSchool}
                        onChange={(e) => setNewItemSchool(e.target.value)}
                        placeholder="Ví dụ: TH Chu Văn An"
                        disabled={newItemStickerModel.trim() !== ""}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    <div className="sm:col-span-1 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Lớp</label>
                      <input
                        type="text"
                        value={newItemClass}
                        onChange={(e) => setNewItemClass(e.target.value)}
                        placeholder="Lớp"
                        disabled={newItemStickerModel.trim() !== ""}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    <div className="sm:col-span-1 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Năm học</label>
                      <input
                        type="text"
                        value={newItemSchoolYear}
                        onChange={(e) => setNewItemSchoolYear(e.target.value)}
                        placeholder="25-26"
                        disabled={newItemStickerModel.trim() !== ""}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Mẫu nhãn vở</label>
                      <input
                        type="text"
                        value={newItemLabelModel}
                        onChange={(e) => setNewItemLabelModel(e.target.value)}
                        placeholder="Nhãn Elsa..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Mẫu sticker</label>
                      <input
                        type="text"
                        value={newItemStickerModel}
                        onChange={(e) => setNewItemStickerModel(e.target.value)}
                        placeholder="Siêu nhân..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-1 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">SL</label>
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 outline-none text-center focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Ngày Đơn Hàng</label>
                      <input
                        type="text"
                        value={newItemOrderDate}
                        onChange={(e) => setNewItemOrderDate(e.target.value)}
                        placeholder="Ví dụ: 08/06/2026"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-5 space-y-0.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Chi tiết ghi chú in ấn</label>
                      <input
                        type="text"
                        value={newItemNotes}
                        onChange={(e) => setNewItemNotes(e.target.value)}
                        placeholder="Ví dụ: Mực in sắc nét, cắt demi bế tròn, decal nhám dễ viết bút"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Designer completion status preset */}
                    <div className="sm:col-span-3 flex items-center gap-2 pt-5">
                      <input
                        id="newItemState"
                        type="checkbox"
                        checked={newItemConfirmed}
                        onChange={(e) => setNewItemConfirmed(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <label htmlFor="newItemState" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Thiết kế: Đã làm xong ✓
                      </label>
                    </div>

                    <div className="sm:col-span-12 flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingManualItem(false)}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs"
                      >
                        Xác nhận thêm dòng
                      </button>
                    </div>
                  </form>
                )}

              </div>

            </div>

            {/* Shopee Code master status listing panels */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Quản Lý Các Mã Đơn Hàng Hoạt Động ({orders.length})</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Trạng thái đóng gói và phân phối tổng của từng mã Shopee</p>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 py-0.5 px-2.5 rounded-lg border border-orange-100 font-mono">
                  Total: {orders.length}
                </span>
              </div>

              {orders.length === 0 ? (
                <p className="p-4 text-center text-slate-400 text-xs italic">Không có mã Shopee nào chủ quản.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map(ord => (
                    <div
                      key={ord.orderId}
                      className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 bg-slate-50/40 hover:border-slate-350 hover:bg-white transition-all shadow-3xs"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">ID:</span>
                          <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded tracking-wide font-mono truncate select-all">{ord.orderId}</span>
                          
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            ord.status === "completed"
                              ? "bg-emerald-55 bg-emerald-100 text-emerald-800"
                              : ord.status === "processing"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {ord.status === "completed" ? "Đã Giao / Đóng Gói" : ord.status === "processing" ? "Đang xử lý thiết kế" : "Đang Gom Khách"}
                          </span>
                        </div>
                        <p className="text-slate-650 text-[11px] leading-relaxed line-clamp-2">
                          <span className="font-bold text-slate-450 text-slate-500">Mô tả:</span> {ord.notes || "(Không ghi chú)"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="font-mono">
                          {new Date(ord.createdAt).toLocaleDateString("vi-VN")}
                        </span>

                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value as any)}
                            className="bg-white border border-slate-205 rounded px-2 py-0.5 outline-none font-bold text-slate-705 text-slate-700 cursor-pointer"
                          >
                            <option value="pending">Đang gom</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="completed">Đóng gói</option>
                          </select>

                          <button
                            onClick={() => handleDeleteOrder(ord.orderId)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TRANG 3: THỐNG KÊ & BẢNG KÊ CHI TIẾT ĐƠN HÀNG (PAGE 3)   */}
        {/* ======================================================== */}
        {activeTab === "page3" && (
          <div id="view-order-details-table" className="space-y-6">

            {/* Quick statistics section at the top of Page 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Orders Count */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số Đơn Hàng Shopee</div>
                  <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{dailyOrdersCount}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Mã đơn chứa tên in</div>
                </div>
              </div>

              {/* Card 2: Total Items Count */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tổng sản phẩm gom</div>
                  <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{dailyTotalQty}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Số lượng sản xuất thực tế</div>
                </div>
              </div>

              {/* Card 3: Completed Designs Checklist progress */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Đã làm thiết kế</div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {dailyFinishedDesign} <span className="text-xs text-slate-400 font-medium">/ {items.length}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Đạt: {items.length ? Math.round((dailyFinishedDesign / items.length) * 100) : 0}% tiến độ
                  </div>
                </div>
              </div>

              {/* Card 4: Remaining Designs */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Chờ làm thiết kế</div>
                  <div className="text-2xl font-black text-amber-800 font-mono mt-0.5">{dailyPendingDesign}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Cần thiết kế thêm</div>
                </div>
              </div>
            </div>

            {/* GOOGLE SHEETS CONTROL CENTER IN TRANG 3 WITH INTEGRAL INSTRUCTIONS */}
            <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-3xs p-5 space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 text-emerald-600 bg-emerald-50 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex flex-wrap items-center gap-1.5 leading-tight">
                      Đồng Bộ Dữ Liệu Google Sheets
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${appsScriptUrl ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200 animate-pulse"}`}>
                        ● {appsScriptUrl ? "Đã liên kết" : "Chờ thiết lập"}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Đơn hàng dán sau khi nhập tự động ghi nhận trực tiếp vào tệp Google Spreadsheet</p>
                  </div>
                </div>

                {/* Main sheets quick tools */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-center items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-3.5 rounded-xl transition-all active:scale-95 text-center shrink-0"
                    title="Mở tệp Google Sheets liên kết"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Mở Google Sheet
                  </a>
                  
                  <button
                    onClick={() => {
                      const unsynced = items.filter(it => !it.syncedToSheets);
                      syncItemsToSheets(unsynced);
                    }}
                    disabled={isSyncingSheets || items.filter(it => !it.syncedToSheets).length === 0}
                    className={`flex justify-center items-center gap-1.5 text-xs font-bold py-1.5 px-4 rounded-xl transition-all active:scale-95 shadow-3xs cursor-pointer ${
                      items.filter(it => !it.syncedToSheets).length > 0 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    }`}
                  >
                    {isSyncingSheets ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" />
                    )}
                    Đồng bộ ngay ({items.filter(it => !it.syncedToSheets).length} đơn mới)
                  </button>

                  <button
                    onClick={() => setShowSheetsConfigHelp(!showSheetsConfigHelp)}
                    className="flex justify-center items-center p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl border border-slate-200 transition-all bg-white cursor-pointer"
                    title="Hướng dẫn liên kết Google Sheets"
                  >
                    <HelpCircle className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Status and Configuration settings section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-0.5">
                
                {/* Visual Connection block */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đường dẫn Google Sheet (URL)</label>
                      <input
                        type="text"
                        value={sheetUrl}
                        onChange={(e) => handleSheetUrlChange(e.target.value)}
                        placeholder="Dán link Google Sheet..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-755 font-mono outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:border-emerald-300"
                      />
                      <div className="text-[10px] text-slate-400 mt-1 font-mono font-medium truncate">
                        ID: <span className="font-semibold text-slate-500">{spreadsheetId}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Địa chỉ Apps Script Web App (URL)</label>
                      <input
                        type="text"
                        value={appsScriptUrl}
                        onChange={(e) => handleAppsScriptUrlChange(e.target.value)}
                        placeholder="Dán URL Web App của Apps Script..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-755 font-mono outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:border-emerald-300"
                      />
                    </div>
                  </div>

                  {/* Settings togglers checklist */}
                  <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                      <input
                        type="checkbox"
                        checked={autoSyncSheets}
                        onChange={(e) => setAutoSyncSheets(e.target.checked)}
                        className="h-4 w-4 border border-slate-300 text-emerald-600 focus:ring-emerald-500 rounded accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-slate-600">
                        Tự động ghi đơn mới sau khi nhập / quét AI cùng lúc
                      </span>
                    </label>

                    <div className="text-slate-500 font-medium">
                      Đã ghi nhận sang Sheets: <strong className="text-emerald-700">{items.filter(it => it.syncedToSheets).length}</strong> / <strong>{items.length}</strong> sản phẩm in
                    </div>
                  </div>
                </div>

                {/* Instruction tips block */}
                <div className="lg:col-span-4 bg-slate-50/50 border border-slate-150 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                      <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      Quy trình truyền tin:
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Hệ thống đồng bộ trực tiếp các cột cấu trúc đơn hàng sang Google Sheets (Mã đơn, Tên bé, Trường lớp, Mẫu dán, Số lượng, Ghi chú và mốc thời gian) khi có phát sinh.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={handleCopyScriptCode}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-250 rounded-lg font-bold text-[10px] text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clipboard className="h-3 w-3 text-emerald-600" />
                      Nhận Mã Apps Script Để Dán 📋
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible installation help directions */}
              {showSheetsConfigHelp && (
                <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-5 text-slate-700 text-xs space-y-3.5 mt-2 transition-all">
                  <div className="flex items-center justify-between border-b border-amber-200/30 pb-2">
                    <h4 className="font-black text-amber-800 flex items-center gap-1.5 text-sm">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      Hướng dẫn 3 bước kết nối Google Sheet thành công 100%
                    </h4>
                    <button
                      onClick={() => setShowSheetsConfigHelp(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800">1️⃣ Mở Apps Script trên Sheet</div>
                      <p className="text-slate-500 text-[11px]">
                        Tại trang Google Sheet liên kết, vào menu <strong>Tiện ích mở rộng (Extensions)</strong> → chọn <strong>Apps Script</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-800">2️⃣ Dán mã tiếp nhận</div>
                      <p className="text-slate-500 text-[11px]">
                        Xóa sạch toàn bộ code hiện tại bên trong, bấm nút <strong>Nhận Mã Apps Script Để Dán 📋</strong> bên cạnh rồi paste đè toàn bộ vào file. Lưu lại.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-800">3️⃣ Triển khai (Deploy) làm Web App</div>
                      <p className="text-slate-550 text-slate-500 text-[11px]">
                        Chọn <strong>Triển khai</strong> → <strong>Triển khai mới</strong>. Chọn kiểu <strong>Ứng dụng web (Web App)</strong>. Cấu hình thực thi dưới tư cách <strong>Tôi (Me)</strong>, Cho phép truy cập <strong>Bất kỳ ai (Anyone)</strong>. copy lấy URL sau khi triển khai dán vào ô bên trái!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INTEGRATED DATAGRID AND FILTER UTILITIES */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs p-5 space-y-4">
              
              {/* Table search & selection filter bar row */}
              <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                
                {/* Search Textbox input & Filters parameters group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:max-w-xl">
                  {/* 1. Global Keyword text search */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-505 uppercase text-slate-500">Tìm Kiếm Trên Bảng</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm tên, trường, lớp, năm học..."
                        className="w-full text-xs text-slate-700 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* 2. Model Filter dropdown */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-505 uppercase text-slate-500">Lọc Theo Mẫu Mã</label>
                    <select
                      value={selectedModelFilter}
                      onChange={(e) => setSelectedModelFilter(e.target.value)}
                      className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer"
                    >
                      <option value="all">--- Tất cả mẫu mã ---</option>
                      {uniqueModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Combined Export Excel/CSV triggers */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  {(searchQuery || selectedModelFilter !== "all" || selectedDateFilter !== "all") && (
                    <button
                      onClick={resetAllFilters}
                      className="text-orange-600 hover:text-orange-850 font-bold text-xs hover:underline mr-2"
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}

                  <button
                    onClick={handleCopyExcelClipboard}
                    className="flex justify-center items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 py-2 px-3 rounded-xl transition-all active:scale-95 cursor-pointer bg-white"
                    title="Sao chép dưới dạng bảng dữ liệu để dán bằng Ctrl+V thẳng vào Excel"
                  >
                    <Clipboard className="h-4 w-4 text-orange-600" />
                    Sao chép Excel
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex justify-center items-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 py-2 px-3.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-3xs"
                    title="Sao chép dưới dạng bảng dữ liệu tảii tệp .csv tối ưu Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-white" />
                    Xuất File Excel (.CSV)
                  </button>
                </div>

              </div>

              {/* Table Data list view */}
              <div className="bg-white rounded-2xl border border-slate-250/70 overflow-hidden shadow-3xs">
                
                <div className="overflow-x-auto min-w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 font-mono">
                        <th className="py-3.5 px-4 w-[140px]">Mã Đơn Shopee</th>
                        <th className="py-3.5 px-4 w-[120px]">Ngày Đơn</th>
                        <th className="py-3.5 px-4">Tên In Yêu Cầu</th>
                        <th className="py-3.5 px-4">Trường Học</th>
                        <th className="py-3.5 px-4 w-[85px]">Lớp</th>
                        <th className="py-3.5 px-4 w-[100px]">Năm Học</th>
                        <th className="py-3.5 px-4 w-[140px]">Mẫu Nhãn Vở</th>
                        <th className="py-3.5 px-4 w-[140px]">Mẫu Sticker</th>
                        <th className="py-3.5 px-4 text-center w-[80px]">Số Lượng</th>
                        <th className="py-3.5 px-4">Ghi Chú</th>
                        <th className="py-3.5 px-4 text-center w-[120px]">Đã thiết kế</th>
                        <th className="py-3.5 px-4 text-center w-[90px]">Lên Sheets</th>
                        <th className="py-3.5 px-4 text-right w-[90px]">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-12 text-center text-slate-400">
                            <AlertCircle className="h-7 w-7 mx-auto text-slate-300 mb-2" />
                            Không có kết quả đơn in nào tương thích với bộ lọc / tìm kiếm hiện hành.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((it) => {
                          const isEditing = edittedItemId === it.id;

                          if (isEditing) {
                            return (
                              <tr key={it.id} className="bg-orange-50/20 divide-x divide-slate-200/50">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                                  {it.orderId || <span className="text-slate-300 italic">(Trống)</span>}
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemOrderDate}
                                    onChange={(e) => setEditItemOrderDate(e.target.value)}
                                    placeholder="08/06/2026"
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemName}
                                    onChange={(e) => setEditItemName(e.target.value)}
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemSchool}
                                    onChange={(e) => setEditItemSchool(e.target.value)}
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemClass}
                                    onChange={(e) => setEditItemClass(e.target.value)}
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemSchoolYear}
                                    onChange={(e) => setEditItemSchoolYear(e.target.value)}
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemLabelModel}
                                    onChange={(e) => setEditItemLabelModel(e.target.value)}
                                    placeholder="Nhãn vở"
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemStickerModel}
                                    onChange={(e) => setEditItemStickerModel(e.target.value)}
                                    placeholder="Sticker"
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={editItemQty}
                                    onChange={(e) => setEditItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 bg-white border border-orange-300 rounded text-center py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    value={editItemNotes}
                                    onChange={(e) => setEditItemNotes(e.target.value)}
                                    className="w-full bg-white border border-orange-300 rounded px-2 py-1 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-400">
                                  -
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-400">
                                  -
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => handleSaveEditItem(it.id)}
                                      className="p-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-0.5 transition-all"
                                    >
                                      Lưu
                                    </button>
                                    <button
                                      onClick={() => setEdittedItemId(null)}
                                      className="p-1 px-2.5 rounded bg-slate-205 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-all font-medium"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={it.id} className="hover:bg-slate-50/40 transition-colors">
                              {/* OrderID */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px] select-all">
                                {it.orderId || <span className="text-slate-305 italic">Trống</span>}
                              </td>

                              {/* OrderDate */}
                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px] font-bold">
                                {it.orderDate ? (
                                  <span className="flex items-center gap-1 shrink-0">
                                    <Calendar className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                    {it.orderDate}
                                  </span>
                                ) : (
                                  <span className="text-slate-350 italic">—</span>
                                )}
                              </td>

                              {/* Student Name */}
                              <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {it.name || <span className="text-slate-305 italic">Trống</span>}
                              </td>

                              {/* School */}
                              <td className="py-3 px-4 text-slate-600">
                                {it.school ? (
                                  <span className="flex items-center gap-1 shrink-0">
                                    <School className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                    {it.school}
                                  </span>
                                ) : (
                                  <span className="text-slate-350 italic">—</span>
                                )}
                              </td>

                              {/* Class */}
                              <td className="py-3 px-4 text-slate-600 font-bold font-mono">
                                {it.class || <span className="text-slate-350 italic">—</span>}
                              </td>

                              {/* School Year */}
                              <td className="py-3 px-4 text-slate-600 font-medium font-mono">
                                {it.schoolYear || <span className="text-slate-350 italic">—</span>}
                              </td>

                              {/* Label Model */}
                              <td className="py-3 px-4">
                                {it.labelModel ? (
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-md font-bold text-[11px] whitespace-nowrap">
                                    {it.labelModel}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic">—</span>
                                )}
                              </td>

                              {/* Sticker Model */}
                              <td className="py-3 px-4">
                                {it.stickerModel ? (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-105 px-2 py-0.5 rounded-md font-bold text-[11px] whitespace-nowrap">
                                    {it.stickerModel}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic">—</span>
                                )}
                              </td>

                              {/* Qty count */}
                              <td className="py-3 px-4 text-center font-extrabold text-slate-900 font-mono text-sm">
                                {it.quantity}
                              </td>

                              {/* Specific custom notes */}
                              <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={it.notes}>
                                {it.notes || <span className="text-slate-300">Không ghi chú</span>}
                              </td>

                              {/* Designer Status Checkbox column */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={it.confirmed}
                                    onChange={() => handleToggleConfirmItem(it.id)}
                                    className="h-5 w-5 text-emerald-600 bg-white border border-slate-300 rounded focus:ring-emerald-555 focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-all accent-emerald-600"
                                    title="Tích chọn nếu đã làm xong thiết kế cho sản phẩm này"
                                  />
                                </div>
                              </td>

                              {/* Google Sheets Sync status column */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center">
                                  {it.syncedToSheets ? (
                                    <span 
                                      className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                      title="Đã đồng bộ lên Google Sheets 🟢"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => syncItemsToSheets([it])}
                                      disabled={isSyncingSheets}
                                      className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer"
                                      title="Đẩy dòng này lên Google Sheets"
                                    >
                                      <UploadCloud className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Action items editing */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStartEditItem(it)}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-650 hover:bg-slate-100 transition-colors"
                                    title="Sửa nhanh dòng này"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(it.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Xóa dòng này"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredItems.length > 0 && (
                  <div className="bg-slate-50/50 p-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-xs gap-3 font-medium">
                    <div className="text-slate-600">
                      Đang hiển thị <strong>{filteredItems.length} sản phẩm chi tiết</strong>.
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-600 font-bold">Mẹo hay:</span>
                      <span>Nhấn "Sao chép Excel" rồi dán cực nhanh (Ctrl+V) thẳng vào file Excel của bạn là xong!</span>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Dynamic branding system footer */}
      <footer id="shopee-footer" className="bg-slate-900 text-slate-400 py-6 text-xs border-t border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                Hệ Thống Gom Đơn Shopee & Thiết Kế Nhãn Vở, Sticker Cho Bé v2.5
              </div>
              <p className="text-slate-500 text-[11px]">
                Hỗ trợ đắc lực các shop in ấn nhãn vở học sinh, nhãn dán đồ dùng mầm non, sticker chống nước cho bé trên Shopee bóc tách thông tin in (tên, trường, lớp) tự động từ tin nhắn chat & ảnh chụp màn hình.
              </p>
            </div>
            
            <div className="text-left md:text-right text-[11px] text-slate-500 font-mono space-y-0.5">
              <div>Phát triển bằng AI Studio & Vertex AI Gemini Multimodal 💡</div>
              <div>Bảo mật dữ liệu an toàn lưu trữ cục bộ LocalStorage</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Delete Confirmation Modals */}
      {deleteOrderConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Xác nhận xóa mã đơn?</h3>
                <p className="text-xs text-rose-500 font-bold font-mono">Mã số: {deleteOrderConfirmId}</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa mã đơn hàng này cùng toàn bộ các sản phẩm chi tiết của bé (tên, trường, lớp, năm học...) đi kèm không? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteOrderConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItemConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Xác nhận xóa dòng này?</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa dòng chi tiết sản phẩm này không? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteItemConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
