export interface Comment {
  id: number;
  parentId: number;
  title: string | null;
  contentJson: string;
  contentText: string | null;
  commentedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
