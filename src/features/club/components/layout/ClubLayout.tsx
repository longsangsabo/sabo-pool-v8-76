import { PropsWithChildren } from 'react';
import { ClubProvider } from '../../contexts/ClubContext';
import { Loading } from '../common/Loading';
import { Error } from '../common/Error';
import { useClub } from '../../hooks/useClub';

interface ClubLayoutProps extends PropsWithChildren {
  clubId: string;
}

export function ClubLayout({ children, clubId }: ClubLayoutProps) {
  return (
    <ClubProvider clubId={clubId}>
      <ClubLayoutContent>{children}</ClubLayoutContent>
    </ClubProvider>
  );
}

function ClubLayoutContent({ children }: PropsWithChildren) {
  const { loading, error, refreshClub } = useClub();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} retry={refreshClub} />;
  }

  return <div className="flex flex-col min-h-screen">{children}</div>;
}
