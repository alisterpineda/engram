import { Log } from './log';
import { Page } from './page';
import { Contact } from './contact';

export type NoteReferenceType = 'log' | 'page' | 'contact';

export type NoteReference =
  | (Log & { type: 'log' })
  | (Page & { type: 'page' })
  | (Contact & { type: 'contact' });

export interface ReferencesData {
  incoming: NoteReference[];
  outgoing: NoteReference[];
}
