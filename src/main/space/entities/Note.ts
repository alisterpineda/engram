import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, TableInheritance } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
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
}
