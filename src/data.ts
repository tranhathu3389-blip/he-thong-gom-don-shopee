import { OrderItem, ShopeeOrder } from "./types";

export const INITIAL_SHOPEE_ORDERS: ShopeeOrder[] = [
  {
    orderId: "260608SHP0982X",
    createdAt: "2026-06-08T07:15:00Z",
    status: "processing",
    notes: "Đơn gom in nhãn vở elsa & doraemon cho học sinh tiểu học",
    itemCount: 4,
  },
  {
    orderId: "260607SHP1123Y",
    createdAt: "2026-06-07T14:30:00Z",
    status: "completed",
    notes: "Sticker chống nước dán đồ dùng cho bé mầm non",
    itemCount: 3,
  },
  {
    orderId: "260606SHP8761A",
    createdAt: "2026-06-06T09:45:00Z",
    status: "pending",
    notes: "Nhãn tập học sinh trung học mẫu phong cách tối giản",
    itemCount: 2,
  },
];

export const INITIAL_ORDER_ITEMS: OrderItem[] = [
  // Order 260608SHP0982X (Chu Văn An - 12A1)
  {
    id: "item-1",
    orderId: "260608SHP0982X",
    name: "Nguyễn Hoàng Nam",
    school: "Tiểu học Chu Văn An",
    class: "1A1",
    schoolYear: "2026-2027",
    labelModel: "Nhãn Vở Siêu Nhân Nhện",
    stickerModel: "",
    quantity: 2,
    notes: "Bộ 12 nhãn vở chống nước",
    createdAt: "2026-06-08T07:15:00Z",
  },
  {
    id: "item-2",
    orderId: "260608SHP0982X",
    name: "Trần Minh Thư",
    school: "Tiểu học Chu Văn An",
    class: "1A1",
    schoolYear: "2026-2027",
    labelModel: "Nhãn Vở Công Chúa Elsa",
    stickerModel: "",
    quantity: 2,
    notes: "Mực in sắc nét nổi bật",
    createdAt: "2026-06-08T07:17:00Z",
  },
  {
    id: "item-3",
    orderId: "260608SHP0982X",
    name: "Phạm Thành Đạt",
    school: "", // Sticker empty school
    class: "",  // Sticker empty class
    schoolYear: "", // Sticker empty schoolYear
    labelModel: "",
    stickerModel: "Sticker Dán Bình Nước Khủng Long",
    quantity: 1,
    notes: "In thêm tên Đạt siêu nhân ở góc dưới",
    createdAt: "2026-06-08T07:18:00Z",
  },

  // Order 260607SHP1123Y (Phan Đình Phùng - Lớp 7B)
  {
    id: "item-4",
    orderId: "260607SHP1123Y",
    name: "Lê Quỳnh Chi",
    school: "", // Sticker empty school
    class: "",  // Sticker empty class
    schoolYear: "", // Sticker empty schoolYear
    labelModel: "",
    stickerModel: "Sticker Dán Sách Vở Thỏ Hồng",
    quantity: 3,
    notes: "Cắt sẵn bế demi tròn cho bé tự bóc",
    createdAt: "2026-06-07T14:30:00Z",
  },
  {
    id: "item-5",
    orderId: "260607SHP1123Y",
    name: "Đỗ Mạnh Hùng",
    school: "", // Sticker empty school
    class: "",  // Sticker empty class
    schoolYear: "", // Sticker empty schoolYear
    labelModel: "",
    stickerModel: "Sticker Dán Quần Áo Ủi Nhiệt",
    quantity: 1,
    notes: "Nền màu xanh dương đậm",
    createdAt: "2026-06-07T14:32:00Z",
  },
  {
    id: "item-6",
    orderId: "260607SHP1123Y",
    name: "Vũ Khánh Linh",
    school: "Tiểu học Kim Đồng",
    class: "3C",
    schoolYear: "2026-2027",
    labelModel: "Nhãn Vở Mèo máy Doraemon",
    stickerModel: "",
    quantity: 2,
    notes: "In bằng decal bóng cao cấp",
    createdAt: "2026-06-07T14:33:00Z",
  },

  // Order 260606SHP8761A (9C)
  {
    id: "item-7",
    orderId: "260606SHP8761A",
    name: "Phan Văn Đức",
    school: "", // Sticker empty school
    class: "",  // Sticker empty class
    schoolYear: "", // Sticker empty schoolYear
    labelModel: "",
    stickerModel: "Sticker Mẫu Vũ Trụ Phi Thuyền",
    quantity: 5,
    notes: "Chống nước tuyệt đối dán bình đựng nước",
    createdAt: "2026-06-06T09:45:00Z",
  },
  {
    id: "item-8",
    orderId: "260606SHP8761A",
    name: "Nguyễn Mai Anh",
    school: "THCS Trưng Vương",
    class: "6C",
    schoolYear: "2026-2027",
    labelModel: "Nhãn Tập Học Sinh Minimalist",
    stickerModel: "",
    quantity: 3,
    notes: "In giấy decal nhám để dễ viết bút mực",
    createdAt: "2026-06-06T09:46:00Z",
  },
];
