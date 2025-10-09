import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, TableInheritance, OneToMany, Index } from 'typeorm';
import { NoteReference } from './NoteReference';

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
@Index(['createdAt'])
@Index(['updatedAt'])
export abstract class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column('text')
  contentJson: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => NoteReference, (ref) => ref.source)
  outgoingReferences: NoteReference[];

  @OneToMany(() => NoteReference, (ref) => ref.target)
  incomingReferences: NoteReference[];
}
