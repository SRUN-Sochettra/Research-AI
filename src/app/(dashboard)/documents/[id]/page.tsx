export default function DocumentViewPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-bold">Document: {params.id}</h1>
      {/* PDF viewer and chat interface will go here */}
    </div>
  );
}
