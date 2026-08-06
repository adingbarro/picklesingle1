import { prisma } from "@/lib/prisma";
import GeneralSettingsForm from "@/components/admin/GeneralSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminGeneralPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <GeneralSettingsForm
      initial={{
        companyName: settings?.companyName ?? "Baseline Pickleball Club",
        tagline: settings?.tagline ?? "",
        address: settings?.address ?? "",
        phone: settings?.phone ?? "",
        email: settings?.email ?? "",
        logoDataUrl: settings?.logoDataUrl ?? null,
        defaultOpen: settings?.defaultOpen ?? "06:00",
        defaultClose: settings?.defaultClose ?? "22:00",
      }}
    />
  );
}
