import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "echale-admin-session";

function expectedPassword() {
  return process.env.ADMIN_PASSWORD ?? "echale-demo-admin";
}

function sessionToken() {
  return createHash("sha256")
    .update(expectedPassword())
    .update(process.env.ADMIN_SESSION_SALT ?? "echale")
    .digest("hex");
}

export async function signInAdmin(password: string) {
  if (password !== expectedPassword()) {
    return { ok: false as const, error: "Contraseña incorrecta" };
  }

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return { ok: true as const };
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value === sessionToken();
}

export async function requireAdminAuth() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }
}
