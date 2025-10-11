export interface Contact {
  id: number;
  title: string; // Name (required)
  contentJson: string; // Notes
  contentText: string | null;
  createdAt: Date;
  updatedAt: Date;
  references?: Contact[];
}
