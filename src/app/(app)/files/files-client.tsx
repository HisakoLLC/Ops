"use client"

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UploadCloud, File, Image as ImageIcon, Download, Trash } from "lucide-react";
import { createDbRecordAction, deleteFileAction } from "./actions";

export function FilesClient({ initialFiles }: { initialFiles: any[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading file...");

    try {
      // 1. Upload to Supabase Storage
      const fileExt = selected.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ops_files')
        .upload(filePath, selected);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('ops_files')
        .getPublicUrl(filePath);

      // 2. Create DB Record
      const record = {
        file_name: selected.name,
        file_url: publicUrlData.publicUrl,
        file_type: selected.type,
        size_bytes: selected.size,
      };

      const res = await createDbRecordAction(record);
      if (res.error) throw new Error(res.error);

      toast.success("File uploaded successfully", { id: toastId });
      
      setFiles([{ ...record, id: Math.random().toString(), created_at: new Date().toISOString() }, ...files]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file", { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    // Extract path from public URL
    const urlParts = url.split('/');
    const filePath = urlParts[urlParts.length - 1];

    const toastId = toast.loading("Deleting...");
    const res = await deleteFileAction(id, filePath);
    if (res.success) {
      setFiles(files.filter(f => f.id !== id));
      toast.success("File deleted", { id: toastId });
    } else {
      toast.error(res.error || "Failed to delete", { id: toastId });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground">Upload and manage documents and screenshots.</p>
        </div>
        <div>
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading} className="cursor-pointer">
              <span>
                <UploadCloud className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload File"}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No files uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {file.file_type?.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    <a href={file.file_url} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[200px] md:max-w-[400px]" title={file.file_name}>
                      {file.file_name}
                    </a>
                  </TableCell>
                  <TableCell>{file.file_type || 'Unknown'}</TableCell>
                  <TableCell>{formatSize(file.size_bytes)}</TableCell>
                  <TableCell>{new Date(file.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.file_url} target="_blank" rel="noreferrer" download={file.file_name}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(file.id, file.file_url)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
