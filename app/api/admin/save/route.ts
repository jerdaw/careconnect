import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Admin access disabled in production' }, { status: 403 });
    }

    try {
        const { service } = await req.json();
        if (!service || !service.id) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const dataPath = path.join(process.cwd(), 'data', 'services.json');
        const fileContents = await fs.readFile(dataPath, 'utf8');
        const services = JSON.parse(fileContents);

        // Update or Add
        const index = services.findIndex((s: { id: string }) => s.id === service.id);
        if (index > -1) {
            services[index] = service;
        } else {
            services.push(service);
        }

        // Write back
        await fs.writeFile(dataPath, JSON.stringify(services, null, 2));

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
