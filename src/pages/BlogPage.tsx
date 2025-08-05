import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Eye, Search } from 'lucide-react';
import { useContent } from '@/hooks/useContent';

const BlogPage = () => {
  const { posts, loadingPosts } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'news', label: 'Tin tức' },
    { value: 'tutorial', label: 'Hướng dẫn' },
    { value: 'tournament_recap', label: 'Tổng kết giải' },
    { value: 'player_spotlight', label: 'Gương mặt tiêu biểu' },
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = posts.slice(0, 3);
  const recentPosts = posts.slice(0, 6);

  if (loadingPosts) {
    return (
      <div className='flex justify-center items-center h-64'>Đang tải...</div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-gray-900'>Blog & Tin tức</h1>
        <p className='text-xl text-gray-600'>
          Cập nhật tin tức mới nhất từ cộng đồng bida SABO POOL ARENA
        </p>
      </div>

      {/* Search and Filter */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='Tìm kiếm bài viết...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className='px-3 py-2 border border-gray-300 rounded-md'
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue='all' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='all'>Tất cả bài viết</TabsTrigger>
          <TabsTrigger value='featured'>Bài nổi bật</TabsTrigger>
          <TabsTrigger value='recent'>Mới nhất</TabsTrigger>
        </TabsList>

        <TabsContent value='all' className='space-y-6'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredPosts.map(post => (
              <Card key={post.id} className='hover:shadow-lg transition-shadow'>
                {post.featured_image && (
                  <div className='aspect-video bg-gray-200 rounded-t-lg overflow-hidden'>
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
                <CardHeader>
                  <div className='flex justify-between items-start gap-2'>
                    <Badge variant='secondary'>{post.category}</Badge>
                    <div className='flex items-center gap-1 text-sm text-gray-500'>
                      <Eye className='h-3 w-3' />
                      {post.view_count}
                    </div>
                  </div>
                  <CardTitle className='text-lg leading-tight'>
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {post.excerpt && (
                    <p className='text-gray-600 text-sm line-clamp-3'>
                      {post.excerpt}
                    </p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={post.author_id} />
                        <AvatarFallback>
                          {post.author_id?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span>Tác giả</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {new Date(
                        post.published_at || post.created_at
                      ).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='featured'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {featuredPosts.map(post => (
              <Card key={post.id} className='hover:shadow-lg transition-shadow'>
                {post.featured_image && (
                  <div className='aspect-video bg-gray-200 rounded-t-lg overflow-hidden'>
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
                <CardHeader>
                  <div className='flex justify-between items-start gap-2'>
                    <Badge variant='secondary'>{post.category}</Badge>
                    <div className='flex items-center gap-1 text-sm text-gray-500'>
                      <Eye className='h-3 w-3' />
                      {post.view_count}
                    </div>
                  </div>
                  <CardTitle className='text-lg leading-tight'>
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {post.excerpt && (
                    <p className='text-gray-600 text-sm line-clamp-3'>
                      {post.excerpt}
                    </p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={post.author_id} />
                        <AvatarFallback>
                          {post.author_id?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span>Tác giả</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {new Date(
                        post.published_at || post.created_at
                      ).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='recent'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {recentPosts.map(post => (
              <Card key={post.id} className='hover:shadow-lg transition-shadow'>
                {post.featured_image && (
                  <div className='aspect-video bg-gray-200 rounded-t-lg overflow-hidden'>
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
                <CardHeader>
                  <div className='flex justify-between items-start gap-2'>
                    <Badge variant='secondary'>{post.category}</Badge>
                    <div className='flex items-center gap-1 text-sm text-gray-500'>
                      <Eye className='h-3 w-3' />
                      {post.view_count}
                    </div>
                  </div>
                  <CardTitle className='text-lg leading-tight'>
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {post.excerpt && (
                    <p className='text-gray-600 text-sm line-clamp-3'>
                      {post.excerpt}
                    </p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={post.author_id} />
                        <AvatarFallback>
                          {post.author_id?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span>Tác giả</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {new Date(
                        post.published_at || post.created_at
                      ).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogPage;
