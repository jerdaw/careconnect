
/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline, env } from '@xenova/transformers';

// Skip local check for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class OptimizePipeline {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance(progress_callback: (data: any) => void) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { action, text } = event.data;

    if (action === 'init') {
        // Just pre-load the model
        try {
            await OptimizePipeline.getInstance((data: any) => {
                self.postMessage({ status: 'progress', data });
            });
            self.postMessage({ status: 'ready' });
        } catch (error) {
            self.postMessage({ status: 'error', error });
        }
        return;
    }

    if (action === 'embed') {
        const pipe = await OptimizePipeline.getInstance(() => { });
        const output = await pipe(text, { pooling: 'mean', normalize: true });

        // Convert Tensor to standard array
        const embedding = Array.from(output.data);

        self.postMessage({ status: 'complete', embedding, text });
        return;
    }
});
