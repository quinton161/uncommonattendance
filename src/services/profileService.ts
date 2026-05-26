import { updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export class ProfileService {
  private static instance: ProfileService;

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Upload profile picture using base64 encoding stored in Firestore.
   * This avoids Firebase Storage which requires a paid (Blaze) plan.
   */
  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      console.log('📸 Starting profile picture upload for user:', userId);
      console.log('📸 File details:', { name: file.name, type: file.type, size: file.size });
      
      // Compress the image before converting to base64
      const base64Data = await this.compressImage(file);
      console.log('✅ Image compressed to base64, size:', base64Data.length);

      // FIX: Check document size limit (Firestore has 1MB limit)
      if (base64Data.length > 900_000) {
        throw new Error('Profile picture is too large. Please use a smaller image.');
      }

      // Update user document with photo URL (base64)
      console.log('📝 Updating Firestore user document...');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        photoUrl: base64Data,
        updatedAt: new Date()
      });
      console.log('✅ Firestore document updated with photoUrl');
      
      return base64Data;
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error);
      throw new Error(`Failed to upload profile picture: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Compress image and convert to base64 data URL
   */
  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions (max 200x200 for profile pictures)
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

          // Create canvas and draw compressed image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.7 quality)
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
      console.log('🔄 Updating user profile:', { userId, updates });
      
      // Handle photoUrl specially - if it's a base64 string, keep it as is
      // Otherwise, it's already a URL from Firebase Auth
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date()
      });
      
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }
}

export default ProfileService;
