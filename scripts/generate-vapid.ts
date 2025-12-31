import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n✅ VAPID Keys Generated successfully!\n');
console.log('Copy these into your .env file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);
console.log('Run this command to save them automatically (if .env exists):');
console.log(`echo "\\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}" >> .env\n`);
