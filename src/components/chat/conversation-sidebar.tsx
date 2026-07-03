"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    Plus,
    PanelLeft,
    Clock,
    MoreVertical,
    Pencil,
    Trash2,
    Check,
    X as CloseIcon,
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
    onRenameConversation?: (id: string, newTitle: string) => Promise<void>;
    onDeleteConversation?: (id: string) => Promise<void>;
}

interface SidebarContentProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    onNewConversation: () => void;
    onSelectConversation: (id: string) => void;
    onRenameConversation?: (id: string, newTitle: string) => Promise<void>;
    onDeleteConversation?: (id: string) => Promise<void>;
    setOpen: (open: boolean) => void;
}

function SidebarContent({
    conversations,
    currentConversationId,
    onNewConversation,
    onSelectConversation,
    onRenameConversation,
    onDeleteConversation,
    setOpen,
}: SidebarContentProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const handleStartEdit = (conv: Conversation) => {
        setEditingId(conv.id);
        setEditTitle(conv.title);
    };

    const handleSaveEdit = async () => {
        if (editingId && editTitle.trim() && onRenameConversation) {
            await onRenameConversation(editingId, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle("");
    };

    return (
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
                            <div
                                key={conv.id}
                                className={cn(
                                    "group relative flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    currentConversationId === conv.id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <button
                                    onClick={() => {
                                        if (editingId !== conv.id) {
                                            onSelectConversation(conv.id);
                                            setOpen(false);
                                        }
                                    }}
                                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                                >
                                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        {editingId === conv.id ? (
                                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <Input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="h-6 px-1 py-0 text-sm"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSaveEdit();
                                                        if (e.key === "Escape") setEditingId(null);
                                                    }}
                                                />
                                                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={handleSaveEdit}>
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingId(null)}>
                                                    <CloseIcon className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {conv.title}
                                                </p>
                                                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(conv.updated_at)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </button>

                                {editingId !== conv.id && (onRenameConversation || onDeleteConversation) && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">More options</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {onRenameConversation && (
                                                <DropdownMenuItem onClick={() => handleStartEdit(conv)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Rename
                                                </DropdownMenuItem>
                                            )}
                                            {onDeleteConversation && (
                                                <DropdownMenuItem
                                                    onClick={async () => {
                                                        await onDeleteConversation(conv.id);
                                                        if (currentConversationId === conv.id) {
                                                            onNewConversation();
                                                        }
                                                    }}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

export function ConversationSidebar({
    conversations,
    currentConversationId,
    onNewConversation,
    onSelectConversation,
    onRenameConversation,
    onDeleteConversation,
}: ConversationSidebarProps) {
    const [open, setOpen] = useState(false);

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
                    <SidebarContent
                        conversations={conversations}
                        currentConversationId={currentConversationId}
                        onNewConversation={onNewConversation}
                        onSelectConversation={onSelectConversation}
                        onRenameConversation={onRenameConversation}
                        onDeleteConversation={onDeleteConversation}
                        setOpen={setOpen}
                    />
                </SheetContent>
            </Sheet>

            {/* Desktop: Inline sidebar */}
            <div className="hidden w-64 shrink-0 rounded-lg border bg-card md:flex md:flex-col">
                <SidebarContent
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onNewConversation={onNewConversation}
                    onSelectConversation={onSelectConversation}
                    onRenameConversation={onRenameConversation}
                    onDeleteConversation={onDeleteConversation}
                    setOpen={setOpen}
                />
            </div>
        </>
    );
}
