
import { NextResponse } from 'next/server';
import OpenAI from 'openai';


export async function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });


    try {
        const body = await req.json() as { query?: string };
        const { query } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
            encoding_format: "float",
        });

        const firstResult = response.data[0];
        if (!firstResult) {
            return NextResponse.json({ error: 'No embedding returned' }, { status: 500 });
        }
        const embedding = firstResult.embedding;

        return NextResponse.json({ embedding });
    } catch (error) {
        console.error('Error generating embedding:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
