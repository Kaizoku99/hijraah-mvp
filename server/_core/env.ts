export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// New env object with Supabase support
export const env = {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  
  // Database (Supabase PostgreSQL connection string)
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  
  // Google AI
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  
  // Storage (Supabase Storage or Forge)
  FORGE_API_URL: process.env.BUILT_IN_FORGE_API_URL ?? "",
  FORGE_API_KEY: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  
  // App
  NODE_ENV: process.env.NODE_ENV ?? "development",
  APP_URL: process.env.APP_URL ?? "http://localhost:5173",
};
