import { ChildEntity, Column, ManyToOne, OneToMany, JoinColumn, Check } from 'typeorm';
import { Note } from './Note';

@ChildEntity('log')
@Check(`"endedAt" IS NULL OR "endedAt" > "startedAt"`)
@Check(`"parentId" IS NULL OR "endedAt" IS NULL`)
export class Log extends Note {
  @Column()
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date | null;

  @Column({ nullable: true })
  parentId: number | null;

  @ManyToOne(() => Log, (log) => log.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Log | null;

  @OneToMany(() => Log, (log) => log.parent)
  children: Log[];
}
