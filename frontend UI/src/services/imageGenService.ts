/**
 * Gemini Image Generation Service
 * =================================
 * Calls the Gemini REST API directly from the browser.
 *
 * Models (from official docs, April 2026):
 *   - gemini-2.5-flash-image     → Nano Banana (speed, most reliable free tier)
 *   - gemini-3.1-flash-image-preview → Nano Banana 2 (high-efficiency)
 *   - gemini-3-pro-image-preview → Nano Banana Pro (highest quality)
 *
 * Endpoint: generativelanguage.googleapis.com/v1beta
 * Method: generateContent (auth via x-goog-api-key header)
 *
 * Fallback chain:
 *   1. gemini-2.5-flash-image (default, free tier friendly)
 *   2. gemini-3.1-flash-image-preview (newer)
 *   3. Pollinations.ai (free, no key needed)
 */

const GEMINI_MODELS = [
    'gemini-2.5-flash-image',             // Most reliable free-tier model
    'gemini-3.1-flash-image-preview',     // Nano Banana 2
] as const

export type ImageEngine =
    | 'auto'
    | 'gemini-2.5-flash-image'
    | 'gemini-3.1-flash-image-preview'
    | 'gemini-3-pro-image-preview'
    | 'pollinations-flux'
    | 'pollinations-flux-realism'

export interface ImageGenResult {
    success: boolean
    imageUrl: string | null
    engine: string
    promptUsed: string
    error: string | null
}

// ─── Gemini Direct Call ──────────────────────────────────────────────────────

async function generateWithGemini(
    prompt: string,
    model: string,
    apiKey: string
): Promise<ImageGenResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

    const body = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
        }
    }

    console.log(`🎨 Gemini image gen → model: ${model}`)

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData?.error?.message || `HTTP ${res.status}`
        console.warn(`❌ Gemini ${model} failed: ${errMsg}`)
        throw new Error(errMsg)
    }

    const data = await res.json()

    // Extract image from response parts
    const parts = data?.candidates?.[0]?.content?.parts || []
    let imageBase64: string | null = null
    let mimeType = 'image/png'

    for (const part of parts) {
        if (part.inlineData) {
            imageBase64 = part.inlineData.data
            mimeType = part.inlineData.mimeType || 'image/png'
        }
    }

    if (!imageBase64) {
        throw new Error('No image in response — model returned text only')
    }

    const imageUrl = `data:${mimeType};base64,${imageBase64}`

    console.log(`✅ Gemini image generated via ${model}`)
    return {
        success: true,
        imageUrl,
        engine: model,
        promptUsed: prompt,
        error: null,
    }
}

// ─── Pollinations Fallback ───────────────────────────────────────────────────
// Pollinations returns images directly at a URL.
// Using <img> src directly avoids CORS issues (fetch fails with 403 from browser).

function generateWithPollinations(
    prompt: string,
    modelId: string = 'flux'
): ImageGenResult {
    const modelName = modelId === 'flux-realism' ? 'flux-realism' : 'flux'

    // Build the direct image URL (no need to fetch — use as img src)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=${modelName}&seed=${Date.now()}`

    console.log(`🌐 Pollinations image gen → model: ${modelName}`)
    console.log(`✅ Pollinations URL generated (direct link)`)

    return {
        success: true,
        imageUrl: url,
        engine: `pollinations-${modelId}`,
        promptUsed: prompt,
        error: null,
    }
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export async function generateImage(
    prompt: string,
    style: string = 'holographic',
    engine: ImageEngine = 'auto'
): Promise<ImageGenResult> {
    // Enhance prompt with style modifier
    const styledPrompt = buildStyledPrompt(prompt, style)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    // Direct engine selection (non-auto)
    if (engine.startsWith('pollinations-')) {
        const modelId = engine.replace('pollinations-', '')
        return generateWithPollinations(styledPrompt, modelId)
    }

    if (engine.startsWith('gemini-') && apiKey) {
        return generateWithGemini(styledPrompt, engine, apiKey)
    }

    // ─── Auto Mode: Gemini first, then Pollinations fallback ─────────────
    if (apiKey) {
        for (const model of GEMINI_MODELS) {
            try {
                return await generateWithGemini(styledPrompt, model, apiKey)
            } catch (err) {
                console.warn(`Gemini ${model} failed, trying next...`, (err as Error).message)
            }
        }
    }

    // All Gemini models failed → Pollinations fallback (always works)
    console.log('⚠️ All Gemini models failed — falling back to Pollinations')
    return generateWithPollinations(styledPrompt, 'flux')
}

// ─── Style Prompt Builder ────────────────────────────────────────────────────

function buildStyledPrompt(prompt: string, style: string): string {
    const styleModifiers: Record<string, string> = {
        holographic: 'Render in holographic blue neon wireframe style, glowing edges on dark background, sci-fi HUD aesthetic',
        blueprint: 'Technical blueprint style, white lines on deep blue background, engineering schematic with measurements and annotations',
        wireframe: 'Clean 3D wireframe render, minimal white lines on black, futuristic technical visualization',
        realistic: 'Photorealistic 3D render, studio lighting, high detail, 8K quality',
        concept: 'Digital concept art style, dramatic lighting, cinematic composition, artstation quality',
    }

    const modifier = styleModifiers[style] || ''
    return modifier ? `${prompt}. ${modifier}` : prompt
}
