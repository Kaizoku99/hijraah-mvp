import type { User } from "../../drizzle/schema";
import { getAuthUserFromRequest } from "./supabase";
import * as db from "../db";
import { NextRequest } from "next/server";

export type TrpcContext = {
  req: NextRequest;
  res?: Response;
  user: User | null;
};

type CreateContextOptions = {
  req: NextRequest;
  res?: Response;
};

export async function createContext(
  opts: CreateContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get Supabase auth user from Next.js request
    const supabaseUser = await getAuthUserFromRequest(opts.req);
    
    if (supabaseUser) {
      // Get or create database user
      const dbUser = await db.getOrCreateUserByAuthId(supabaseUser.id, {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      });
      
      if (dbUser) {
        user = dbUser;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
