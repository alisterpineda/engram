import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity()
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  parentId: number | null;

  @ManyToOne(() => Entry, (entry) => entry.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Entry | null;

  @OneToMany(() => Entry, (entry) => entry.parent)
  children: Entry[];
}
