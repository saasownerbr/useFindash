import { channelColor, channelLabel } from "@/lib/channels";
import { cn } from "@/lib/utils";

/** Channel pill tinted with the channel's own color. */
export function ChannelBadge({ channel, className }: { channel: string | null | undefined; className?: string }) {
  const color = channelColor(channel);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
      style={{ color, backgroundColor: `${color}26` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {channelLabel(channel)}
    </span>
  );
}
