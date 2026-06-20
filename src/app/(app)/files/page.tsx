import { createClient } from "@/lib/supabase/server";
import { FilesClient } from "./files-client";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("ops_files")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <FilesClient initialFiles={files || []} />
    </div>
  );
}
