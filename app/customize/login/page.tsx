import { redirect } from "next/navigation";

import { LoginForm } from "@/components/customize/LoginForm";
import { authConfigured, isEditor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Đã đăng nhập rồi thì khỏi bắt nhập lại.
  if (await isEditor()) redirect("/customize");

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <LoginForm
        configured={authConfigured() || process.env.NODE_ENV !== "production"}
      />
    </main>
  );
}
