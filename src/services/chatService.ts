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
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
  senderPhotoUrl?: string;
  text: string;
  createdAt: any;
  readBy?: string[]; // Array of user IDs who have read the message
  audioUrl?: string; // Voice message audio URL
  audioDuration?: number; // Voice message duration in seconds
  messageType?: 'text' | 'voice'; // Type of message
}

export interface Conversation {
  id?: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl?: string;
  adminId: string;
  adminName?: string;
  adminPhotoUrl?: string;
  lastMessage: string;
  lastMessageTime: any;
  lastSenderId?: string;
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
  // IMPORTANT: This now properly uses the specific adminId to create unique conversations
  async sendMessage(
    studentId: string,
    studentName: string,
    senderId: string,
    text: string,
    adminId: string, // Now required - the specific admin to message
    senderPhotoUrl?: string
  ) {
    // Each student has a unique conversation with EACH admin
    // The conversationId is: studentId_adminId (e.g., "studentUID_adminUID")
    const conversationId = `${studentId}_${adminId}`;
    const conversationRef = doc(db, 'conversations', conversationId);
    const existingDoc = await getDoc(conversationRef);

    // Get sender name
    let senderName = studentName;
    let actualAdminId = adminId;
    
    if (senderId !== studentId) {
      // Sender is an admin - get admin's name
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        senderName = senderDoc.data().displayName || 'Admin';
        actualAdminId = senderId; // Use the actual sender's ID as admin
      }
    }

    // Get admin name for the conversation
    let adminName = 'Admin';
    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (adminDoc.exists()) {
        adminName = adminDoc.data().displayName || 'Admin';
      }
    } catch (e) {
      console.log('Error fetching admin name:', e);
    }

    // Ensure conversation exists and update last message
    await setDoc(conversationRef, {
      studentId,
      studentName,
      adminId: actualAdminId,
      adminName,
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: existingDoc.exists() ? (existingDoc.data()?.unreadCount || 0) + 1 : 1
    }, { merge: true });

    // Add message to subcollection
    await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      {
        senderId,
        senderName,
        senderPhotoUrl,
        text,
        createdAt: serverTimestamp()
      }
    );
  }

  // Send a voice message
  async sendVoiceMessage(
    studentId: string,
    studentName: string,
    senderId: string,
    audioBlob: Blob,
    duration: number,
    adminId: string,
    senderPhotoUrl?: string
  ) {
    const conversationId = `${studentId}_${adminId}`;
    const conversationRef = doc(db, 'conversations', conversationId);
    const existingDoc = await getDoc(conversationRef);

    // Get sender name
    let senderName = studentName;
    let actualAdminId = adminId;
    
    if (senderId !== studentId) {
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        senderName = senderDoc.data().displayName || 'Admin';
        actualAdminId = senderId;
      }
    }

    // Get admin name for the conversation
    let adminName = 'Admin';
    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (adminDoc.exists()) {
        adminName = adminDoc.data().displayName || 'Admin';
      }
    } catch (e) {
      console.log('Error fetching admin name:', e);
    }

    // Upload audio to Firebase Storage
    const audioFileName = `voice_messages/${conversationId}/${Date.now()}.webm`;
    const audioRef = ref(storage, audioFileName);
    await uploadBytes(audioRef, audioBlob);
    const audioUrl = await getDownloadURL(audioRef);

    // Ensure conversation exists and update last message
    await setDoc(conversationRef, {
      studentId,
      studentName,
      adminId: actualAdminId,
      adminName,
      lastMessage: '🎤 Voice message',
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: existingDoc.exists() ? (existingDoc.data()?.unreadCount || 0) + 1 : 1
    }, { merge: true });

    // Add voice message to subcollection
    await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      {
        senderId,
        senderName,
        senderPhotoUrl,
        text: '',
        audioUrl,
        audioDuration: duration,
        messageType: 'voice',
        createdAt: serverTimestamp()
      }
    );
  }

  // Reset unread count for a conversation
  async markAsRead(conversationId: string) {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      unreadCount: 0
    });
  }

  // Listen to messages in a specific conversation
  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
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

  // Mark a message as read by a user
  async markMessageAsRead(conversationId: string, messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      const readBy: string[] = messageData.readBy || [];
      
      if (!readBy.includes(userId)) {
        await updateDoc(messageRef, {
          readBy: [...readBy, userId]
        });
      }
    }
  }

  // Mark all messages in a conversation as read
  async markAllMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(async (docSnap) => {
      const messageData = docSnap.data();
      const readBy: string[] = messageData.readBy || [];

      // Only update if user hasn't already read this message
      if (!readBy.includes(userId)) {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnap.id);
        await updateDoc(messageRef, {
          readBy: [...readBy, userId]
        });
      }
    });

    await Promise.all(updatePromises);
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
  subscribeToAllConversations(callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const conversations = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Conversation;
          
          // Get student photo URL if missing
          if (!data.studentPhotoUrl) {
            try {
              const studentDoc = await getDoc(doc(db, 'users', data.studentId));
              if (studentDoc.exists()) {
                data.studentPhotoUrl = studentDoc.data().photoUrl;
              }
            } catch (e) {
              console.log('Error fetching student photo:', e);
            }
          }
          
          return { id: docSnap.id, ...data };
        })
      );
      callback(conversations);
    });
  }

  // Admin: Listen to conversations specific to this admin
  subscribeToConversationsByAdmin(adminId: string, callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      where('adminId', '==', adminId), // Filter by specific admin
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
                data.adminName = adminDocSnap.data().displayName || 'Admin';
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

  // Student: Listen to conversations for a specific student
  // This filters conversations so each student only sees their conversations with admins or instructors
  subscribeToConversationsByStudent(studentId: string, callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      where('studentId', '==', studentId), // Filter by specific student
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
          
          // Get admin/instructor photo URL if available
          if (data.adminId) {
            try {
              const adminDocSnap = await getDoc(doc(db, 'users', data.adminId));
              if (adminDocSnap.exists()) {
                data.adminPhotoUrl = adminDocSnap.data().photoUrl;
                data.adminName = adminDocSnap.data().displayName || (adminDocSnap.data().userType === 'instructor' ? 'Instructor' : 'Admin');
              }
            } catch (e) {
              console.log('Error fetching admin/instructor photo:', e);
            }
          }
          
          return { id: docSnap.id, ...data };
        })
      );
      callback(conversationsWithPhotos);
    });
  }

  // Get all Admins and Instructors for students to chat with
  async getAllStaff(): Promise<any[]> {
    const q = query(
      collection(db, 'users'),
      where('userType', 'in', ['admin', 'instructor'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  }

  // Get Admin UID (utility to find the first admin user)
  async getAdminId(): Promise<string> {
    const staff = await this.getAllStaff();
    const admins = staff.filter(s => s.userType === 'admin');
    if (admins.length > 0) {
      return admins[0].uid;
    }
    if (staff.length > 0) {
      return staff[0].uid;
    }
    return 'admin'; // Fallback
  }

  // Set typing indicator
  async setTyping(conversationId: string, userId: string, userName: string, isTyping: boolean): Promise<void> {
    const typingRef = doc(db, 'typing', conversationId, 'indicators', userId);
    
    if (isTyping) {
      await setDoc(typingRef, {
        userId,
        userName,
        isTyping: true,
        timestamp: serverTimestamp()
      }, { merge: true });
      
      // Auto-clear typing after 3 seconds
      setTimeout(async () => {
        await deleteDoc(typingRef);
      }, 3000);
    } else {
      await deleteDoc(typingRef);
    }
  }

  // Subscribe to typing indicators
  subscribeToTyping(conversationId: string, callback: (typingUsers: { userId: string; userName: string }[]) => void): () => void {
    const q = collection(db, 'typing', conversationId, 'indicators');
    
    return onSnapshot(q, (snapshot) => {
      const typingUsers = snapshot.docs
        .filter(doc => doc.data().isTyping)
        .map(doc => ({
          userId: doc.id,
          userName: doc.data().userName
        }));
      callback(typingUsers);
    });
  }
}

export const chatService = ChatService.getInstance();
