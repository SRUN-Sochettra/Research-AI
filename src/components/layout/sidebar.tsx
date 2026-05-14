import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <nav className="space-y-2">
        <Link href="/documents" className="block rounded p-2 hover:bg-gray-200">Documents</Link>
        <Link href="/chat" className="block rounded p-2 hover:bg-gray-200">Chat</Link>
      </nav>
    </aside>
  );
}
