export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <nav className="space-y-2">
        <a href="/documents" className="block rounded p-2 hover:bg-gray-200">Documents</a>
        <a href="/chat" className="block rounded p-2 hover:bg-gray-200">Chat</a>
      </nav>
    </aside>
  );
}
