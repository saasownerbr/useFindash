import { channelColors, channelLabel } from "@/lib/channels";
import { cn } from "@/lib/utils";

/** Channel pill in the channel's own color. */
export function ChannelBadge({ channel, className }: { channel: string | null | undefined; className?: string }) {
  const { color, background } = channelColors(channel);
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
      style={{ color, backgroundColor: background }}
    >
      {channelLabel(channel)}
    </span>
  );
}
