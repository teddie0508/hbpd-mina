export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chỉnh sửa",
  robots: { index: false, follow: false },
};

/** Khung chung cho cả khu chỉnh sửa. Việc chặn truy cập nằm ở (editor)/layout.tsx. */
export default function CustomizeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // `customize-root`: móc cho luật chống Safari tự phóng to ở globals.css.
  return (
    <div className="customize-root bg-deep text-cream min-h-svh">
      {children}
    </div>
  );
}
