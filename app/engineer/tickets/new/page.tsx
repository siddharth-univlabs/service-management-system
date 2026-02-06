export default async function EngineerTicketNewPage() {
  const { notFound } = await import("next/navigation");
  notFound();
}
