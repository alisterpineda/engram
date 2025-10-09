import { ChildEntity } from 'typeorm';
import { Note } from './Note';

@ChildEntity('page')
export class Page extends Note {
  // No additional columns
  // Uses inherited: id, title, contentJson, createdAt, updatedAt
}
