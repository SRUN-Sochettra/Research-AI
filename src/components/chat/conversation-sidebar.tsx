"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    MessageSquare,
    Plus,
    PanelLeft,
    Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";
import type { Conversation } from "@/types/database";

interface ConversationSidebarProps {
    documentId: string;
    conversations: Conversation[];
    currentConversationId: string | null;
    onNewConversation: () => void;
    onSelectConversation: (id: string) => void;
}

export function ConversationSidebar({
    conversations,
    currentConversationId,
    onNewConversation,
    onSelectConversation,
}: ConversationSidebarProps) {
    const [open, setOpen] = useState(false);

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
                <h3 className="text-sm font-semibold">Conversations</h3>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        onNewConversation();
                        setOpen(false);
                    }}
                >
                    <Plus className="mr-1 h-3 w-3" />
                    New
                </Button>
            </div>

            <Separator />

            <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No conversations yet
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    onSelectConversation(conv.id);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full rounded-lg p-3 text-left transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    currentConversationId === conv.id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {conv.title}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(conv.updated_at)}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    return (
        <>
            {/* Mobile: Sheet drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden"
                    >
                        <PanelLeft className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Conversations</SheetTitle>
                    </SheetHeader>
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop: Inline sidebar */}
            <div className="hidden w-64 shrink-0 rounded-lg border bg-card md:flex md:flex-col">
                <SidebarContent />
            </div>
        </>
    );
}