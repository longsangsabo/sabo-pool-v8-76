import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEOHead = ({
  title = 'SABO ARENA',
  description = 'Hệ thống quản lý billiards toàn diện',
  keywords = 'billiards, pool, tournament, elo, sabo arena',
  image = '/og-image.jpg',
  url = 'https://saboarena.com',
}) => {
  const fullTitle = title === 'SABO ARENA' ? title : `${title} | SABO ARENA`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content='website' />
      <meta property='og:url' content={url} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={image} />

      {/* Twitter */}
      <meta property='twitter:card' content='summary_large_image' />
      <meta property='twitter:url' content={url} />
      <meta property='twitter:title' content={fullTitle} />
      <meta property='twitter:description' content={description} />
      <meta property='twitter:image' content={image} />

      {/* Additional SEO tags */}
      <meta name='robots' content='index, follow' />
      <meta name='language' content='Vietnamese' />
      <meta name='revisit-after' content='7 days' />
      <meta name='author' content='SABO ARENA' />

      {/* Canonical URL */}
      <link rel='canonical' href={url} />
    </Helmet>
  );
};
