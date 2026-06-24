import { type CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { storageService } from "@/services/storage";

export default function AddNoteScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  // Automatically request permission as soon as it's available to ask
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleSave = async () => {
    if (!capturedPhoto) {
      Alert.alert("No Photo", "Please take a photo first");
      return;
    }

    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    try {
      setIsSaving(true);
      await storageService.saveNote({
        photoUri: capturedPhoto,
        title: title.trim(),
        note: note.trim(),
      });

      // Navigate home with a success flag — works on both web and native
      router.replace({ pathname: "/", params: { saved: "1" } } as never);
    } catch (error) {
      console.error("Error saving note:", error);
      if (Platform.OS === "web") {
        window.alert("Failed to save note. Please try again.");
      } else {
        Alert.alert("Error", "Failed to save note");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Still loading permission state
  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText type="subtitle">Requesting camera access…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Undetermined — waiting for the system dialog (triggered by useEffect above)
  if (!permission.granted && permission.canAskAgain) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText type="subtitle">Requesting camera access…</ThemedText>
          <Pressable style={styles.button} onPress={requestPermission}>
            <ThemedText style={styles.buttonText}>Allow Camera</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Permanently denied — user must go to Settings
  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText type="title" style={styles.centeredText}>
            Camera Access Denied
          </ThemedText>
          <ThemedText style={styles.centeredText}>
            Please enable camera access in your device Settings to use this
            feature.
          </ThemedText>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // If photo is captured, show the form
  if (capturedPhoto) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                  <ThemedText style={styles.headerButton}>Cancel</ThemedText>
                </Pressable>
                <ThemedText type="subtitle">Add Note</ThemedText>
                <Pressable onPress={handleSave} disabled={isSaving}>
                  <ThemedText style={[styles.headerButton, styles.saveButton]}>
                    {isSaving ? "Saving..." : "Save"}
                  </ThemedText>
                </Pressable>
              </View>

              <Image
                source={{ uri: capturedPhoto }}
                style={styles.previewImage}
              />

              <Pressable style={styles.retakeButton} onPress={retakePhoto}>
                <ThemedText style={styles.retakeButtonText}>
                  Retake Photo
                </ThemedText>
              </Pressable>

              <View style={styles.inputContainer}>
                <ThemedText type="subtitle" style={styles.label}>
                  Title <ThemedText style={styles.required}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, titleError && styles.inputError]}
                  placeholder="Enter title..."
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (text.trim()) setTitleError(false);
                  }}
                  maxLength={100}
                />
                {titleError && (
                  <ThemedText style={styles.errorText}>
                    ⚠️ Please enter a title before saving
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="subtitle" style={styles.label}>
                  Note
                </ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your note..."
                  placeholderTextColor="#999"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Show camera
  return (
    <ThemedView style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <SafeAreaView style={styles.cameraOverlay} edges={["top"]}>
          <View style={styles.cameraHeader}>
            <Pressable
              onPress={() => router.back()}
              style={styles.cameraHeaderButton}
            >
              <ThemedText style={styles.cameraHeaderText}>✕</ThemedText>
            </Pressable>
            <Pressable
              onPress={toggleCameraFacing}
              style={styles.cameraHeaderButton}
            >
              <ThemedText style={styles.cameraHeaderText}>⟲</ThemedText>
            </Pressable>
          </View>

          <View style={styles.cameraFooter}>
            <Pressable style={styles.galleryButton} onPress={pickImage}>
              <ThemedText style={styles.galleryButtonText}>📷</ThemedText>
            </Pressable>

            <Pressable style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </Pressable>

            <View style={styles.galleryButton} />
          </View>
        </SafeAreaView>
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centeredText: {
    textAlign: "center",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cameraHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraHeaderText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  cameraFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Spacing.five,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryButtonText: {
    fontSize: 24,
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  headerButton: {
    fontSize: 16,
    color: "#208AEF",
  },
  saveButton: {
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#ccc",
  },
  retakeButton: {
    alignSelf: "center",
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  retakeButtonText: {
    color: "#208AEF",
    fontSize: 16,
  },
  inputContainer: {
    marginTop: Spacing.four,
  },
  label: {
    marginBottom: Spacing.two,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.05)",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#208AEF",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginTop: 4,
  },
  required: {
    color: "#FF3B30",
  },
});
