export interface Page {
  id: number;
  title: string; // Required
  contentJson: string;
  contentText: string | null;
  createdAt: Date;
  updatedAt: Date;
  references?: Page[]; // For referenced notes
}
