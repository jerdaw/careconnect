import { Service } from '../types/service';

/**
 * Generates a mailto link for reporting issues with a specific service.
 * Pre-fills the subject and body with service details to assist moderation.
 */
export function generateFeedbackLink(service: Service): string {
    const recipient = "feedback@kingstoncare.ca";
    const subject = encodeURIComponent(`Correction: ${service.name} (ID: ${service.id})`);

    // Construct a helpful body template
    const bodyText = `Hi, I noticed an issue with this service:

[ ] Wrong Phone Number
[ ] Wrong Address
[ ] Service Closed
[ ] Other (Please describe below)

Additional Details:


--------------------------------
Service ID: ${service.id}
Source: Kingston Care Connect
--------------------------------`;

    const body = encodeURIComponent(bodyText);

    return `mailto:${recipient}?subject=${subject}&body=${body}`;
}
