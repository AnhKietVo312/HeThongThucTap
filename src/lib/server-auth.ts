import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { UserSession, VaiTro } from "@/types/database.types";

const COOKIE_NAME = "huit_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function signingKey(): string {
  const key =
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing server session signing secret");
  return key;
}

function sign(value: string): string {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

export function createSessionResponse(session: UserSession): NextResponse {
  const encoded = Buffer.from(
    JSON.stringify({
      session,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
  ).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  const response = NextResponse.json({ success: true, session });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function getSession(request: Request): UserSession | null {
  const rawCookie = request.headers.get("cookie") || "";
  const token = rawCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;
  const [encoded, providedSignature] = token.split(".");
  if (!encoded || !providedSignature) return null;
  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(providedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as { session?: UserSession; exp?: number };
    if (
      !payload.session ||
      !payload.exp ||
      payload.exp < Math.floor(Date.now() / 1000)
    )
      return null;
    return payload.session;
  } catch {
    return null;
  }
}

export function requireSession(request: Request): UserSession | NextResponse {
  const session = getSession(request);
  return (
    session ||
    NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 })
  );
}

export function requireRoles(
  request: Request,
  roles: VaiTro[],
): UserSession | NextResponse {
  const session = getSession(request);
  if (!session)
    return NextResponse.json(
      { error: "Vui lòng đăng nhập lại." },
      { status: 401 },
    );
  if (!roles.includes(session.role))
    return NextResponse.json(
      { error: "Bạn không có quyền thực hiện thao tác này." },
      { status: 403 },
    );
  return session;
}

export function isAuthError(
  value: UserSession | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}

export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
