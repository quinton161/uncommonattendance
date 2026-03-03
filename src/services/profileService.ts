import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      
      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}_profile_${Date.now()}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `profile-pictures/${fileName}`);
      
      // Upload file
      console.log('📤 Uploading file to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Profile picture uploaded successfully:', downloadURL);
      
      // Update user document with photo URL
      await updateDoc(doc(db, 'users', userId), {
        photoUrl: downloadURL,
        updatedAt: new Date()
      });
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture');
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
