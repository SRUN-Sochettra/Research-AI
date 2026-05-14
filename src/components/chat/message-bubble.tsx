export default function MessageBubble({ role, content }: { role: string, content: string }) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${isAssistant ? 'bg-gray-100' : 'bg-blue-600 text-white'}`}>
        {content}
      </div>
    </div>
  );
}
