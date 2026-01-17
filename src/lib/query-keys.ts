/**
 * Query Key Factory for React Query
 *
 * This file provides a centralized place to define and manage query keys,
 * ensuring consistency across the application and making it easier to
 * invalidate related queries.
 *
 * Usage:
 * - Import the specific key factory you need
 * - Use the factory methods to generate consistent query keys
 *
 * Example:
 * const { data } = useQuery({
 *   queryKey: queryKeys.profile.detail(),
 *   queryFn: getProfile,
 * });
 *
 * // Invalidate all profile-related queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
 */

export const queryKeys = {
  // Authentication
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },



  // CRS / Points Calculator
  crs: {
    all: ["crs"] as const,
    latest: () => [...queryKeys.crs.all, "latest"] as const,
    history: () => [...queryKeys.crs.all, "history"] as const,
  },

  // Documents
  documents: {
    all: ["documents"] as const,
    list: () => [...queryKeys.documents.all, "list"] as const,
    checklists: () => [...queryKeys.documents.all, "checklists"] as const,
    detail: (id: number | string) =>
      [...queryKeys.documents.all, "detail", id] as const,
  },

  // SOP (Statement of Purpose)
  sop: {
    all: ["sop"] as const,
    list: () => [...queryKeys.sop.all, "list"] as const,
    detail: (id: number | string) =>
      [...queryKeys.sop.all, "detail", id] as const,
  },

  // Chat / Conversations
  chat: {
    all: ["chat"] as const,
    list: () => [...queryKeys.chat.all, "list"] as const,
    detail: (id: number | null) => [...queryKeys.chat.all, "detail", id] as const,
  },

  // Guides
  guides: {
    all: ["guides"] as const,
    list: (category?: string | null) =>
      category
        ? ([...queryKeys.guides.all, "list", category] as const)
        : ([...queryKeys.guides.all, "list"] as const),
    categories: () => [...queryKeys.guides.all, "categories"] as const,
    search: (query: string) =>
      [...queryKeys.guides.all, "search", query] as const,
    detail: (slug: string) =>
      [...queryKeys.guides.all, "detail", slug] as const,
    byId: (id: number | string) =>
      [...queryKeys.guides.all, "byId", id] as const,
    admin: (page: number) => [...queryKeys.guides.all, "admin", page] as const,
  },

  // Subscription
  subscription: {
    all: ["subscription"] as const,
    status: () => [...queryKeys.subscription.all, "status"] as const,
    invoices: () => [...queryKeys.subscription.all, "invoices"] as const,
  },

  // Usage Stats
  usage: {
    all: ["usage"] as const,
    stats: () => [...queryKeys.usage.all, "stats"] as const,
  },

  // Portugal Assessment
  portugal: {
    all: ["portugal"] as const,
    assessments: () => [...queryKeys.portugal.all, "assessments"] as const,
  },

  // User (generic user-related queries)
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
  },
} as const;

// Type helpers for better type inference
export type QueryKeys = typeof queryKeys;
