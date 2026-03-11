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
  deleteDoc,
  increment
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
  deliveredTo?: string[]; // Array of user IDs who have received the message
  deletedFor?: string[]; // Array of user IDs who deleted this message
  isDeletedForEveryone?: boolean; // If message was deleted for everyone
  audioUrl?: string; // Voice message audio URL
  audioDuration?: number; // Voice message duration in seconds
  fileUrl?: string; // Attachment URL
  fileName?: string; // Attachment file name
  fileType?: string; // MIME type
  messageType?: 'text' | 'voice' | 'image' | 'file'; // Type of message
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  reactions?: Record<string, string[]>; // emoji -> userIds[]
  isGroupMessage?: boolean;
  isForwarded?: boolean;
  status?: 'sent' | 'delivered' | 'read';
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
  isGroup?: boolean;
  groupName?: string;
  groupPhotoUrl?: string;
  memberIds?: string[];
  createdBy?: string;
}

class ChatService {
  private static instance: ChatService;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Create a new group chat
  async createGroup(name: string, memberIds: string[], createdBy: string, groupPhotoUrl?: string): Promise<string> {
    const allMembers = [...memberIds, createdBy];
    const uniqueMembers = allMembers.filter((value, index, self) => self.indexOf(value) === index);
    
    const conversationData: any = {
      isGroup: true,
      groupName: name,
      memberIds: uniqueMembers,
      createdBy,
      lastMessage: 'Group created',
      lastMessageTime: serverTimestamp(),
      lastSenderId: createdBy,
      unreadCount: 0
    };

    if (groupPhotoUrl) {
      conversationData.groupPhotoUrl = groupPhotoUrl;
    }

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);
    return docRef.id;
  }

  // Send a message to a group
  async sendGroupMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    text: string,
    senderPhotoUrl?: string,
    replyTo?: { id: string; text: string; senderName: string }
  ) {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    await updateDoc(conversationRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: increment(1)
    });

    const messageData: any = {
      senderId,
      senderName,
      senderPhotoUrl,
      text,
      createdAt: serverTimestamp(),
      isGroupMessage: true,
      status: 'sent'
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);
  }

  // Send a message (works for both Student and Admin)
  async sendMessage(
    studentId: string,
    studentName: string,
    senderId: string,
    text: string,
    adminId: string,
    senderPhotoUrl?: string,
    replyTo?: { id: string; text: string; senderName: string }
  ) {
    const conversationId = `${studentId}_${adminId}`;
    const conversationRef = doc(db, 'conversations', conversationId);
    const existingDoc = await getDoc(conversationRef);

    let senderName = studentName;
    let actualAdminId = adminId;
    
    if (senderId !== studentId) {
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        senderName = senderDoc.data().displayName || 'Admin';
        actualAdminId = senderId;
      }
    }

    let adminName = 'Admin';
    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (adminDoc.exists()) {
        adminName = adminDoc.data().displayName || 'Admin';
      }
    } catch (e) {
      console.log('Error fetching admin name:', e);
    }

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

    const messageData: any = {
      senderId,
      senderName,
      senderPhotoUrl,
      text,
      createdAt: serverTimestamp(),
      status: 'sent'
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      messageData
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

    let senderName = studentName;
    let actualAdminId = adminId;
    
    if (senderId !== studentId) {
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        senderName = senderDoc.data().displayName || 'Admin';
        actualAdminId = senderId;
      }
    }

    let adminName = 'Admin';
    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (adminDoc.exists()) {
        adminName = adminDoc.data().displayName || 'Admin';
      }
    } catch (e) {
      console.log('Error fetching admin name:', e);
    }

    const audioFileName = `voice_messages/${conversationId}/${Date.now()}.webm`;
    const audioRef = ref(storage, audioFileName);
    await uploadBytes(audioRef, audioBlob);
    const audioUrl = await getDownloadURL(audioRef);

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
        createdAt: serverTimestamp(),
        status: 'sent'
      }
    );
  }

  // Send a file or image message
  async sendFileMessage(
    studentId: string,
    studentName: string,
    senderId: string,
    file: File,
    adminId: string,
    senderPhotoUrl?: string
  ) {
    const conversationId = `${studentId}_${adminId}`;
    const conversationRef = doc(db, 'conversations', conversationId);
    const existingDoc = await getDoc(conversationRef);

    let senderName = studentName;
    let actualAdminId = adminId;
    
    if (senderId !== studentId) {
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        senderName = senderDoc.data().displayName || 'Admin';
        actualAdminId = senderId;
      }
    }

    let adminName = 'Admin';
    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (adminDoc.exists()) {
        adminName = adminDoc.data().displayName || 'Admin';
      }
    } catch (e) {
      console.log('Error fetching admin name:', e);
    }

    const isImage = file.type.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';
    const lastMessagePreview = isImage ? '📷 Image' : `📄 ${file.name}`;

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `chat_attachments/${conversationId}/${fileName}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    await setDoc(conversationRef, {
      studentId,
      studentName,
      adminId: actualAdminId,
      adminName,
      lastMessage: lastMessagePreview,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: existingDoc.exists() ? (existingDoc.data()?.unreadCount || 0) + 1 : 1
    }, { merge: true });

    await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      {
        senderId,
        senderName,
        senderPhotoUrl,
        text: '',
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        messageType,
        createdAt: serverTimestamp(),
        status: 'sent'
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
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        // Check if createdAt is a Firestore Timestamp or a serializable date
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        } else if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
          // Manual conversion if toDate is missing for some reason
          createdAt = new Date(createdAt.seconds * 1000);
        }

        return {
          id: doc.id,
          ...data,
          createdAt
        };
      }) as Message[];
      callback(messages);
    });
  }

  // Mark a message as read by a user
  async markMessageAsRead(conversationId: string, messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      if (messageData.senderId === userId) return; // Don't mark own messages as read by self

      const readBy: string[] = messageData.readBy || [];
      
      if (!readBy.includes(userId)) {
        await updateDoc(messageRef, {
          readBy: [...readBy, userId],
          status: 'read'
        });
      }
    }
  }

  // Mark a message as delivered to a user
  async markMessageAsDelivered(conversationId: string, messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      if (messageData.senderId === userId) return; // Don't mark own messages as delivered to self

      const deliveredTo: string[] = messageData.deliveredTo || [];
      
      if (!deliveredTo.includes(userId)) {
        await updateDoc(messageRef, {
          deliveredTo: [...deliveredTo, userId],
          status: messageData.status === 'read' ? 'read' : 'delivered'
        });
      }
    }
  }

  // Mark all messages in a conversation as read
  async markAllMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('senderId', '!=', userId),
      where('status', '!=', 'read')
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(async (docSnap) => {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnap.id);
      const data = docSnap.data();
      const readBy = data.readBy || [];
      if (!readBy.includes(userId)) {
        await updateDoc(messageRef, {
          readBy: [...readBy, userId],
          status: 'read'
        });
      }
    });

    await Promise.all(updatePromises);
    
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      unreadCount: 0
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

  // Delete message for me
  async deleteMessageForMe(conversationId: string, messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const deletedFor: string[] = messageDoc.data().deletedFor || [];
      if (!deletedFor.includes(userId)) {
        await updateDoc(messageRef, {
          deletedFor: [...deletedFor, userId]
        });
      }
    }
  }

  // Delete message for everyone
  async deleteMessageForEveryone(conversationId: string, messageId: string): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: '🚫 This message was deleted',
      isDeletedForEveryone: true,
      messageType: 'text',
      fileUrl: null,
      audioUrl: null,
      fileName: null
    });
  }

  // Add a reaction to a message
  async toggleReaction(conversationId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      const reactions: Record<string, string[]> = messageData.reactions || {};
      
      if (!reactions[emoji]) {
        reactions[emoji] = [userId];
      } else {
        const index = reactions[emoji].indexOf(userId);
        if (index > -1) {
          reactions[emoji].splice(index, 1);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji].push(userId);
        }
      }
      
      await updateDoc(messageRef, { reactions });
    }
  }

  // Forward a message to another conversation
  async forwardMessage(
    targetConversationId: string,
    message: Message,
    senderId: string,
    senderName: string,
    senderPhotoUrl?: string
  ) {
    const conversationRef = doc(db, 'conversations', targetConversationId);
    const existingDoc = await getDoc(conversationRef);
    const conversationData = existingDoc.data();

    if (!existingDoc.exists()) {
      throw new Error('Target conversation does not exist');
    }

    const forwardText = message.text || (message.messageType === 'voice' ? '🎤 Voice message' : message.messageType === 'image' ? '📷 Image' : '📄 File');

    await updateDoc(conversationRef, {
      lastMessage: forwardText,
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: (conversationData?.unreadCount || 0) + 1
    });

    const messageData: any = {
      senderId,
      senderName,
      senderPhotoUrl,
      text: message.text || '',
      createdAt: serverTimestamp(),
      isForwarded: true,
      messageType: message.messageType || 'text',
      status: 'sent'
    };

    if (message.audioUrl) {
      messageData.audioUrl = message.audioUrl;
      messageData.audioDuration = message.audioDuration;
    }
    if (message.fileUrl) {
      messageData.fileUrl = message.fileUrl;
      messageData.fileName = message.fileName;
      messageData.fileType = message.fileType;
    }

    await addDoc(
      collection(db, 'conversations', targetConversationId, 'messages'),
      messageData
    );
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

  // Listen to conversations specific to this admin
  subscribeToConversationsByAdmin(adminId: string, callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      where('adminId', '==', adminId)
    );

    const qGroup = query(
      collection(db, 'conversations'),
      where('isGroup', '==', true),
      where('memberIds', 'array-contains', adminId)
    );

    const fetchMetadata = async (docs: any[]) => {
      return await Promise.all(
        docs.map(async (docSnap) => {
          const data = docSnap.data() as Conversation;
          
          if (!data.isGroup) {
            try {
              const studentDocSnap = await getDoc(doc(db, 'users', data.studentId));
              if (studentDocSnap.exists()) {
                data.studentPhotoUrl = studentDocSnap.data().photoUrl;
              }
            } catch (e) {
              console.log('Error fetching student photo:', e);
            }
          }
          
          return { id: docSnap.id, ...data };
        })
      );
    };

    let pConvs: Conversation[] = [];
    let gConvs: Conversation[] = [];

    const unsubP = onSnapshot(q, async (snapshot) => {
      pConvs = await fetchMetadata(snapshot.docs);
      const allConvs = [...pConvs, ...gConvs];
      
      // Update delivery status for received messages
      allConvs.forEach(conv => {
        const qMsgs = query(
          collection(db, 'conversations', conv.id!, 'messages'),
          where('senderId', '!=', adminId),
          where('status', '==', 'sent')
        );
        getDocs(qMsgs).then(snap => {
          snap.docs.forEach(msgDoc => {
            this.markMessageAsDelivered(conv.id!, msgDoc.id, adminId);
          });
        });
      });

      callback(allConvs.map(conv => {
        let lastMessageTime = conv.lastMessageTime;
        if (lastMessageTime && typeof lastMessageTime.toDate === 'function') {
          lastMessageTime = lastMessageTime.toDate();
        }
        return { ...conv, lastMessageTime };
      }).sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      }));
    });

    const unsubG = onSnapshot(qGroup, async (snapshot) => {
      gConvs = await fetchMetadata(snapshot.docs);
      const allConvs = [...pConvs, ...gConvs];

      // Update delivery status for received messages in groups
      allConvs.forEach(conv => {
        if (!conv.isGroup) return;
        const qMsgs = query(
          collection(db, 'conversations', conv.id!, 'messages'),
          where('senderId', '!=', adminId),
          where('status', '==', 'sent')
        );
        getDocs(qMsgs).then(snap => {
          snap.docs.forEach(msgDoc => {
            this.markMessageAsDelivered(conv.id!, msgDoc.id, adminId);
          });
        });
      });

      callback(allConvs.map(conv => {
        let lastMessageTime = conv.lastMessageTime;
        if (lastMessageTime && typeof lastMessageTime.toDate === 'function') {
          lastMessageTime = lastMessageTime.toDate();
        }
        return { ...conv, lastMessageTime };
      }).sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      }));
    });

    return () => {
      unsubP();
      unsubG();
    };
  }

  // Student: Listen to conversations for a specific student
  subscribeToConversationsByStudent(studentId: string, callback: (conversations: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      where('studentId', '==', studentId)
    );

    const qGroup = query(
      collection(db, 'conversations'),
      where('isGroup', '==', true),
      where('memberIds', 'array-contains', studentId)
    );

    const fetchMetadata = async (docs: any[]) => {
      return await Promise.all(
        docs.map(async (docSnap) => {
          const data = docSnap.data() as Conversation;
          if (!data.isGroup && data.adminId) {
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
    };

    let pConvs: Conversation[] = [];
    let gConvs: Conversation[] = [];

    const unsubP = onSnapshot(q, async (snapshot) => {
      pConvs = await fetchMetadata(snapshot.docs);
      callback([...pConvs, ...gConvs].map(conv => {
        let lastMessageTime = conv.lastMessageTime;
        if (lastMessageTime && typeof lastMessageTime.toDate === 'function') {
          lastMessageTime = lastMessageTime.toDate();
        }
        return { ...conv, lastMessageTime };
      }).sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      }));
    });

    const unsubG = onSnapshot(qGroup, async (snapshot) => {
      gConvs = await fetchMetadata(snapshot.docs);
      callback([...pConvs, ...gConvs].map(conv => {
        let lastMessageTime = conv.lastMessageTime;
        if (lastMessageTime && typeof lastMessageTime.toDate === 'function') {
          lastMessageTime = lastMessageTime.toDate();
        }
        return { ...conv, lastMessageTime };
      }).sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      }));
    });

    return () => {
      unsubP();
      unsubG();
    };
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
