import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env, cloudinaryEnabled } from '../config/env';
import { logger } from '../config/logger';

/** Where generated audio lives when Cloudinary isn't configured; served at /audio. */
export const AUDIO_DIR = join(process.cwd(), 'audio');

export function ensureAudioDir(): void {
  mkdirSync(AUDIO_DIR, { recursive: true });
}

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

/** Upload an audio buffer to Cloudinary and resolve its CDN URL. */
function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Cloudinary handles audio under the 'video' resource type.
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'hey-podcast/episodes', public_id: publicId },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary: empty upload result'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Persist an audio buffer and return its public URL. Uploads to Cloudinary's
 * CDN when configured; otherwise falls back to local disk (served at /audio).
 */
export async function saveAudio(buffer: Buffer, ext = 'wav'): Promise<{ file: string; url: string }> {
  const id = randomUUID();

  if (cloudinaryEnabled) {
    const url = await uploadToCloudinary(buffer, id);
    logger.info({ url }, 'storage: uploaded to Cloudinary');
    return { file: id, url };
  }

  // Local-disk fallback.
  ensureAudioDir();
  const file = `${id}.${ext}`;
  writeFileSync(join(AUDIO_DIR, file), buffer);
  return { file, url: `${env.publicUrl}/audio/${file}` };
}
