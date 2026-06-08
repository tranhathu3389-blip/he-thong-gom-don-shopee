export interface OrderItem {
  id: string; // Unique ID for local tracking
  orderId: string; // Shopee Order Code
  name: string; // Customer name / Student name
  school: string; // School name
  class: string; // Class name
  schoolYear: string; // School Year (e.g. 2025-2026)
  model?: string; // Legacy field for backward compatibility
  labelModel: string; // Mẫu nhãn vở
  stickerModel: string; // Mẫu sticker
  quantity: number; // Order count
  notes: string; // Remarks / Customize specs
  createdAt: string; // Iso date string
  confirmed?: boolean; // Whether details are verified
  syncedToSheets?: boolean; // Track if synced to Google Sheets
  orderDate?: string; // Date of Shopee order/chat parsed by AI or manual input
}

export interface ShopeeOrder {
  orderId: string; // Shopee Order Code
  createdAt: string; // Date added
  status: "pending" | "processing" | "completed"; // Order fulfillment status
  notes: string; // Direct notes from Shopee order
  itemCount: number; // Cache count
}
