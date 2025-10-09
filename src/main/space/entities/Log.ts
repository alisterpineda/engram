import { ChildEntity, Column, Check } from 'typeorm';
import { Note } from './Note';

@ChildEntity('log')
@Check(`"endedAt" IS NULL OR "endedAt" > "startedAt"`)
export class Log extends Note {
  @Column()
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date | null;
}
