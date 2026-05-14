export default function ChatPage({ params }: { params: { documentId: string } }) {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-bold">Chatting about Document: {params.documentId}</h1>
      {/* Q&A interface component will go here */}
    </div>
  );
}
