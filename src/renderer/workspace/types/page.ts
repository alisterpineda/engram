export interface Page {
  id: number;
  title: string; // Required
  contentJson: string;
  createdAt: Date;
  updatedAt: Date;
  references?: Page[]; // For referenced notes
}
