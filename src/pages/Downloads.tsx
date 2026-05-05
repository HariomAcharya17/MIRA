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
    if (!confirm("Permanently delete this neural asset?")) return;
    deleteDownload(id);
    setItems(getDownloads());
    toast.success("Asset deleted.");
  };

  const download = (item: DownloadItem) => {
    const mime = item.type === "code" ? "text/plain" : item.type === "image" ? "image/png" : "text/markdown";
    downloadAsFile(item.name, item.content, mime);
    toast.success(`Exporting transmission: ${item.name}`);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-pink mb-2 flex items-center gap-2">
            <span className="size-1 bg-mira-pink rounded-full animate-pulse" />
            Neural Asset Repository
          </div>
          <h1 className="text-4xl font-semibold tracking-tighter">Downloads</h1>
          <p className="text-sm text-muted-foreground mt-2 font-light">
            {items.length} exported asset{items.length === 1 ? "" : "s"} indexed in secure local storage.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="glass-panel rounded-2xl p-20 text-center border-white/5 border-dashed">
            <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Download className="size-8 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Repository Empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-light leading-relaxed">
              No neural assets have been exported. Save your conversations or code transmissions to see them here.
            </p>
            <Button variant="outline" className="mt-8 border-white/10 px-8" asChild>
              <a href="/ai">Initialize Workspace</a>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item, i) => (
              <div 
                key={item.id} 
                className="glass-panel rounded-2xl overflow-hidden border-white/5 group hover:border-mira-pink/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="p-1">
                  <TrafficLights label={`${item.type} // 0x${item.id.slice(0, 8).toUpperCase()}`} />
                </div>
                <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-5 min-w-0 flex-1">
                    <div className="size-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-mira-pink/10 group-hover:border-mira-pink/20 transition-all duration-500">
                      <FileText className="size-6 text-mira-pink" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate group-hover:text-mira-pink transition-colors">{item.name}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                        <span>{(item.size / 1024).toFixed(1)} KB</span>
                        <span className="size-1 bg-white/10 rounded-full" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => download(item)} 
                      className="h-10 px-6 gap-2 btn-mira-secondary shadow-lg shadow-mira-pink/10"
                    >
                      <Download className="size-4" /> Download
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => remove(item.id)} 
                      className="size-10 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
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
