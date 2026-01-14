import { describe, it, expect, beforeAll } from 'vitest'
import { addMemory, searchMemory } from './memory'
import { v4 as uuidv4 } from 'uuid'

// Skip tests if required envs are missing (for CI/CD safety)
const hasEnv = process.env.SUPABASE_URL && process.env.GOOGLE_GENERATIVE_AI_API_KEY

describe.runIf(hasEnv)('Memory Service Integration', () => {
    // Unique user ID for isolation
    const TEST_USER_ID = `test-user-${uuidv4()}`
    const FACT = 'My CRS score is 999'

    it('should add a memory and retrieve it via search', async () => {
        // 1. Add Memory
        console.log(`Adding memory for ${TEST_USER_ID}...`)
        await addMemory(
            [
                { role: 'user', content: FACT },
                { role: 'assistant', content: 'Understood, I have noted your score.' },
            ],
            TEST_USER_ID
        )

        // Wait for eventual consistency (Mem0/Vector store might take a moment)
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // 2. Search Memory
        console.log(`Searching memory for ${TEST_USER_ID}...`)
        const results = await searchMemory('What is my CRS score?', TEST_USER_ID)

        console.log('Search Results:', results)

        // 3. Assert
        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBeGreaterThan(0)

        // Check if the extracted fact or original text is present
        // Mem0 usually extracts "User's CRS score is 999" or returns the raw chunk
        const joinedMemory = results.map((r: any) => r.memory).join(' ')
        expect(joinedMemory).toContain('999')
    }, 20000) // 20s timeout
})
