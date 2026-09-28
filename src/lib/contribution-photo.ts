import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const bucket = 'fp-contributions';
const maxBytes = 2 * 1024 * 1024;

export async function chooseContributionPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > 1200)
    context.resize(asset.width >= asset.height ? { width: 1200, height: null } : { width: null, height: 1200 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.65, format: SaveFormat.JPEG });
  return saved.uri;
}

export async function uploadContributionPhoto(groupId: string, userId: string, proposalId: string, uri: string) {
  if (!supabase) throw new Error('not_configured');
  const data = Platform.OS === 'web'
    ? await fetch(uri).then((response) => response.arrayBuffer())
    : await new File(uri).arrayBuffer();
  if (data.byteLength > maxBytes) throw new Error('photo_too_large');
  const path = `${groupId}/${userId}/${proposalId}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function contributionPhotoUrl(path: string) {
  if (/^(file:|blob:|data:)/.test(path)) return path;
  if (!supabase) throw new Error('not_configured');
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
