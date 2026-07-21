import { MetadataRoute } from 'next';
import { countries } from '@/content/countries';
import { questions } from '@/content/questions';

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
    {
      url: 'https://leadwa.co/answers',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  const countryRoutes = countries.map((country) => ({
    url: `https://leadwa.co/whatsapp-link-generator/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const answerRoutes = questions.map((question) => ({
    url: `https://leadwa.co/answers/${question.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...baseRoutes, ...countryRoutes, ...answerRoutes];
}
