import { getSupabaseServerClient } from "../supabase/server";
import { getSupabaseAdminClient } from "../supabase/admin";
import { logger } from "@/lib/observability/logger";

export async function getUserProfile(id: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function deleteUserAccount(userId: string): Promise<{
  deletedFilesCount: number;
  deletedDocumentsCount: number;
}> {
  const supabase = getSupabaseAdminClient();
  let deletedFilesCount = 0;
  let deletedDocumentsCount = 0;

  // ─── Stage 1: Storage Enumeration & Deletion ─────────────────────────
  // Query document file paths
  const { data: userDocs, error: docsFetchError } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("user_id", userId);

  if (docsFetchError) {
    logger.error(
      "Account deletion failed during documents query",
      docsFetchError,
      { stage: "storage_enumeration", userId }
    );
    throw new Error(
      `Failed to query user documents for deletion: ${docsFetchError.message}`
    );
  }

  deletedDocumentsCount = userDocs?.length ?? 0;

  // Enumerate storage objects under user prefix
  const { data: folderObjects, error: listError } = await supabase.storage
    .from("documents")
    .list(userId);

  if (listError) {
    logger.error(
      "Account deletion failed during storage enumeration",
      listError,
      { stage: "storage_enumeration", userId }
    );
    throw new Error(
      `Failed to enumerate storage objects for deletion: ${listError.message}`
    );
  }

  // Collect unique storage paths to delete
  const pathsToDelete = new Set<string>();
  if (folderObjects && folderObjects.length > 0) {
    for (const obj of folderObjects) {
      if (obj.name) {
        pathsToDelete.add(`${userId}/${obj.name}`);
      }
    }
  }
  if (userDocs && userDocs.length > 0) {
    for (const doc of userDocs) {
      if (doc.file_path) {
        pathsToDelete.add(doc.file_path);
      }
    }
  }

  if (pathsToDelete.size > 0) {
    const { data: removed, error: removeError } = await supabase.storage
      .from("documents")
      .remove(Array.from(pathsToDelete));

    if (removeError) {
      logger.error(
        "Account deletion failed during storage removal",
        removeError,
        { stage: "storage_removal", userId }
      );
      throw new Error(
        `Failed to remove storage objects during account deletion: ${removeError.message}`
      );
    }
    deletedFilesCount = removed?.length ?? pathsToDelete.size;
  }

  // ─── Stage 2: Database Data Deletion ─────────────────────────────────
  const { error: convError } = await supabase
    .from("conversations")
    .delete()
    .eq("user_id", userId);

  if (convError) {
    logger.error(
      "Account deletion failed during conversations deletion",
      convError,
      { stage: "database_conversations", userId }
    );
    throw new Error(
      `Failed to delete user conversations: ${convError.message}`
    );
  }

  const { error: docDeleteError } = await supabase
    .from("documents")
    .delete()
    .eq("user_id", userId);

  if (docDeleteError) {
    logger.error(
      "Account deletion failed during documents deletion",
      docDeleteError,
      { stage: "database_documents", userId }
    );
    throw new Error(
      `Failed to delete user documents: ${docDeleteError.message}`
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    logger.error(
      "Account deletion failed during profile deletion",
      profileError,
      { stage: "database_profiles", userId }
    );
    throw new Error(`Failed to delete user profile: ${profileError.message}`);
  }

  // ─── Stage 3: Supabase Auth User Deletion ───────────────────────────
  const { error: authDeleteError } =
    await supabase.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    // If user is already deleted, treat as idempotent success; otherwise log and throw
    if (!authDeleteError.message.toLowerCase().includes("user not found")) {
      logger.error(
        "Account deletion failed during auth user deletion",
        authDeleteError,
        { stage: "auth_deletion", userId }
      );
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }
  }

  logger.info("User account and associated data successfully deleted", {
    userId,
    deletedDocumentsCount,
    deletedFilesCount,
  });

  return { deletedFilesCount, deletedDocumentsCount };
}
