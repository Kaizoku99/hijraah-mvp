

import { z } from 'zod'

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Custom error class for actions
 */
export class ActionError extends Error {
    constructor(message: string, public code?: string) {
        super(message)
        this.name = 'ActionError'
    }
}

// Re-export User type for convenience
export type { User } from '@/../drizzle/schema'
