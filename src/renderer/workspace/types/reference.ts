import { Log } from './log';
import { Page } from './page';
import { Comment } from './comment';

export type NoteReferenceType = 'log' | 'page' | 'comment';

export type NoteReference =
  | (Log & { type: 'log' })
  | (Page & { type: 'page' })
  | (Comment & { type: 'comment' });

export interface ReferencesData {
  incoming: NoteReference[];
  outgoing: NoteReference[];
}
