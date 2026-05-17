import { useEffect, useState } from "react";
import { Speaker, Check } from "lucide-react";
import { usePlayer } from "@/store/player";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DeviceMenu() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const { sinkId, setSinkId } = usePlayer();

  const refresh = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "audiooutput"));
    } catch {
      /* permission denied */
    }
  };

  useEffect(() => {
    refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={refresh}
          className="hidden p-1.5 text-muted-foreground hover:text-foreground md:block"
          aria-label="Audio output"
        >
          <Speaker className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Audio output</DropdownMenuLabel>
        {devices.length === 0 ? (
          <DropdownMenuItem disabled>
            Allow microphone to list devices, or use system default.
          </DropdownMenuItem>
        ) : (
          devices.map((d) => (
            <DropdownMenuItem key={d.deviceId} onClick={() => setSinkId(d.deviceId)}>
              <span className="flex-1 truncate">{d.label || "Output device"}</span>
              {sinkId === d.deviceId && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuItem onClick={() => setSinkId("")}>
          <span className="flex-1">System default</span>
          {!sinkId && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
