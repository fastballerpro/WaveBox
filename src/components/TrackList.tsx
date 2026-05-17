import type { ScTrack } from '@/types/soundcloud';
import { TrackRow } from './TrackRow';

interface Props {
  tracks: ScTrack[];
  showArt?: boolean;
}

export function TrackList({ tracks, showArt = true }: Props) {
  if (!tracks.length) {
    return <div className="text-text-mute text-sm py-12 text-center">No tracks</div>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} index={i} queue={tracks} showArt={showArt} />
      ))}
    </div>
  );
}
