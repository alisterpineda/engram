export interface Log {
  id: number;
  contentJson: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date;
  endedAt: Date | null;
  parentId: number | null;
}
