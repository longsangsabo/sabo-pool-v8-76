import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  MessageCircle,
  Heart,
  Share,
  Users,
  Eye,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react';

interface StreamMessage {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  message: string;
  timestamp: Date;
  type: 'message' | 'reaction' | 'system';
}

interface LiveStreamProps {
  streamId: string;
  title: string;
  streamer: {
    id: string;
    username: string;
    avatar_url?: string;
    followers: number;
  };
  viewers: number;
  isLive: boolean;
  onJoinStream?: () => void;
  onLeaveStream?: () => void;
}

export const LiveStream: React.FC<LiveStreamProps> = ({
  streamId,
  title,
  streamer,
  viewers,
  isLive,
  onJoinStream,
  onLeaveStream,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStreamer, setIsStreamer] = useState(false);
  const [streamerAudio, setStreamerAudio] = useState(true);
  const [streamerVideo, setStreamerVideo] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate live chat messages
    const interval = setInterval(() => {
      const mockMessages: StreamMessage[] = [
        {
          id: Date.now().toString(),
          user: {
            id: '1',
            username: 'viewer1',
            avatar_url: '/avatars/viewer1.jpg',
          },
          message: 'Trận đấu hay quá!',
          timestamp: new Date(),
          type: 'message',
        },
        {
          id: (Date.now() + 1).toString(),
          user: {
            id: '2',
            username: 'viewer2',
          },
          message: '🔥🔥🔥',
          timestamp: new Date(),
          type: 'reaction',
        },
      ];

      setMessages(prev => [...prev.slice(-50), ...mockMessages]); // Keep last 50 messages
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: StreamMessage = {
        id: Date.now().toString(),
        user: {
          id: 'current-user',
          username: 'Bạn',
        },
        message: newMessage,
        timestamp: new Date(),
        type: 'message',
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='w-full max-w-6xl mx-auto'>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        {/* Main Video Area */}
        <div className='lg:col-span-3'>
          <Card>
            <CardContent className='p-0'>
              {/* Video Player */}
              <div className='relative bg-black aspect-video'>
                <video
                  ref={videoRef}
                  className='w-full h-full object-cover'
                  poster='/stream-poster.jpg'
                  onClick={handlePlayPause}
                >
                  <source src='/mock-stream.mp4' type='video/mp4' />
                  Your browser does not support the video tag.
                </video>

                {/* Live Badge */}
                {isLive && (
                  <div className='absolute top-4 left-4'>
                    <Badge className='bg-red-500 text-white animate-pulse'>
                      LIVE
                    </Badge>
                  </div>
                )}

                {/* Viewer Count */}
                <div className='absolute top-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full'>
                  <Eye className='h-4 w-4' />
                  <span className='text-sm'>{viewers.toLocaleString()}</span>
                </div>

                {/* Video Controls */}
                <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handlePlayPause}
                        className='text-white hover:bg-white hover:bg-opacity-20'
                      >
                        {isPlaying ? (
                          <Pause className='h-5 w-5' />
                        ) : (
                          <Play className='h-5 w-5' />
                        )}
                      </Button>

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleMute}
                        className='text-white hover:bg-white hover:bg-opacity-20'
                      >
                        {isMuted ? (
                          <VolumeX className='h-5 w-5' />
                        ) : (
                          <Volume2 className='h-5 w-5' />
                        )}
                      </Button>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleFullscreen}
                        className='text-white hover:bg-white hover:bg-opacity-20'
                      >
                        <Maximize className='h-5 w-5' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-white hover:bg-white hover:bg-opacity-20'
                      >
                        <Settings className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Info */}
              <div className='p-4'>
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h2 className='text-xl font-bold'>{title}</h2>
                    <div className='flex items-center gap-2 mt-1'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={streamer.avatar_url} />
                        <AvatarFallback>{streamer.username[0]}</AvatarFallback>
                      </Avatar>
                      <span className='font-medium'>{streamer.username}</span>
                      <span className='text-sm text-gray-600'>
                        {streamer.followers.toLocaleString()} followers
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm'>
                      <Heart className='h-4 w-4 mr-2' />
                      Follow
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Share className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                {/* Streamer Controls (if is streamer) */}
                {isStreamer && (
                  <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
                    <Button
                      variant={streamerAudio ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setStreamerAudio(!streamerAudio)}
                    >
                      {streamerAudio ? (
                        <Mic className='h-4 w-4' />
                      ) : (
                        <MicOff className='h-4 w-4' />
                      )}
                    </Button>
                    <Button
                      variant={streamerVideo ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setStreamerVideo(!streamerVideo)}
                    >
                      {streamerVideo ? (
                        <Video className='h-4 w-4' />
                      ) : (
                        <VideoOff className='h-4 w-4' />
                      )}
                    </Button>
                    <Button variant='destructive' size='sm'>
                      Kết thúc stream
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Sidebar */}
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <MessageCircle className='h-5 w-5' />
                  Chat
                </CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowChat(!showChat)}
                  className='lg:hidden'
                >
                  {showChat ? 'Ẩn' : 'Hiện'}
                </Button>
              </div>
            </CardHeader>

            {showChat && (
              <CardContent className='space-y-4'>
                {/* Chat Messages */}
                <div
                  ref={chatRef}
                  className='h-64 overflow-y-auto space-y-2 border rounded-lg p-3'
                >
                  {messages.map(message => (
                    <div key={message.id} className='flex items-start gap-2'>
                      <Avatar className='h-6 w-6 flex-shrink-0'>
                        <AvatarImage src={message.user.avatar_url} />
                        <AvatarFallback>
                          {message.user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium'>
                            {message.user.username}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className='text-sm text-gray-700'>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className='flex gap-2'>
                  <Input
                    placeholder='Nhập tin nhắn...'
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className='flex-1'
                  />
                  <Button size='sm' onClick={handleSendMessage}>
                    Gửi
                  </Button>
                </div>

                {/* Quick Reactions */}
                <div className='flex gap-1'>
                  {['👍', '❤️', '🔥', '👏', '🎉'].map(emoji => (
                    <Button
                      key={emoji}
                      variant='outline'
                      size='sm'
                      className='text-lg'
                      onClick={() => {
                        const message: StreamMessage = {
                          id: Date.now().toString(),
                          user: { id: 'current-user', username: 'Bạn' },
                          message: emoji,
                          timestamp: new Date(),
                          type: 'reaction',
                        };
                        setMessages(prev => [...prev, message]);
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
