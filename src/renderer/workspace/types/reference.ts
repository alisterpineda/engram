import { Log } from './log';
import { Page } from './page';
import { Contact } from './contact';

export type NoteReference = Log | Page | Contact;

export interface ReferencesData {
  incoming: NoteReference[];
  outgoing: NoteReference[];
}
