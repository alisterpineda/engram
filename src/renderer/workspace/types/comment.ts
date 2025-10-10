export interface Comment {
  id: number;
  parentId: number;
  title: string | null;
  contentJson: string;
  commentedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
