import { useCallback, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDropzone } from "react-dropzone";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/_app/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!user) return;
      setBusy(true);
      try {
        for (const f of files) {
          setProgress(`Uploading ${f.name}…`);
          const path = `${user.id}/${Date.now()}-${f.name}`;
          const { error: upErr } = await supabase.storage
            .from("audio-uploads")
            .upload(path, f, { contentType: f.type, upsert: false });
          if (upErr) throw upErr;

          // Read duration
          const duration = await readDuration(f).catch(() => null);

          const title = f.name.replace(/\.[^.]+$/, "");
          const { error: dbErr } = await supabase.from("uploaded_tracks").insert({
            owner_id: user.id,
            title,
            storage_path: path,
            duration_seconds: duration,
          });
          if (dbErr) throw dbErr;
        }
        toast.success(`Uploaded ${files.length} track${files.length > 1 ? "s" : ""}`);
        navigate({ to: "/library" });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
        setProgress("");
      }
    },
    [user, navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".m4a", ".flac", ".wav", ".ogg"] },
    disabled: busy || !user,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Upload audio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your uploads are private and only streamable by you.
        </p>
      </div>
      <div
        {...getRootProps()}
        className={`grid place-items-center rounded-2xl border-2 border-dashed p-16 text-center transition ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-surface-1"
        }`}
      >
        <input {...getInputProps()} />
        {busy ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
            <p className="text-sm">{progress}</p>
          </>
        ) : (
          <>
            <UploadIcon className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm">
              Drag & drop audio files here, or <span className="font-semibold text-primary">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">MP3, M4A, FLAC, WAV, OGG</p>
          </>
        )}
      </div>
    </div>
  );
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("audio");
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const d = a.duration;
      URL.revokeObjectURL(url);
      resolve(Math.round(d));
    };
    a.onerror = () => reject(new Error("metadata"));
    a.src = url;
  });
}
