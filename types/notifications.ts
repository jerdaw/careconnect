export type NotificationCategory = "crisis" | "food" | "housing" | "health" | "general"

export interface PushSubscriptionKeys {
    p256dh: string
    auth: string
}

export interface PushSubscription {
    id: string
    endpoint: string
    keys: PushSubscriptionKeys
    categories: NotificationCategory[]
    locale: "en" | "fr"
    created_at: string
}

export interface NotificationPayload {
    title: string
    body: string
    icon?: string
    url?: string
    category: NotificationCategory
    urgency: "high" | "normal" | "low"
}
