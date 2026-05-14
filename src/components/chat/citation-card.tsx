export default function CitationCard({ content, metadata }: { content: string, metadata: any }) {
  return (
    <div className="text-xs border-l-2 pl-2 my-2 text-gray-500 italic">
      "{content}" - Page {metadata.pageNumber}
    </div>
  );
}
