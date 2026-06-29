import { convex } from './convexClient';
import { api } from '../convex/_generated/api';

export class ProfileService {
  private static instance: ProfileService;

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      console.log('Starting profile picture upload for user:', userId);
      console.log('File details:', { name: file.name, type: file.type, size: file.size });

      const base64Data = await this.compressImage(file);
      console.log('Image compressed to base64, size:', base64Data.length);

      if (base64Data.length > 900_000) {
        throw new Error('Profile picture is too large. Please use a smaller image.');
      }

      await convex.mutation(api.users.updateProfile as any, {
        userId: userId as any,
        photoUrl: base64Data,
      });
      console.log('Profile document updated with photoUrl');

      return base64Data;
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      throw new Error(`Failed to upload profile picture: ${error.message || 'Unknown error'}`);
    }
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async updateProfile(userId: string, updates: any): Promise<void> {
    try {
      console.log('Updating user profile:', { userId, updates });

      await convex.mutation(api.users.updateProfile as any, {
        userId: userId as any,
        ...updates,
      });

      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }
}

export default ProfileService;
