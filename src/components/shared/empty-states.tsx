export function EmptyDocuments() {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
      <p className="text-gray-500">No documents found. Upload your first PDF to get started!</p>
    </div>
  );
}

export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <p>Select a document to start chatting.</p>
    </div>
  );
}
