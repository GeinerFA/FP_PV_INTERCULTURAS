import type { NextRequest } from "next/server";

import { proxy as srcProxy } from "./src/proxy";

export function proxy(request: NextRequest) {
  return srcProxy(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
