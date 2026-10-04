# HUIT INTERNSHIP MANAGEMENT SYSTEM - PROJECT CONTEXT & RULES

## 1. Công nghệ & Kiến trúc
- **Framework**: Next.js 15+ (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS v4 (Cấu hình màu tại `src/app/globals.css`: `--color-huit-blue: #003366`, `--color-huit-red: #E51B24`).
- **Icons**: `@phosphor-icons/react`.
- **Database (Tương lai)**: Supabase PostgreSQL. Hiện tại đang ở giai đoạn **Mock Data (Frontend Prototype)**.
- **Kiến trúc thư mục**: Feature-driven Architecture:
  - `src/components/modals/`: Modal độc lập (Approve, Assign, Grading, Diary...).
  - `src/features/`: auth, registration, advisor-assignment, evaluation, export-report (mỗi feature gồm `components/`, `hooks/`, `services/`, `types.ts`).
  - `src/views/`: student/, lecturer/, admin/, shared/.
  - `src/shared/`: ui/ (EmptyState, StatusBadge...), api/ (supabaseClient.ts).
  - `src/data/`: mockData.ts.
  - `src/types/`: database.types.ts.

## 2. Quy tắc Phân quyền (RBAC) & Đăng nhập Auto-Detect
- Đăng nhập qua 1 form duy nhất, không dùng tab role:
  - Email chứa MSSV (`*@st.huit.edu.vn`) -> Role `SinhVien`.
  - Email `admin.cntt@huit.edu.vn` -> Role `QuanTriVien` (Khoa).
  - Email giảng viên (`*@huit.edu.vn`):
    - Cờ `coQuyenToChuc === true`: Được hiển thị menu "Tổ chức đợt thực tập".
    - Cờ `coQuyenToChuc === false`: Ẩn menu "Tổ chức đợt", NHƯNG VẪN CÓ QUYỀN "Xuất bảng điểm".

## 3. Quy trình Nghiệp vụ Cốt lõi
- **Sinh viên (2 Bước Đăng ký)**:
  - Bước 1: Kê khai cá nhân (`HoSoThucTap`) gồm GPA, CV (PDF), Ngoại ngữ, CVHT, Địa chỉ, 2 cam kết -> Lưu trạng thái `DaDangKy`, mở khóa Bước 2.
  - Bước 2: Khai báo công ty (`DangKyThucTap`) gồm Nguồn (nếu 'GvGioiThieu' thì nhập tên GV), MST, Tên Cty, Địa chỉ, Vị trí, Mentor (Tên, SĐT, Email) -> Chuyển trạng thái sang `ChoPheDuyet`.
- **Khoa (Admin)**:
  - Duyệt hồ sơ: Xem gộp Form 1 (GPA/CV) và Form 2 (Cty/MST) trước khi bấm Duyệt.
  - Phân công GVHD: Lọc theo 5 chuyên ngành HUIT, chặn quá tải nếu 1 giảng viên > 30 sinh viên/đợt.
- **Giảng viên**: Theo dõi nhật ký tuần, duyệt báo cáo (Đạt chuẩn/Làm lại), chấm điểm Rubric (DN max 5.0 + GV max 5.0 = Hệ 10), xuất bảng điểm Excel/PDF.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
