import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role for admin access if RLS is strict

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('Missing VAPID keys in .env');
    process.exit(1);
}

webpush.setVapidDetails(
    'mailto:jeremy@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY);

async function sendTestNotification() {
    console.log('📢 Sending test notification...');

    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*');

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions.`);

    const notificationPayload = JSON.stringify({
        title: 'Test Notification',
        body: 'This is a test message from the KCC Admin Console.',
        icon: '/icon-192x192.png',
        url: '/dashboard'
    });

    for (const sub of subscriptions || []) {
        try {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            await webpush.sendNotification(pushConfig, notificationPayload);
            console.log(`✅ Sent to ${sub.endpoint.slice(0, 20)}...`);
        } catch (err) {
            console.error(`❌ Failed to send to ${sub.endpoint.slice(0, 20)}...`, err);
        }
    }
}

sendTestNotification();
