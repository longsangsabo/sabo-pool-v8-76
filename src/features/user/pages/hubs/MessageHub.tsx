import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';

/**
 * MessageHub - User messaging and communication hub
 * Handles direct messages, notifications, and communication
 */
const MessageHub: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className='container mx-auto px-4 py-6'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Message Hub</h1>
              <p className='text-muted-foreground'>
                Connect with players, manage conversations, and stay updated
              </p>
            </div>
            <button className='px-4 py-2 bg-primary text-primary-foreground rounded-lg'>
              New Message
            </button>
          </div>

          {/* Message Interface */}
          <div className='grid lg:grid-cols-4 gap-6 h-[600px]'>
            {/* Chat List */}
            <div className='lg:col-span-1 border rounded-lg bg-card'>
              <div className='p-4 border-b'>
                <h2 className='font-semibold'>Conversations</h2>
                <div className='mt-2'>
                  <input
                    type='text'
                    placeholder='Search conversations...'
                    className='w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary'
                  />
                </div>
              </div>

              <div className='flex-1 overflow-y-auto'>
                {/* Chat Items */}
                <div className='space-y-1 p-2'>
                  {[
                    {
                      id: '1',
                      name: 'Alex Thompson',
                      lastMessage: 'Good game! Want a rematch?',
                      time: '2m ago',
                      unread: 2,
                    },
                    {
                      id: '2',
                      name: 'Pool Masters Club',
                      lastMessage: 'Tournament starts tomorrow',
                      time: '1h ago',
                      unread: 0,
                    },
                    {
                      id: '3',
                      name: 'Sarah Chen',
                      lastMessage: 'Thanks for the tips!',
                      time: '3h ago',
                      unread: 1,
                    },
                    {
                      id: '4',
                      name: 'Weekend League',
                      lastMessage: 'Schedule updated',
                      time: '1d ago',
                      unread: 0,
                    },
                  ].map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedChat === chat.id
                          ? 'bg-primary/10'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className='flex items-center justify-between mb-1'>
                        <h3 className='font-medium text-sm'>{chat.name}</h3>
                        <span className='text-xs text-muted-foreground'>
                          {chat.time}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-muted-foreground truncate flex-1'>
                          {chat.lastMessage}
                        </p>
                        {chat.unread > 0 && (
                          <span className='ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className='lg:col-span-3 border rounded-lg bg-card flex flex-col'>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className='p-4 border-b'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-semibold'>Alex Thompson</h3>
                        <p className='text-sm text-muted-foreground'>Online</p>
                      </div>
                      <div className='flex space-x-2'>
                        <button className='p-2 hover:bg-accent rounded'>
                          📞
                        </button>
                        <button className='p-2 hover:bg-accent rounded'>
                          🎥
                        </button>
                        <button className='p-2 hover:bg-accent rounded'>
                          ⚙️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className='flex-1 p-4 overflow-y-auto'>
                    <div className='space-y-4'>
                      {/* Sample messages */}
                      <div className='flex'>
                        <div className='bg-accent rounded-lg p-3 max-w-xs'>
                          <p className='text-sm'>
                            Hey! Great game earlier. Your break shot was
                            amazing!
                          </p>
                          <span className='text-xs text-muted-foreground'>
                            10:30 AM
                          </span>
                        </div>
                      </div>

                      <div className='flex justify-end'>
                        <div className='bg-primary text-primary-foreground rounded-lg p-3 max-w-xs'>
                          <p className='text-sm'>
                            Thanks! I've been practicing that for weeks. Want to
                            play again tomorrow?
                          </p>
                          <span className='text-xs opacity-75'>10:32 AM</span>
                        </div>
                      </div>

                      <div className='flex'>
                        <div className='bg-accent rounded-lg p-3 max-w-xs'>
                          <p className='text-sm'>Absolutely! Same time?</p>
                          <span className='text-xs text-muted-foreground'>
                            10:35 AM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className='p-4 border-t'>
                    <div className='flex space-x-2'>
                      <input
                        type='text'
                        placeholder='Type a message...'
                        className='flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                      />
                      <button className='px-4 py-2 bg-primary text-primary-foreground rounded-lg'>
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* No Chat Selected */
                <div className='flex-1 flex items-center justify-center'>
                  <div className='text-center'>
                    <div className='text-4xl mb-4'>💬</div>
                    <h3 className='text-lg font-semibold mb-2'>
                      Select a conversation
                    </h3>
                    <p className='text-muted-foreground'>
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message Stats */}
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-2xl font-bold'>12</div>
              <p className='text-sm text-muted-foreground'>
                Active Conversations
              </p>
            </div>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-2xl font-bold'>3</div>
              <p className='text-sm text-muted-foreground'>Unread Messages</p>
            </div>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-2xl font-bold'>8</div>
              <p className='text-sm text-muted-foreground'>Group Chats</p>
            </div>
            <div className='rounded-lg border bg-card p-4'>
              <div className='text-2xl font-bold'>24</div>
              <p className='text-sm text-muted-foreground'>Messages Today</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MessageHub;
