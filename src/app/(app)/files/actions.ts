"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteFileAction(fileId: string, filePath: string) {
  const supabase = await createClient();

  // 1. Delete from storage
  const { error: storageError } = await supabase.storage.from("ops_files").remove([filePath]);
  if (storageError) {
    console.error("Storage delete error:", storageError);
    return { error: "Failed to delete from storage" };
  }

  // 2. Delete from DB
  const { error: dbError } = await supabase.from("ops_files").delete().eq("id", fileId);
  if (dbError) {
    console.error("DB delete error:", dbError);
    return { error: "Failed to delete record" };
  }

  revalidatePath("/files");
  return { success: true };
}

export async function createDbRecordAction(data: {
  file_name: string;
  file_url: string;
  file_type: string;
  size_bytes: number;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.from("ops_files").insert({
    ...data,
    uploaded_by: user.user.id,
  });

  if (error) {
    console.error("Insert record error:", error);
    return { error: "Failed to create DB record" };
  }

  revalidatePath("/files");
  return { success: true };
}
