export function SpotifyEmbed({ playlistId, title }: { playlistId: string; title?: string }) {
  return (
    <iframe
      title={title ?? "Spotify playlist"}
      src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=koino`}
      width="100%"
      height="80"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      style={{ border: 0, borderRadius: 12 }}
    />
  );
}
