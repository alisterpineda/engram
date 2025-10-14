import { Log } from './log';
import { Comment } from './comment';

export type FeedItem =
  | {
      type: 'full-post';
      post: Log;
      commentsForDay: Comment[];
    }
  | {
      type: 'minimized-post';
      post: Log;
      commentsForDay: Comment[];
    };

export interface DayGroup {
  day: string;
  items: FeedItem[];
}
