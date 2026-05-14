import MessageBubble from './message-bubble';
import ChatInput from './chat-input';

export default function ChatInterface() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Messages */}
      </div>
      <ChatInput />
    </div>
  );
}
