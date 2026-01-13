'use server'

import { z } from 'zod'
import { getAuthenticatedUser } from './auth'
import { SUBSCRIPTION_TIERS } from '@/../server/stripe-products'
import {
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    getPaymentHistory,
} from '@/../server/stripe'

// Schemas
const CreateCheckoutSchema = z.object({
    tierId: z.enum(['essential', 'premium', 'vip']),
})

export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>

/**
 * Get available subscription tiers (public)
 */
export async function getSubscriptionTiers() {
    return Object.values(SUBSCRIPTION_TIERS)
}

/**
 * Get current user's subscription status
 */
export async function getStatus() {
    const user = await getAuthenticatedUser()
    return getSubscriptionStatus(user.id)
}

/**
 * Create checkout session for subscription
 */
export async function createCheckout(input: CreateCheckoutInput) {
    const user = await getAuthenticatedUser()
    const validated = CreateCheckoutSchema.parse(input)

    const baseUrl = process.env.APP_URL || 'http://localhost:5173'

    return createCheckoutSession({
        userId: user.id,
        userEmail: user.email || '',
        tierId: validated.tierId,
        successUrl: `${baseUrl}/dashboard?payment=success`,
        cancelUrl: `${baseUrl}/pricing?payment=canceled`,
    })
}

/**
 * Create customer portal session for managing subscription
 */
export async function createPortal() {
    const user = await getAuthenticatedUser()

    const baseUrl = process.env.APP_URL || 'http://localhost:5173'

    return createPortalSession({
        userId: user.id,
        returnUrl: `${baseUrl}/dashboard`,
    })
}

/**
 * Get payment history (invoices)
 */
export async function getInvoices() {
    const user = await getAuthenticatedUser()
    return getPaymentHistory(user.id)
}
