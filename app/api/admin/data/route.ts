import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Admin access disabled in production' }, { status: 403 });
    }

    try {
        const dataPath = path.join(process.cwd(), 'data', 'services.json');
        const fileContents = await fs.readFile(dataPath, 'utf8');
        const services = JSON.parse(fileContents);
        return NextResponse.json({ services });
    } catch {
        return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }
}
