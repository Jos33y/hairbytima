// ==========================================================================
// Storage Service - Supabase Storage for Image Uploads
// ==========================================================================

import { supabase } from './supabase';

const BUCKET_NAME = 'images';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Generate a unique filename
 */
const generateFileName = (file, folder = 'products') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop().toLowerCase();
  return `${folder}/${timestamp}-${randomString}.${extension}`;
};

/**
 * Validate file before upload
 */
const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
};

export const storageService = {
  /**
   * Upload a single image
   * @param {File} file - The file to upload
   * @param {string} folder - Folder path (products, categories, etc.)
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadImage(file, folder = 'products') {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const filePath = generateFileName(file, folder);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  },

  /**
   * Upload multiple images
   * @param {File[]} files - Array of files to upload
   * @param {string} folder - Folder path
   * @returns {Promise<Array<{url: string, path: string}>>}
   */
  async uploadMultipleImages(files, folder = 'products') {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  },

  /**
   * Delete an image by path
   * @param {string} path - The storage path of the image
   */
  async deleteImage(path) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete image.');
    }

    return true;
  },

  /**
   * Delete multiple images
   * @param {string[]} paths - Array of storage paths
   */
  async deleteMultipleImages(paths) {
    if (!paths || paths.length === 0) return true;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete images.');
    }

    return true;
  },

  /**
   * Get public URL for an image path
   * @param {string} path - The storage path
   * @returns {string} Public URL
   */
  getPublicUrl(path) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Extract path from full URL
   * @param {string} url - The full public URL
   * @returns {string} Storage path
   */
  getPathFromUrl(url) {
    if (!url) return null;
    
    // URL format: https://xxx.supabase.co/storage/v1/object/public/images/folder/filename.ext
    const match = url.match(/\/images\/(.+)$/);
    return match ? match[1] : null;
  },

  /**
   * Validate file (exposed for UI validation)
   */
  validateFile,

  /**
   * Get allowed types (for input accept attribute)
   */
  getAllowedTypes() {
    return ALLOWED_TYPES.join(',');
  },

  /**
   * Get max file size in MB
   */
  getMaxFileSizeMB() {
    return MAX_FILE_SIZE / (1024 * 1024);
  },
};

