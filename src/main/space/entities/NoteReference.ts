import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Check, Index } from 'typeorm';
import { Note } from './Note';

@Entity('note_reference')
@Check(`"sourceId" != "targetId"`)
@Index(['sourceId'])
@Index(['targetId'])
@Index(['sourceId', 'targetId'], { unique: true })
export class NoteReference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sourceId: number;

  @Column()
  targetId: number;

  @ManyToOne(() => Note, (note) => note.outgoingReferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceId' })
  source: Note;

  @ManyToOne(() => Note, (note) => note.incomingReferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetId' })
  target: Note;

  @CreateDateColumn()
  createdAt: Date;

  // Future-ready for custom columns:
  // type?: string
  // label?: string
  // metadata?: string (JSON)
  // etc.
}
