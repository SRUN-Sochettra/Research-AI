"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signOut } = useAuth();

  const isConfirmed = confirmationInput.trim() === "DELETE";

  async function handleDelete() {
    if (!isConfirmed) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || "Failed to delete account. Please try again."
        );
      }

      toast.success("Account and data deleted successfully.");
      await signOut();
      setOpen(false);
      router.push("/");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Account deletion failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="border-destructive/20 border-b pb-4">
        <CardTitle className="text-destructive flex items-center gap-2 text-xl">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently remove your account, uploaded documents, embeddings, and
          chat history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="text-muted-foreground space-y-2 text-sm">
          <p>
            Once deleted, all your stored documents, extracted text, vector
            embeddings, and conversation histories are permanently erased from
            our database and storage.
          </p>
          <p className="text-foreground font-medium">
            This action cannot be undone.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-2">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirm Account Deletion
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-2">
                <span className="block">
                  This will permanently delete your account and all associated
                  documents, embeddings, conversations, and personal data.
                </span>
                <span className="text-foreground block font-medium">
                  To confirm, type{" "}
                  <strong className="text-destructive font-bold">DELETE</strong>{" "}
                  below:
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Input
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                aria-label="Confirm deletion by typing DELETE"
                disabled={busy}
                className="font-mono"
              />

              {error && (
                <p
                  role="alert"
                  className="text-destructive text-sm font-medium"
                >
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmed || busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Permanently Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
