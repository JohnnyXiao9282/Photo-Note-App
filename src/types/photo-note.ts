export interface PhotoNote {
  id: string;
  photoUri: string;
  title: string;
  note: string;
  dateCreated: Date;
}

export type PhotoNoteInput = Omit<PhotoNote, "id" | "dateCreated">;
