import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { DownloadItem, deleteDownload, downloadAsFile, getDownloads } from "@/lib/store";

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const Downloads = () => {
  const [items, setItems] = useState<DownloadItem[]>(getDownloads());

  const remove = (id: string) => {
    if (!confirm("Delete this file? This can't be undone.")) return;
    deleteDownload(id);
    setItems(getDownloads());
    toast.success("File deleted.");
  };

  const download = (item: DownloadItem) => {
    const mime = item.type === "code" ? "text/plain" : item.type === "image" ? "image/png" : "text/markdown";
    downloadAsFile(item.name, item.content, mime);
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight">Downloads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Files you saved from chats. They're stored in this browser.</p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <p className="font-medium">No saved files</p>
            <p className="mt-1 text-sm text-muted-foreground">Use the download button on a reply or code block to save it here.</p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/ai">Go to chat</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {formatSize(item.size)} · {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => download(item)} className="gap-1.5">
                  <Download className="size-3.5" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="size-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default Downloads;
