export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

export function formatDuration(startedAt: Date, endedAt: Date): string {
  const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const durationMins = Math.floor(durationMs / 1000 / 60);

  if (durationMins < 60) {
    return `${durationMins} min`;
  }

  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;

  if (mins === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  return `${hours}h ${mins}m`;
}
