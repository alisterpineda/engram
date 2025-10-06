export interface Log {
  id: number;
  contentJson: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date;
  endedAt: Date | null;
  parentId: number | null;
}
