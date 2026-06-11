// ============================================================
// Curated category bank — hand-picked for Indian audiences 16-35
// Deliberately avoids politics, religion, obscure history
// ============================================================

export interface CategoryConfig {
  id: string;
  promptTemplate: string; // sent to AI — full ranking prompt
}

export const CATEGORIES: CategoryConfig[] = [
  // --- Food ---
  {
    id: 'indian_foods',
    promptTemplate:
      'Rank the Top 10 most popular and beloved Indian foods. Consider popularity across India, not just one region. Think mass-market appeal among young adults.',
  },
  {
    id: 'indian_street_foods',
    promptTemplate:
      'Rank the Top 10 most popular Indian street foods. Think of dishes a college student in any major Indian city would recognise and love.',
  },
  {
    id: 'fast_food_chains',
    promptTemplate:
      'Rank the Top 10 most popular fast food chains in India by popularity among young Indians. Include both Indian and international chains.',
  },

  // --- Cities & Places ---
  {
    id: 'indian_cities',
    promptTemplate:
      'Rank the Top 10 most relevant and talked-about Indian cities. Consider cultural relevance, job market, youth popularity, and general awareness.',
  },
  {
    id: 'tourist_destinations_india',
    promptTemplate:
      'Rank the Top 10 most popular tourist destinations in India. Think of places that appear most on travel bucket lists of young Indians.',
  },
  {
    id: 'countries_to_visit',
    promptTemplate:
      'Rank the Top 10 most desired countries to visit from an Indian perspective. Consider visa ease, popularity among young Indians, and travel trends.',
  },

  // --- Brands & Apps ---
  {
    id: 'indian_brands',
    promptTemplate:
      'Rank the Top 10 most recognisable and popular Indian brands. Consider brand value, daily relevance, and youth appeal.',
  },
  {
    id: 'apps_india',
    promptTemplate:
      'Rank the Top 10 most used smartphone apps in India. Focus on daily usage and mass-market popularity among young adults.',
  },
  {
    id: 'ott_platforms',
    promptTemplate:
      'Rank the Top 10 most popular OTT/streaming platforms in India. Consider subscriber count, content quality, and youth preference.',
  },

  // --- Entertainment ---
  {
    id: 'bollywood_movies',
    promptTemplate:
      'Rank the Top 10 most iconic and beloved Bollywood movies of all time. Think of films that nearly every young Indian has seen or at least knows about.',
  },
  {
    id: 'indian_web_series',
    promptTemplate:
      'Rank the Top 10 most popular Indian web series. Consider viewership, cultural impact, and how often young people talk about them.',
  },
  {
    id: 'indian_cartoons',
    promptTemplate:
      'Rank the Top 10 most nostalgic and beloved cartoon shows that Indian kids in the 2000s-2010s watched. Think pure nostalgia for millennials and Gen Z.',
  },
  {
    id: 'anime_shows',
    promptTemplate:
      'Rank the Top 10 most popular anime shows among Indian fans. Consider mainstream appeal and the shows most widely discussed in Indian fan communities.',
  },

  // --- Marvel / DC ---
  {
    id: 'marvel_characters',
    promptTemplate:
      'Rank the Top 10 most popular Marvel superhero characters. Consider global popularity, MCU prominence, and fan favourite status.',
  },
  {
    id: 'dc_characters',
    promptTemplate:
      'Rank the Top 10 most popular DC superhero characters. Consider global popularity, film/TV presence, and iconic status.',
  },

  // --- Sports ---
  {
    id: 'indian_cricketers',
    promptTemplate:
      'Rank the Top 10 most popular and celebrated Indian cricketers of all time. Consider fan love, achievements, and cultural icon status.',
  },
  {
    id: 'ipl_teams',
    promptTemplate:
      'Rank all IPL teams from most to least popular. Consider fan base size, merchandise sales, social media following, and titles won. List exactly 10 teams.',
  },
  {
    id: 'sports_worldwide',
    promptTemplate:
      'Rank the Top 10 most popular sports in the world. Consider global viewership, participation numbers, and youth interest.',
  },

  // --- Tech & Gaming ---
  {
    id: 'video_games',
    promptTemplate:
      'Rank the Top 10 most popular video games among Indian gamers. Consider both PC/console and mobile gaming, and what young Indians actively play or discuss.',
  },
  {
    id: 'tech_brands',
    promptTemplate:
      'Rank the Top 10 most popular technology brands in India. Consider smartphones, laptops, and consumer electronics that young Indians prefer.',
  },

  // --- Vehicles ---
  {
    id: 'motorcycles_india',
    promptTemplate:
      'Rank the Top 10 most popular motorcycle/bike models or brands in India. Consider sales figures, aspirational value, and what young Indians love.',
  },
  {
    id: 'cars_india',
    promptTemplate:
      'Rank the Top 10 most popular car models or brands in India. Consider both affordable cars and aspirational cars that young Indians dream about.',
  },

  // --- Internet & Social ---
  {
    id: 'indian_youtubers',
    promptTemplate:
      'Rank the Top 10 most popular Indian YouTubers. Consider subscriber count, cultural impact, and how relevant they are among youth.',
  },
  {
    id: 'internet_trends',
    promptTemplate:
      'Rank the Top 10 biggest internet trends, memes, or viral moments that resonated most with Indian youth in recent years.',
  },

  // --- Misc ---
  {
    id: 'celebrities_india',
    promptTemplate:
      'Rank the Top 10 most popular and discussed Indian celebrities right now. Consider Bollywood actors, musicians, sports stars, and influencers.',
  },
];

export function getRandomCategory(): CategoryConfig {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

export function getRandomCategoryExcluding(usedIds: string[]): CategoryConfig {
  const available = CATEGORIES.filter((c) => !usedIds.includes(c.id));
  if (available.length === 0) return getRandomCategory(); // fallback if all used
  return available[Math.floor(Math.random() * available.length)];
}
