import { ChildEntity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Note } from './Note';

@ChildEntity('comment')
@Index(['parentId'])
@Index(['commentedAt'])
export class Comment extends Note {
  @Column()
  parentId: number;

  @Column()
  commentedAt: Date;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Note;
}
