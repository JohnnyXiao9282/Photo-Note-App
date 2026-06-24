import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { storageService } from "@/services/storage";
import type { PhotoNote } from "@/types/photo-note";

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<PhotoNote | null>(null);
  const [loading, setLoading] = useState(true);

  const loadNote = useCallback(async () => {
    if (!params.id) {
      Alert.alert("Error", "No note ID provided", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    try {
      setLoading(true);
      const loadedNote = await storageService.getNoteById(params.id);
      if (loadedNote) {
        setNote(loadedNote);
      } else {
        Alert.alert("Error", "Note not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error loading note:", error);
      Alert.alert("Error", "Failed to load note", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const handleDelete = () => {
    if (!note) return;

    const doDelete = async () => {
      try {
        await storageService.deleteNote(note.id);
        router.back();
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this note?")) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText>Loading...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!note) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText>Note not found</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={styles.headerButton}>← Back</ThemedText>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <ThemedText style={[styles.headerButton, styles.deleteButton]}>
              Delete
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: note.photoUri }} style={styles.photo} />

          <View style={styles.infoSection}>
            <ThemedText type="title" style={styles.title}>
              {note.title}
            </ThemedText>

            <ThemedText style={styles.date}>
              {formatDate(note.dateCreated)}
            </ThemedText>

            <View style={styles.noteSeparator} />

            <ThemedText
              style={[styles.noteText, !note.note && styles.noNoteText]}
            >
              {note.note || "No details described"}
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerButton: {
    fontSize: 16,
    color: "#208AEF",
  },
  deleteButton: {
    color: "#FF3B30",
  },
  content: {
    paddingBottom: Spacing.six,
  },
  photo: {
    width: "100%",
    height: 400,
    backgroundColor: "#ccc",
  },
  infoSection: {
    padding: Spacing.four,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: Spacing.two,
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: Spacing.four,
  },
  noteSeparator: {
    height: 1,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.2)",
    marginBottom: Spacing.four,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
  },
  noNoteText: {
    opacity: 0.35,
    fontStyle: "italic",
  },
});
