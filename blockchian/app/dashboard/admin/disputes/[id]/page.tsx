import DisputeDetail from "@/components/workspace/DisputeDetail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisputeDetail id={id} />;
}
