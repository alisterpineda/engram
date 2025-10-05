export interface Entry {
  id: number;
  contentJson: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  occurredAt: Date;
  endedAt: Date | null;
  parentId: number | null;
}
