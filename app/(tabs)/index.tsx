import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

type AspectRatio = '1:1' | '9:16' | '16:9';
type Model = 'flux' | 'turbo';

interface GenerationParams {
  width: number;
  height: number;
  seed: number;
  model: Model;
  nologo: string;
  enhance: string;
  token: string;
}

export default function ImageGeneratorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>('flux');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [enhanceEnabled, setEnhanceEnabled] = useState(false);
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0);

  const getAspectRatioDimensions = (ratio: AspectRatio): { width: number; height: number } => {
    switch (ratio) {
      case '1:1':
        return { width: 1024, height: 1024 };
      case '9:16':
        return { width: 720, height: 1280 };
      case '16:9':
        return { width: 1280, height: 720 };
      default:
        return { width: 1024, height: 1024 };
    }
  };

  const generateRandomSeed = (): number => {
    return Math.floor(Math.random() * 10000);
  };

  const waitIfNeeded = async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastGenerationTime;
    const minInterval = 5000; // 5 seconds

    if (timeSinceLastCall < minInterval) {
      const waitTime = minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for image generation');
      return;
    }

    setIsGenerating(true);

    try {
      // Wait 5 seconds between calls to avoid API errors
      await waitIfNeeded();

      const dimensions = getAspectRatioDimensions(selectedAspectRatio);
      const seed = generateRandomSeed();

      const params: GenerationParams = {
        width: dimensions.width,
        height: dimensions.height,
        seed: seed,
        model: selectedModel,
        nologo: 'true',
        enhance: enhanceEnabled ? 'true' : 'false',
        token: "3G9MYD0KtswXWJoJ"

      };

      const encodedPrompt = encodeURIComponent(prompt.trim());
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

      const queryParams = new URLSearchParams({
        width: params.width.toString(),
        height: params.height.toString(),
        seed: params.seed.toString(),
        model: params.model,
        nologo: params.nologo,
        enhance: params.enhance,
      });

      const fullUrl = `${url}?${queryParams.toString()}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // For React Native, we can directly use the URL as the image source
      setGeneratedImageUri(fullUrl);
      setLastGenerationTime(Date.now());

    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveImage = async () => {
    if (!generatedImageUri) return;

    try {
      // Request permission to access media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your gallery');
        return;
      }

      Alert.alert('Saving...', 'Downloading and saving image to gallery...');

      // Download the image
      const fileUri = FileSystem.documentDirectory + `generated_image_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(generatedImageUri, fileUri);

      if (downloadResult.status === 200) {
        // Save to media library
        const asset = await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        Alert.alert('Success!', 'Image saved to your gallery successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image to gallery. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>AI Image Generator</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Create stunning images with AI
          </Text>
        </View>

        {/* Prompt Input */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Prompt</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.secondaryBackground,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Describe the image you want to generate..."
            placeholderTextColor={colors.placeholder}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Model Selection */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Model</Text>
          <View style={styles.optionRow}>
            {(['flux', 'turbo'] as Model[]).map((model) => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedModel === model ? colors.accent : colors.secondaryBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedModel(model)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: selectedModel === model ? colors.cardBackground : colors.text,
                    },
                  ]}
                >
                  {model.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Aspect Ratio Selection */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aspect Ratio</Text>
          <View style={styles.optionRow}>
            {(['1:1', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
              <TouchableOpacity
                key={ratio}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedAspectRatio === ratio ? colors.accent : colors.secondaryBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedAspectRatio(ratio)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: selectedAspectRatio === ratio ? colors.cardBackground : colors.text,
                    },
                  ]}
                >
                  {ratio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enhance Toggle */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Enhance</Text>
              <Text style={[styles.toggleDescription, { color: colors.icon }]}>
                Improve image quality and details
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: enhanceEnabled ? colors.accent : colors.secondaryBackground,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setEnhanceEnabled(!enhanceEnabled)}
            >
              <View
                style={[
                  styles.toggleIndicator,
                  {
                    backgroundColor: enhanceEnabled ? colors.cardBackground : colors.border,
                    transform: [{ translateX: enhanceEnabled ? 20 : 2 }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            {
              backgroundColor: colors.accent,
              opacity: isGenerating ? 0.6 : 1,
            },
          ]}
          onPress={generateImage}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.cardBackground} size="small" />
              <Text style={[styles.generateButtonText, { color: colors.cardBackground }]}>
                Generating...
              </Text>
            </View>
          ) : (
            <Text style={[styles.generateButtonText, { color: colors.cardBackground }]}>
              Generate Image
            </Text>
          )}
        </TouchableOpacity>

        {/* Generated Image */}
        {generatedImageUri && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Generated Image</Text>
            <View style={[styles.warningContainer, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[styles.warningText, { color: colors.warning }]}>
                ⚠️ This image is temporary and will be lost when you generate a new one. Save it now!
              </Text>
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: generatedImageUri }}
                style={[
                  styles.generatedImage,
                  {
                    aspectRatio: selectedAspectRatio === '1:1' ? 1 :
                      selectedAspectRatio === '9:16' ? 9 / 16 : 16 / 9,
                  },
                ]}
                contentFit="cover"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.warning },
              ]}
              onPress={saveImage}
            >
              <Text style={[styles.saveButtonText, { color: colors.cardBackground }]}>
                💾 Save to Gallery
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  generatedImage: {
    width: '100%',
    borderRadius: 12,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 2,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
