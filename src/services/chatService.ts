import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
  senderPhotoUrl?: string;
  text: string;
  createdAt: any;
}

export interface Conversation {
  studentId: string;
  studentName: string;
  studentPhotoUrl?: string;
  adminId: string;
  adminPhotoUrl?: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount?: number;
}

class ChatService {
  private static instance: ChatService;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Send a message (works for both Student and Admin)
  async sendMessage(
    studentId: string,
    studentName: string,
    senderId: string,
    text: string,
    adminId: string = 'admin',
    senderPhotoUrl?: string
  ) {
    const conversationRef = doc(db, 'conversations', studentId);
    const existingDoc = await getDoc(conversationRef);

    // Get sender name
    let senderName = studentName;
    if (senderId !== studentId) {
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        senderName = senderDoc.data().displayName || 'Admin';
      }
    }

    // Ensure conversation exists and update last message
    await setDoc(conversationRef, {
      studentId,
      studentName,
      adminId,
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      unreadCount: senderId === studentId ? (existingDoc.exists() ? (existingDoc.data()?.unreadCount || 0) + 1 : 1) : (senderId === adminId ? 0 : (existingDoc.exists() ? (existingDoc.data()?.unreadCount || 0) + 1 : 1))
    }, { merge: true });

    // Add message to subcollection
    await addDoc(
      collection(db, 'conversations', studentId, 'messages'),
      {
        senderId,
        senderName,
        senderPhotoUrl,
        text,
        createdAt: serverTimestamp()
      }
    );
  }

  // Reset unread count for a conversation
  async markAsRead(studentId: string) {
    const conversationRef = doc(db, 'conversations', studentId);
    await updateDoc(conversationRef, {
      unreadCount: 0
    });
  }

  // Listen to messages in a specific conversation
  subscribeToMessages(studentId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'conversations', studentId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages);
    });
  }

  // Get user photo URL by user ID
  async getUserPhotoUrl(userId: string): Promise<string | undefined> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().photoUrl;
      }
    } catch (error) {
      console.error('Error getting user photo URL:', error);
    }
    return undefined;
  }

  // Admin: Listen to all conversations
  subscribeToConversations(callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      // Fetch user data for each conversation to get photo URLs
      const conversationsWithPhotos = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Conversation;
          
          // Get student photo URL
          try {
            const studentDocSnap = await getDoc(doc(db, 'users', data.studentId));
            if (studentDocSnap.exists()) {
              data.studentPhotoUrl = studentDocSnap.data().photoUrl;
            }
          } catch (e) {
            console.log('Error fetching student photo:', e);
          }
          
          // Get admin photo URL if available
          if (data.adminId) {
            try {
              const adminDocSnap = await getDoc(doc(db, 'users', data.adminId));
              if (adminDocSnap.exists()) {
                data.adminPhotoUrl = adminDocSnap.data().photoUrl;
              }
            } catch (e) {
              console.log('Error fetching admin photo:', e);
            }
          }
          
          return { id: docSnap.id, ...data };
        })
      );
      callback(conversationsWithPhotos);
    });
  }

  // Get Admin UID (utility to find the admin user)
  async getAdminId(): Promise<string> {
    const q = query(
      collection(db, 'users'),
      where('userType', '==', 'admin')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return 'admin'; // Fallback
  }
}

export const chatService = ChatService.getInstance();
