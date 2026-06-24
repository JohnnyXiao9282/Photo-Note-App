import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { storageService } from "@/services/storage";
import type { PhotoNote } from "@/types/photo-note";

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ saved?: string }>();
  const [notes, setNotes] = useState<PhotoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastOpacity] = useState(new Animated.Value(0));

  // Show success toast whenever we land here with saved=1
  useEffect(() => {
    if (params.saved === "1") {
      // Strip the param from the URL immediately so refresh doesn't re-show the toast
      router.replace("/" as never);

      toastOpacity.setValue(1);
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [params.saved, toastOpacity, router]);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const loadedNotes = await storageService.getAllNotes();
      // Sort by date, newest first
      loadedNotes.sort(
        (a, b) => b.dateCreated.getTime() - a.dateCreated.getTime()
      );
      setNotes(loadedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const renderNote = ({ item }: { item: PhotoNote }) => (
    <Pressable
      style={({ pressed }) => [
        styles.noteCard,
        pressed && styles.noteCardPressed,
      ]}
      onPress={() =>
        router.push({ pathname: "/detail", params: { id: item.id } } as never)
      }
    >
      <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
      <View style={styles.noteContent}>
        <ThemedText type="subtitle" numberOfLines={1} style={styles.noteTitle}>
          {item.title}
        </ThemedText>
        <ThemedText
          type="small"
          numberOfLines={2}
          style={[styles.noteText, !item.note && styles.noNoteText]}
        >
          {item.note || "No details described"}
        </ThemedText>
        <ThemedText type="small" style={styles.noteDate}>
          {formatDate(item.dateCreated)}
        </ThemedText>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText type="title" style={styles.emptyTitle}>
        No Photo Notes Yet
      </ThemedText>
      <ThemedText type="default" style={styles.emptyText}>
        Tap the + button to create your first photo note
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Success toast */}
        <Animated.View
          style={[styles.toast, { opacity: toastOpacity }]}
          pointerEvents="none"
        >
          <ThemedText style={styles.toastText}>
            ✅ Note saved successfully!
          </ThemedText>
        </Animated.View>

        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Photo Notes
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => router.push("/add-note" as never)}
          >
            <ThemedText type="title" style={styles.addButtonText}>
              +
            </ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            notes.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
        />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 32,
    marginTop: -2,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  listContentEmpty: {
    flex: 1,
  },
  noteCard: {
    flexDirection: "row",
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    overflow: "hidden",
  },
  noteCardPressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  noteContent: {
    flex: 1,
    marginLeft: Spacing.three,
    justifyContent: "space-between",
  },
  noteTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  noteText: {
    opacity: 0.7,
    flex: 1,
  },
  noNoteText: {
    opacity: 0.35,
    fontStyle: "italic",
  },
  noteDate: {
    opacity: 0.5,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    marginBottom: Spacing.three,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  toast: {
    position: "absolute",
    bottom: Spacing.five,
    alignSelf: "center",
    backgroundColor: "#1a7a3a",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
    borderRadius: 24,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
