export interface Country {
  slug: string;
  country: string;
  currency: string;
  whatsappNote: string;
  localPainExample: string;
  priceLocal: string;
}

export const countries: Country[] = [
  {
    slug: 'india',
    country: 'India',
    currency: 'INR',
    whatsappNote: 'Works with any Indian mobile number (+91)',
    localPainExample: 'Ramesh runs a coaching institute in Pune. Last month, enquiries came from parents via WhatsApp, Facebook, and his website. 143 leads arrived. He answered 61 on time. The rest? Lost in the scroll. Not because he was lazy—because WhatsApp buries conversations. Leadwa keeps every lead visible.',
    priceLocal: '₹199/month (Basic), ₹999/month (Pro)',
  },
  {
    slug: 'uae',
    country: 'UAE',
    currency: 'AED',
    whatsappNote: 'Works with UAE numbers (+971)',
    localPainExample: 'Fatima runs a salon in Dubai. Clients message her from Instagram, Google Maps, and walk-in QR codes. 89 leads arrived last month. She followed up with 34. The rest? Buried under family chats. Leadwa brings every business lead to the top.',
    priceLocal: 'AED 75/month (Basic), AED 365/month (Pro)',
  },
  {
    slug: 'singapore',
    country: 'Singapore',
    currency: 'SGD',
    whatsappNote: 'Works with Singapore numbers (+65)',
    localPainExample: 'Wei runs a tuition center in Tampines. Enquiries come from parents via WhatsApp, Facebook ads, and his website. 67 leads last month. He replied to 28. The rest got lost in the noise. Leadwa ensures no parent ever waits unanswered.',
    priceLocal: 'SGD 30/month (Basic), SGD 145/month (Pro)',
  },
  {
    slug: 'usa',
    country: 'USA',
    currency: 'USD',
    whatsappNote: 'Works with US numbers (+1)',
    localPainExample: 'Carlos runs a landscaping business in Texas. Leads come from Google, Yelp, and his truck-wrap QR code. 112 leads last month. He followed up with 43. The rest? Drowned in group chats and spam. Leadwa keeps every customer inquiry front and center.',
    priceLocal: '$6/month (Basic), $29/month (Pro)',
  },
  {
    slug: 'uk',
    country: 'UK',
    currency: 'GBP',
    whatsappNote: 'Works with UK numbers (+44)',
    localPainExample: 'Priya runs a catering service in London. Enquiries arrive from Instagram, Facebook, and wedding fairs. 78 leads last month. She responded to 31. The rest? Lost in the chatter. Leadwa makes sure every event booking gets the attention it deserves.',
    priceLocal: '£5/month (Basic), £22/month (Pro)',
  },
  {
    slug: 'australia',
    country: 'Australia',
    currency: 'AUD',
    whatsappNote: 'Works with Australian numbers (+61)',
    localPainExample: 'Jake runs a fitness studio in Melbourne. Leads come from Google, Instagram, and his gym-counter QR code. 94 leads last month. He followed up with 39. The rest? Buried in the scroll. Leadwa ensures every potential member gets a reply.',
    priceLocal: 'AUD 9/month (Basic), AUD 42/month (Pro)',
  },
];
