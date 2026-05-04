import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText } from "lucide-react";
import { DownloadItem, deleteDownload, downloadAsFile, getDownloads } from "@/lib/store";
import { toast } from "sonner";

const Downloads = () => {
  const [items, setItems] = useState<DownloadItem[]>(getDownloads());

  const remove = (id: string) => {
    if (!confirm("Delete this file?")) return;
    deleteDownload(id);
    setItems(getDownloads());
  };

  const download = (item: DownloadItem) => {
    const mime = item.type === "code" ? "text/plain" : item.type === "image" ? "image/png" : "text/markdown";
    downloadAsFile(item.name, item.content, mime);
    toast.success(`Downloading ${item.name}`);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Downloads</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} saved file{items.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <Download className="size-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No downloads yet</h3>
            <p className="text-sm text-muted-foreground">Export a chat from the AI workspace to save it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="glass-panel rounded-xl overflow-hidden">
                <TrafficLights label={`${item.type} · ${(item.size / 1024).toFixed(1)} KB`} />
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-lg bg-gradient-mira/10 border border-border flex items-center justify-center shrink-0">
                      <FileText className="size-5 text-mira-purple" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium font-mono text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => download(item)} className="gap-1.5">
                      <Download className="size-4" /> Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(item.id)} className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Downloads;
