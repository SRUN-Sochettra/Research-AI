export default function ChatInput() {
  return (
    <div className="border-t p-4">
      <div className="flex space-x-2">
        <input 
          type="text" 
          placeholder="Ask a question..." 
          className="flex-1 rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Send</button>
      </div>
    </div>
  );
}
