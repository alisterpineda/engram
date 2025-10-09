import { ChildEntity, Column, Check, Index } from 'typeorm';
import { Note } from './Note';

@ChildEntity('log')
@Check(`"endedAt" IS NULL OR "endedAt" > "startedAt"`)
@Index(['startedAt'])
@Index(['endedAt'])
export class Log extends Note {
  @Column()
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date | null;
}
