import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();
        const apiKey = process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ role: 'assistant', content: "Error: No API Key found in .env.local" });
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: messages,
                temperature: 0.1
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message);

        return NextResponse.json({
            role: 'assistant',
            content: data.choices[0].message.content
        });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({
            role: 'assistant',
            content: `Lo siento, tuve un error: ${error.message}`
        });
    }
}
