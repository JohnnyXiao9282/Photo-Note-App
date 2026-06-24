import type { PhotoNote, PhotoNoteInput } from "@/types/photo-note";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";

const STORAGE_KEY = "@photo_notes";

/** Resize to max 800px wide and compress to ~60% quality to fit in localStorage on web */
async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: false }
  );
  return result.uri;
}

export const storageService = {
  async saveNote(note: PhotoNoteInput): Promise<PhotoNote> {
    try {
      const compressedUri = await compressPhoto(note.photoUri);
      const notes = await this.getAllNotes();
      const newNote: PhotoNote = {
        ...note,
        photoUri: compressedUri,
        id: Date.now().toString(),
        dateCreated: new Date(),
      };
      notes.push(newNote);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      return newNote;
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  },

  async getAllNotes(): Promise<PhotoNote[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const notes = JSON.parse(data) as PhotoNote[];
        return notes.map((note) => ({
          ...note,
          dateCreated: new Date(note.dateCreated),
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting notes:", error);
      return [];
    }
  },

  async getNoteById(id: string): Promise<PhotoNote | null> {
    try {
      const notes = await this.getAllNotes();
      return notes.find((note) => note.id === id) || null;
    } catch (error) {
      console.error("Error getting note by id:", error);
      return null;
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const filteredNotes = notes.filter((note) => note.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotes));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  },
};
