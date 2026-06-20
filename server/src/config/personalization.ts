/**
 * App config for the personalization flow. Edit here to change the options the
 * mobile app shows (age ranges, professions, and the topic catalog). Topics are
 * seeded into the DB from TOPIC_CATALOG; icons are resolved on the client.
 */

export const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];

export const PROFESSIONS: { label: string; icon: string }[] = [
  { label: 'Student', icon: 'school-outline' },
  { label: 'Technology', icon: 'hardware-chip-outline' },
  { label: 'Business', icon: 'briefcase-outline' },
  { label: 'Finance', icon: 'cash-outline' },
  { label: 'Healthcare', icon: 'medkit-outline' },
  { label: 'Creative', icon: 'color-palette-outline' },
  { label: 'Education', icon: 'book-outline' },
  { label: 'Science', icon: 'flask-outline' },
  { label: 'Marketing', icon: 'megaphone-outline' },
  { label: 'Other', icon: 'ellipsis-horizontal' },
];

export const TOPIC_CATALOG: { slug: string; label: string }[] = [
  { slug: 'tech', label: 'Technology' },
  { slug: 'ai', label: 'AI & ML' },
  { slug: 'science', label: 'Science' },
  { slug: 'space', label: 'Space' },
  { slug: 'business', label: 'Business' },
  { slug: 'finance', label: 'Finance' },
  { slug: 'world', label: 'World News' },
  { slug: 'politics', label: 'Politics' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'health', label: 'Health' },
  { slug: 'climate', label: 'Climate' },
  { slug: 'film', label: 'Film & TV' },
  { slug: 'music', label: 'Music' },
  { slug: 'gaming', label: 'Gaming' },
  { slug: 'travel', label: 'Travel' },
  { slug: 'food', label: 'Food' },
];
