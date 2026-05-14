import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center bg-white py-12 px-4 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
        Your AI-Powered <span className="text-blue-600">Research Assistant</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-gray-600">
        Upload PDF documents, extract insights, and chat with your research papers using state-of-the-art RAG technology.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/signup"
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-lg font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Log In
        </Link>
      </div>
      
      <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="p-6">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-bold">PDF Parsing</h3>
          <p className="mt-2 text-gray-500">Smart text extraction and semantic chunking for precise context.</p>
        </div>
        <div className="p-6">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold">Vector Search</h3>
          <p className="mt-2 text-gray-500">High-performance semantic retrieval using pgvector.</p>
        </div>
        <div className="p-6">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-bold">RAG Chat</h3>
          <p className="mt-2 text-gray-500">Real-time streaming conversations with deep document insights.</p>
        </div>
      </div>
    </div>
  );
}
