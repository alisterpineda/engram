import { Log } from './log';
import { Page } from './page';
import { Contact } from './contact';
import { Comment } from './comment';

export type NoteReferenceType = 'log' | 'page' | 'contact' | 'comment';

export type NoteReference =
  | (Log & { type: 'log' })
  | (Page & { type: 'page' })
  | (Contact & { type: 'contact' })
  | (Comment & { type: 'comment' });

export interface ReferencesData {
  incoming: NoteReference[];
  outgoing: NoteReference[];
}
