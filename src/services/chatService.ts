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
  text: string;
  createdAt: any;
}

export interface Conversation {
  studentId: string;
  studentName: string;
  adminId: string;
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
    adminId: string = 'admin' // Default admin ID, should be replaced with actual admin UID
  ) {
    const conversationRef = doc(db, 'conversations', studentId);
    const existingDoc = await getDoc(conversationRef);

    // Ensure conversation exists and update last message
    await setDoc(conversationRef, {
      studentId,
      studentName,
      adminId,
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      unreadCount: senderId === studentId ? (existingDoc.exists() ? (existingDoc.data()?.unreadCount || 0) + 1 : 1) : 0
    }, { merge: true });

    // Add message to subcollection
    await addDoc(
      collection(db, 'conversations', studentId, 'messages'),
      {
        senderId,
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

  // Admin: Listen to all conversations
  subscribeToConversations(callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Conversation[];
      callback(conversations);
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
