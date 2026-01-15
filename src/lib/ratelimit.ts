import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis.
     *
     * @default "@upstash/ratelimit"
     */
    prefix: "@upstash/ratelimit",
});

export type RateLimitResult = {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
};

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    return {
        success,
        limit,
        remaining,
        reset
    };
}
