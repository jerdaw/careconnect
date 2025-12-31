'use client';

import { Service } from "@/types/service";
import EditServiceForm from "@/components/EditServiceForm";
import { updateServiceAction } from "@/lib/actions/services";
import { ServiceFormData } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface Props {
    service: Service;
    id: string;
    locale: string;
}

export default function EditServiceClientWrapper({ service, id, locale }: Props) {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (data: ServiceFormData) => {
        const result = await updateServiceAction(id, data, locale);

        if (result.success) {
            toast({
                title: "Success",
                description: "Service updated successfully.",
            });
            router.push(`/${locale}/dashboard/services/${id}`);
        } else {
            throw new Error(result.error || "Failed to update service.");
        }
    };

    return <EditServiceForm service={service} onSubmit={handleSubmit} />;
}
