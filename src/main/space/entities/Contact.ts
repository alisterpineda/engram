import { ChildEntity } from 'typeorm';
import { Note } from './Note';

@ChildEntity('contact')
export class Contact extends Note {
  // No additional columns
  // title = name, contentJson = notes about contact
}
