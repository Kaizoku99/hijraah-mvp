'use server'

import { getAuthenticatedUser } from './auth'
import { getUserUsageStats } from '@/../server/usage'
import { getSubscriptionStatus } from '@/../server/stripe'

/**
 * Get current user's usage statistics
 */
export async function getUsageStats() {
    const user = await getAuthenticatedUser()
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    return getUserUsageStats(user.id, subscriptionStatus?.tier || 'free')
}
