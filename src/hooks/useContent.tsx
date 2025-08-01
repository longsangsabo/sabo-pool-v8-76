import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  category: string;
  tags: string[];
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export const useContent = () => {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      // Mock posts data since posts table doesn't exist
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'Kỹ thuật cơ bản trong bi-a',
          slug: 'ky-thuat-co-ban-trong-bi-a',
          content: 'Nội dung chi tiết về kỹ thuật cơ bản...',
          excerpt: 'Hướng dẫn kỹ thuật cơ bản cho người mới chơi bi-a',
          featured_image: null,
          category: 'Hướng dẫn',
          tags: ['kỹ thuật', 'cơ bản', 'bi-a'],
          author_id: 'author1',
          status: 'published',
          published_at: new Date().toISOString(),
          view_count: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      return mockPosts;
    },
  });

  const { data: faqs = [], isLoading: loadingFAQs } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      // Mock FAQs data since faqs table doesn't exist
      const mockFAQs: FAQ[] = [
        {
          id: '1',
          question: 'Làm thế nào để tham gia giải đấu?',
          answer:
            'Bạn có thể đăng ký tham gia giải đấu thông qua trang Tournaments.',
          category: 'Giải đấu',
          order_index: 1,
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];
      return mockFAQs;
    },
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      // Mock rules data since rules table doesn't exist
      const mockRules = [
        {
          id: '1',
          title: 'Quy định chung',
          content: 'Các quy định chung của sân bi-a...',
          category: 'Chung',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];
      return mockRules;
    },
  });

  const createPost = useMutation({
    mutationFn: async (
      postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'view_count'>
    ) => {
      // Mock post creation since posts table doesn't exist
      const newPost = {
        ...postData,
        id: Date.now().toString(),
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Mock create post:', newPost);
      return newPost;
    },
    onSuccess: () => {
      toast.success('Bài viết đã được tạo!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: error => {
      console.error('Error creating post:', error);
      toast.error('Có lỗi xảy ra khi tạo bài viết');
    },
  });

  const incrementViewCount = useMutation({
    mutationFn: async (postId: string) => {
      // Mock increment view count since increment_post_views RPC doesn't exist
      console.log('Mock increment view count for post:', postId);
    },
  });

  return {
    posts,
    faqs,
    rules,
    loadingPosts,
    loadingFAQs,
    loadingRules,
    createPost,
    incrementViewCount,
  };
};
