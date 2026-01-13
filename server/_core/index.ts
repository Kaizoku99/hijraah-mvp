// Server exports for Next.js API routes
// The Express server (express-server.ts.bak) is no longer needed with Next.js

export { appRouter, type AppRouter } from "../routers";
export { createContext, type TrpcContext as Context } from "./context";
export { streamChatResponse, type Language, type ChatMessage } from "./ai";
export { getAuthUser, getAuthUserFromExpressRequest, createSupabaseServerClient as createServerSupabase } from "./supabase";
export { handleWebhookEvent } from "../stripe";
