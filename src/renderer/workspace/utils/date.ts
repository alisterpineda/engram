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

export function formatAbsoluteTime(date: Date): string {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatAbsoluteDateTime(date: Date): string {
  const dateObj = new Date(date);
  const datePart = dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timePart = dateObj.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
  return `${datePart} at ${timePart}`;
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

export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function formatDayHeader(date: Date): string {
  const now = new Date();
  const targetDate = new Date(date);

  // Check if it's today
  if (isSameDay(targetDate, now)) {
    return 'Today';
  }

  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(targetDate, yesterday)) {
    return 'Yesterday';
  }

  // Format as "Month Day, Year"
  return targetDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function groupPostsByDay<T extends { startedAt: Date | string }>(
  posts: T[]
): Array<{ day: string; posts: T[] }> {
  const groups: Array<{ day: string; posts: T[] }> = [];

  for (const post of posts) {
    const postDate = new Date(post.startedAt);
    const dayHeader = formatDayHeader(postDate);

    // Find existing group for this day
    const existingGroup = groups.find(g => g.day === dayHeader);

    if (existingGroup) {
      existingGroup.posts.push(post);
    } else {
      groups.push({ day: dayHeader, posts: [post] });
    }
  }

  return groups;
}
