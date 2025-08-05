import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, HelpCircle } from 'lucide-react';
import { useContent } from '@/hooks/useContent';

const FAQPage = () => {
  const { faqs, loadingFAQs } = useContent();
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'general', label: 'Câu hỏi chung', icon: '❓' },
    { value: 'membership', label: 'Hội viên', icon: '👥' },
    { value: 'tournaments', label: 'Giải đấu', icon: '🏆' },
    { value: 'technical', label: 'Kỹ thuật', icon: '⚙️' },
  ];

  const filteredFAQs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFAQs = categories.map(category => ({
    ...category,
    faqs: filteredFAQs.filter(faq => faq.category === category.value),
  }));

  if (loadingFAQs) {
    return (
      <div className='flex justify-center items-center h-64'>Đang tải...</div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <HelpCircle className='h-16 w-16 text-blue-600' />
        </div>
        <h1 className='text-4xl font-bold text-gray-900'>Câu hỏi thường gặp</h1>
        <p className='text-xl text-gray-600'>
          Tìm câu trả lời cho những thắc mắc phổ biến về SABO ARENA
        </p>
      </div>

      {/* Search */}
      <div className='relative max-w-md mx-auto'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
        <Input
          placeholder='Tìm kiếm câu hỏi...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* FAQ Categories */}
      <div className='space-y-6'>
        {groupedFAQs.map(category => (
          <Card key={category.value}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <span className='text-2xl'>{category.icon}</span>
                {category.label}
                <span className='text-sm text-gray-500'>
                  ({category.faqs.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {category.faqs.length === 0 ? (
                <p className='text-gray-500 text-center py-4'>
                  Không tìm thấy câu hỏi nào trong danh mục này
                </p>
              ) : (
                <Accordion type='single' collapsible className='space-y-2'>
                  {category.faqs.map((faq, _index) => (
                    <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                      <AccordionTrigger className='text-left'>
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className='text-gray-600'>
                        <div
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                          className='prose prose-sm max-w-none'
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Support */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardContent className='p-6 text-center'>
          <h3 className='text-lg font-semibold text-blue-900 mb-2'>
            Không tìm thấy câu trả lời?
          </h3>
          <p className='text-blue-700 mb-4'>
            Liên hệ với đội ngũ hỗ trợ của chúng tôi để được giúp đỡ
          </p>
          <div className='flex justify-center gap-4'>
            <a
              href='mailto:support@sabopool.vn'
              className='text-blue-600 hover:text-blue-800 underline'
            >
              Email: support@sabopool.vn
            </a>
            <span className='text-blue-400'>|</span>
            <a
              href='tel:+84123456789'
              className='text-blue-600 hover:text-blue-800 underline'
            >
              Hotline: 0123 456 789
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQPage;
