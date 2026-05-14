export default function DocumentCard({ doc }: { doc: any }) {
  return (
    <div className="rounded-lg border p-4 shadow-sm hover:shadow-md">
      <h3 className="font-semibold">{doc.title}</h3>
      <p className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
    </div>
  );
}
