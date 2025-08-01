import React, { useState, useEffect } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CreateChatModal } from '@/components/chat/CreateChatModal';

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
  is_online: boolean;
  last_seen: Date;
}

interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  participants: ChatUser[];
  title?: string;
}

const ChatPage: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread count
    setUnreadCount(3); // Mock data
  }, []);

  const handleSelectChat = (chatId: string) => {
    // Fetch conversation details
    const mockConversation: ChatConversation = {
      id: chatId,
      type: 'direct',
      participants: [
        {
          id: '2',
          username: 'player2',
          avatar_url: '/avatars/player2.jpg',
          rank: 'B+',
          is_online: true,
          last_seen: new Date(),
        },
      ],
    };
    setSelectedChat(mockConversation);
  };

  const handleCreateNewChat = () => {
    setShowCreateModal(true);
  };

  const handleSendMessage = (
    content: string,
    type: 'text' | 'image' | 'file' = 'text'
  ) => {
    // Send message to backend
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  return (
    <div className='h-screen flex'>
      {/* Chat List - Hidden on mobile when chat is selected */}
      <div
        className={`w-full md:w-80 border-r ${selectedChat ? 'hidden md:block' : 'block'}`}
      >
        <ChatList
          onSelectChat={handleSelectChat}
          onCreateNewChat={handleCreateNewChat}
        />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${selectedChat ? 'block' : 'hidden md:block'}`}>
        <ChatWindow
          chatId={selectedChat?.id || ''}
          currentUserId='current-user-id'
          onClose={handleBack}
        />
      </div>

      {/* Create Chat Modal */}
      <CreateChatModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChatCreated={chatId => {
          setShowCreateModal(false);
          handleSelectChat(chatId);
        }}
      />
    </div>
  );
};

export default ChatPage;
