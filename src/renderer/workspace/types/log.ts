export interface Log {
  id: number;
  title: string | null;
  contentJson: string;
  contentText: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date;
  endedAt: Date | null;
  references?: Log[];
}
