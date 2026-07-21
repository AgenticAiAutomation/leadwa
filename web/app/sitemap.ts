import { MetadataRoute } from 'next';
import { countries } from '@/content/countries';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseRoutes = [
    {
      url: 'https://leadwa.co',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    {
      url: 'https://leadwa.co/signup',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: 'https://leadwa.co/login',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  const countryRoutes = countries.map((country) => ({
    url: `https://leadwa.co/whatsapp-link-generator/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...baseRoutes, ...countryRoutes];
}
