export interface Contact {
  id: number;
  title: string; // Name (required)
  contentJson: string; // Notes
  createdAt: Date;
  updatedAt: Date;
  references?: Contact[];
}
