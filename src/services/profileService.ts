import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from './firebase';

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
      console.log('📸 Starting profile picture upload for user:', userId);
      
      // Check if storage is initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      // Create a unique filename
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}_profile_${Date.now()}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `profile-pictures/${fileName}`);
      
      // Set metadata
      const metadata = {
        contentType: file.type || 'image/jpeg'
      };

      // Upload file
      console.log('📤 Uploading file to Firebase Storage...', fileName);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Profile picture uploaded successfully:', downloadURL);
      
      // Update user document with photo URL
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        photoUrl: downloadURL,
        updatedAt: new Date()
      });
      
      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error);
      
      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload failed: You do not have permission to upload files. Please check Firebase Storage rules.');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Upload failed: Network timeout. Please check your internet connection.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload failed: User canceled the upload.');
      }
      
      throw new Error(`Failed to upload profile picture: ${error.message || 'Unknown error'}`);
    }
  }

  async updateProfile(userId: string, updates: any): Promise<void> {
    try {
      console.log('🔄 Updating user profile:', { userId, updates });
      
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
