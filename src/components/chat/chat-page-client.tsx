"use client";

import { useState } from "react";
import { ChatInterface } from "./chat-interface";
import { ConversationSidebar } from "./conversation-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    FileText,
    BookOpen,
} from "lucide-react";
import Link from "next/link";
import { truncateText } from "@/lib/utils/helpers";
import type { Document, Conversation, Message } from "@/types/database";

interface ChatPageClientProps {
    document: Document;
    conversations: Conversation[];
    initialMessages: Message[];
    initialConversationId: string | null;
}

export function ChatPageClient({
    document,
    conversations: initialConversations,
    initialMessages,
    initialConversationId,
}: ChatPageClientProps) {

    const [currentConversationId, setCurrentConversationId] = useState(
        initialConversationId
    );
    const [conversations] = useState(initialConversations);
    const [messages, setMessages] = useState(initialMessages);
    const [showSummary, setShowSummary] = useState(false);

    const handleNewConversation = () => {
        // Clear messages and conversation ID
        // useChat will create a new one on first message
        setCurrentConversationId(null);
        setMessages([]);
    };

    const handleSelectConversation = async (id: string) => {
        setCurrentConversationId(id);

        // Load messages for selected conversation
        const response = await fetch(
            `/api/conversations/${id}/messages`
        );
        if (response.ok) {
            const data = await response.json();
            setMessages(data.messages ?? []);
        }
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/documents/${document.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {truncateText(document.title, 40)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                            {document.page_count} pages
                        </Badge>
                    </div>
                </div>

                {/* Summary toggle */}
                {document.summary && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSummary((p) => !p)}
                    >
                        <BookOpen className="mr-2 h-4 w-4" />
                        {showSummary ? "Hide" : "Show"} Summary
                    </Button>
                )}
            </div>

            {/* Summary panel */}
            {showSummary && document.summary && (
                <div className="border-b bg-muted/50 px-4 py-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Summary:{" "}
                        </span>
                        {document.summary}
                    </p>
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-1 gap-4 overflow-hidden p-4">
                {/* Conversation sidebar */}
                <ConversationSidebar
                    documentId={document.id}
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onNewConversation={handleNewConversation}
                    onSelectConversation={handleSelectConversation}
                />

                {/* Chat area */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card">
                    <ChatInterface
                        document={document}
                        initialMessages={messages}
                        initialConversationId={currentConversationId ?? undefined}
                    />
                </div>
            </div>
        </div>
    );
}