"use client";

import { useState } from "react";
import { ChatInterface } from "./chat-interface";
import { ConversationSidebar } from "./conversation-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    ArrowLeft,
    FileText,
    BookOpen,
    Download,
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
    const [conversations, setConversations] = useState(initialConversations);
    const [messages, setMessages] = useState(initialMessages);
    const [showSummary, setShowSummary] = useState(false);


    const handleDownload = () => {
        if (messages.length === 0) return;

        let markdown = `# Conversation about ${document.title}\n\n`;

        messages.forEach((msg) => {
            const role = msg.role === "user" ? "## User" : "## Assistant";
            markdown += `${role}\n\n${msg.content}\n\n`;

            // Add citations if any
            if (msg.role === "assistant" && (msg.citations as unknown[])?.length > 0) {
                markdown += `*Citations:*\n`;
                (msg.citations as unknown[]).forEach((c: unknown, i: number) => {
                    const cite = c as { pageNumber?: number; snippet: string };
                    const page = cite.pageNumber ? ` (Page ${cite.pageNumber})` : '';
                    markdown += `${i + 1}. [Source${page}]: ${cite.snippet.replace(/\n/g, ' ')}\n`;
                });
                markdown += `\n`;
            }

            markdown += `---\n\n`;
        });

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `chat-${document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${date}.md`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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

    const handleRenameConversation = async (id: string, newTitle: string) => {
        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
            });

            if (!res.ok) throw new Error("Failed to rename conversation");

            setConversations(prev => prev.map(conv => conv.id === id ? { ...conv, title: newTitle } : conv));
            toast.success("Conversation renamed");
        } catch (_error) {
            toast.error("Failed to rename conversation");
        }
    };

    const handleDeleteConversation = async (id: string) => {
        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete conversation");

            setConversations(prev => prev.filter(conv => conv.id !== id));
            toast.success("Conversation deleted");

            if (currentConversationId === id) {
                handleNewConversation();
            }
        } catch (_error) {
            toast.error("Failed to delete conversation");
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={messages.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
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
                </div>            </div>

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
                    onRenameConversation={handleRenameConversation}
                    onDeleteConversation={handleDeleteConversation}
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
