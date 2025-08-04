import React from 'react';

export const TestCLBPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">CLB Management Test</h1>
      <p className="text-lg">Trang CLB mới đã được load thành công!</p>
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-green-100 rounded-lg">
          <h2 className="font-semibold">✅ Components hoạt động</h2>
          <p>CLB Management system đã được tạo thành công</p>
        </div>
        <div className="p-4 bg-blue-100 rounded-lg">
          <h2 className="font-semibold">🔗 Routes</h2>
          <p>Đường dẫn /clb đã hoạt động</p>
        </div>
      </div>
    </div>
  );
};
