import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text } = await request.json();
        const apiKey = process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        const systemPrompt = `
        You are an Order Parser API. 
        Your job is to convert Natural Language orders into a structured JSON list.
        
        INPUT: "Dame dos cocas, una pizza y 3 aguas"
        OUTPUT: 
        [
            { "quantity": 2, "product": "coca" },
            { "quantity": 1, "product": "pizza" },
            { "quantity": 3, "product": "agua" }
        ]

        RULES:
        - Return ONLY raw JSON. No markdown. No explanations.
        - If quantity is missing ("una coca"), assume 1.
        - Normalize product names to simple keywords.
        - If the input is not related to ordering ("Hola", "Qué hora es"), return [].
        `;

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
                    { role: "user", content: text }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message);

        let content = data.choices[0].message.content;

        // Clean markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const items = JSON.parse(content);
        return NextResponse.json({ items });

    } catch (error: any) {
        console.error("Parse Order Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
