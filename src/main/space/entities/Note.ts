import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, TableInheritance } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export abstract class Note {
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
}
