import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/utils/supabase/server"
import { getServiceById } from "@/lib/services"

interface Props {
    params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const t = await getTranslations("Dashboard")
    return { title: `${t("editService")}: ${id}` }
}

export default async function EditServicePage({ params }: Props) {
    const { id, locale } = await params
    const t = await getTranslations("Dashboard")

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${locale}/login`)
    }

    const service = await getServiceById(id)

    if (!service) {
        notFound()
    }


    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {t("editService")}
                </h1>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {service.name}
                </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-neutral-900/5 sm:rounded-xl p-8">
                {/* We need a client component to wrap the action for the form if we want to pass it as a prop */}
                <EditServiceClientWrapper service={service} id={id} locale={locale} />
            </div>
        </div>
    )
}

// Client wrapper to handle the transition from server to client form
import EditServiceClientWrapper from "./EditServiceClientWrapper"
