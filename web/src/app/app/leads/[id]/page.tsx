import { redirect } from "next/navigation";

export default async function RelationshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Redirect to leads page with editId query param to open EditLeadModal
  // This ensures ONE unified view (EditLeadModal) for all relationship interactions
  redirect(`/app/leads?editId=${id}`);
}




