export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chỉnh sửa",
  robots: { index: false, follow: false },
};

/** Khung chung cho cả khu chỉnh sửa. Việc chặn truy cập nằm ở (editor)/layout.tsx. */
export default function CustomizeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="bg-deep text-cream min-h-svh">{children}</div>;
}
