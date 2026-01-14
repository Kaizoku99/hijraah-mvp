import { generateObject } from 'ai'
import { google } from '@/server/_core/gemini'
import { z } from 'zod'

const ProfileExtractionSchema = z.object({
    name: z.string().optional().describe("The user's full name"),
    nationality: z.string().optional().describe("The user's nationality or citizenship"),
    currentCountry: z.string().optional().describe("The country where the user currently lives"),
    sourceCountry: z.string().optional().describe("The country the user is from (if different from nationality)"),
    education: z.string().optional().describe("The user's educational background or degree"),
    workExperience: z.string().optional().describe("The user's work experience or job title"),
})

export type ExtractedProfile = z.infer<typeof ProfileExtractionSchema>

export async function extractProfileData(
    message: string,
    currentProfile: {
        name?: string | null
        nationality?: string | null
        currentCountry?: string | null
        sourceCountry?: string | null
        education?: string | null
        workExperience?: string | null
    }
) {
    // Filter out fields that are already known to avoid redundancy/overwriting with partial data
    // However, for simplicity, we'll extract everything and filter in the logic, 
    // or we can prompt the AI to only look for missing ones if we want to save tokens/confusion.
    // For now, let's extract what we find and merge carefully.

    try {
        const { object } = await generateObject({
            model: google('gemini-1.5-flash'),
            schema: ProfileExtractionSchema,
            prompt: `Analyze the following chat message from a user. Extract any personal information they mention matching the schema.
      
      User Message: "${message}"
      
      Only extract information that is EXPLICITLY stated. Do not guess or infer.
      If the user says "I am an engineer", extracted workExperience should be "Engineer".
      If the user says "My name is Abdul", extracted name should be "Abdul".
      
      Current known info (do not extract if it contradicts this unless explicitly corrected, but prefer new info if it adds detail):
      ${JSON.stringify(currentProfile)}
      `,
        })

        return object
    } catch (error) {
        console.error('Profile extraction failed:', error)
        return null
    }
}
