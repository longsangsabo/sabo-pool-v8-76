import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

const EditTournamentPage = () => {
  const { id } = useParams();

  if (!id) {
    return <Navigate to='/tournaments' replace />;
  }

  return (
    <div className='container mx-auto py-6'>
      <h1 className='text-2xl font-bold mb-6'>Chỉnh sửa giải đấu</h1>
      <p className='text-muted-foreground'>
        Tính năng chỉnh sửa giải đấu đang được phát triển.
      </p>
    </div>
  );
};

export default EditTournamentPage;
