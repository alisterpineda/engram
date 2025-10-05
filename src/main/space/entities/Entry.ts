import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Check } from 'typeorm';

@Entity()
@Check(`"endedAt" IS NULL OR "endedAt" > "occurredAt"`)
@Check(`"parentId" IS NULL OR "endedAt" IS NULL`)
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  contentJson: string;

  @Column('text')
  contentHtml: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  occurredAt: Date;

  @Column({ nullable: true })
  endedAt: Date | null;

  @Column({ nullable: true })
  parentId: number | null;

  @ManyToOne(() => Entry, (entry) => entry.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Entry | null;

  @OneToMany(() => Entry, (entry) => entry.parent)
  children: Entry[];
}
