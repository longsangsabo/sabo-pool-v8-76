import React from 'react';

const TestPage = () => {
  console.log('TestPage: Component is rendering');

  return (
    <div className='min-h-screen bg-green-900 text-white flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-yellow-400 mb-4'>
          🎱 Test Page
        </h1>
        <p className='text-green-200 mb-8'>App đang hoạt động bình thường!</p>
        <a
          href='/'
          className='bg-yellow-400 text-green-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500'
        >
          Về Trang Chủ
        </a>
      </div>
    </div>
  );
};

export default TestPage;
