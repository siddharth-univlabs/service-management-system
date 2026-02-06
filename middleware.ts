import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_PREFIX = "/admin";
const MANAGER_PREFIX = "/manager";
const ENGINEER_PREFIX = "/engineer";

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  };
};

async function fetchRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/login") {
    if (!user) {
      return response;
    }

    const role = await fetchRole(supabase, user.id);
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "REGIONAL_MANAGER") {
      return NextResponse.redirect(new URL("/manager/dashboard", request.url));
    }
    if (role === "FIELD_ENGINEER") {
      return NextResponse.redirect(new URL("/engineer/dashboard", request.url));
    }

    return response;
  }

  if (
    !pathname.startsWith(ADMIN_PREFIX) &&
    !pathname.startsWith(MANAGER_PREFIX) &&
    !pathname.startsWith(ENGINEER_PREFIX)
  ) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = await fetchRole(supabase, user.id);

  if (pathname.startsWith(ADMIN_PREFIX) && role !== "ADMIN") {
    if (role === "REGIONAL_MANAGER") {
      return NextResponse.redirect(new URL("/manager/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/engineer/dashboard", request.url));
  }

  if (pathname.startsWith(MANAGER_PREFIX) && role !== "REGIONAL_MANAGER") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/engineer/dashboard", request.url));
  }

  if (pathname.startsWith(ENGINEER_PREFIX) && role !== "FIELD_ENGINEER") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/engineer/:path*", "/login"],
};
