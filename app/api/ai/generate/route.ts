import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increase timeout if possible (Vercel specific but good documentation)

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ result: "Unauthorized" }, { status: 401 });
        }

        const { prompt, type } = await request.json();
        const apiKey = process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ result: "Error: No API Key configured." }, { status: 500 });
        }

        let systemPrompt = "You are a helpful assistant for a retail inventory system.";
        let userMessage = "";

        if (type === 'description') {
            systemPrompt = "You are an expert copywriter for e-commerce. You write short, persuasive, and SEO-friendly product descriptions in Spanish. Keep it under 50 words. Focus on benefits and features.";
            userMessage = `Write a description for a product named: "${prompt}".`;
        } else if (type === 'category') {
            // Recovering lost category logic just in case, though standard uses it.
            systemPrompt = "You are an inventory categorization assistant. user will give a product name, you respond ONLY with the most appropriate general category name (one or two words max) in Spanish. Examples: Electrónica, Ropa, Hogar, Alimentos, Herramientas. Do not add punctuation or extra text.";
            userMessage = `Categorize this product: "${prompt}".`;
        } else if (type === 'image') {
            systemPrompt = "You are a creative prompt engineer. The user will provide a product name in Spanish. You must translate it to English and enhance it slightly to make a beautiful, clean, photorealistic product photography prompt. Keep it under 15 words. Do not add quotes.";
            userMessage = `Create an image prompt for: "${prompt}".`;
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 200,
                temperature: 0.2
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Perplexity API Error:", data);
            throw new Error(data.error?.message || "API Request Failed");
        }

        let result = data.choices[0].message.content.trim().replace(/^"|"$/g, '');

        if (type === 'image') {
            console.log("Generating image with prompt:", result);
            if (result.includes("Sorry") || result.includes("lo siento")) {
                throw new Error("AI refused to generate prompt");
            }

            // Clean prompt for safer URL
            const cleanPrompt = result.replace(/[^a-zA-Z0-9 ,.-]/g, '').substring(0, 300);
            const encodedPrompt = encodeURIComponent(cleanPrompt);
            const seed = Math.floor(Math.random() * 10000);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${seed}&model=flux`;

            console.log("Fetching URL:", imageUrl);

            const imageRes = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log("Image Fetch Status:", imageRes.status);

            if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);

            const arrayBuffer = await imageRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            result = `data:image/jpeg;base64,${base64}`;
            console.log("Image processed, base64 length:", result.length);
        }

        return NextResponse.json({ result });

    } catch (error: any) {
        console.error("AI Generation Failed Detailed:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate', stack: error.toString() }, { status: 500 });
    }
}
