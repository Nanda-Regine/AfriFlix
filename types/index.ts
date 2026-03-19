export type UserRole = 'fan' | 'creator' | 'brand' | 'agency' | 'admin'

export type CreatorPlan = 'free' | 'creator_pro' | 'label' | 'brand'

export type ContentCategory =
  | 'film'
  | 'music'
  | 'dance'
  | 'writing'
  | 'poetry'
  | 'comedy'
  | 'theatre'
  | 'visual_art'

export type WorkStatus = 'draft' | 'published' | 'scheduled' | 'removed'

export type AlbumType = 'album' | 'ep' | 'single' | 'mixtape' | 'live_session'

export type SeriesStatus = 'ongoing' | 'completed' | 'hiatus'

export type CollabType = 'collab' | 'commission' | 'gig' | 'casting' | 'mentorship'

export type CollabStatus = 'open' | 'closed' | 'filled'

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'declined'

export type AgeRating = 'G' | 'PG' | '13' | '16' | '18'

export type PaymentProvider = 'payfast' | 'flutterwave' | 'stripe'

export type Mood =
  | 'energised'
  | 'reflective'
  | 'joyful'
  | 'melancholic'
  | 'inspired'
  | 'restless'
  | 'provocative'
  | 'tender'
  | 'celebratory'
  | 'grief-stricken'

export interface Creator {
  id: string
  user_id: string
  display_name: string
  username: string
  bio: string | null
  country: string
  city: string | null
  is_diaspora: boolean
  african_verified: boolean
  categories: ContentCategory[]
  languages: string[]
  cultural_roots: string[]
  avatar_url: string | null
  banner_url: string | null
  promo_reel_url: string | null
  follower_count: number
  following_count: number
  total_views: number
  total_hearts: number
  works_count: number
  plan: CreatorPlan
  tips_enabled: boolean
  stripe_account_id: string | null
  flutterwave_account_id: string | null
  payfast_merchant_id: string | null
  is_featured: boolean
  is_rising: boolean
  created_at: string
  // Added in migration 007
  creative_dna: string | null
  creative_dna_updated_at: string | null
  payfast_subscription_token: string | null
  subscription_active_until: string | null
}

export interface Work {
  id: string
  creator_id: string
  title: string
  category: ContentCategory
  video_url: string | null
  video_thumbnail: string | null
  video_duration_seconds: number | null
  audio_url: string | null
  audio_duration_seconds: number | null
  written_content: string | null
  cover_art_url: string | null
  gallery_urls: string[] | null
  series_id: string | null
  album_id: string | null
  episode_number: number | null
  track_number: number | null
  description: string | null
  genres: string[]
  languages: string[]
  cultural_origin: string | null
  country_of_origin: string | null
  year_created: number | null
  collaborators: Collaborator[] | null
  is_explicit: boolean
  trigger_warnings: string[]
  age_rating: AgeRating
  ai_summary: string | null
  mood_tags: Mood[]
  theme_tags: string[]
  is_featured: boolean
  is_trending: boolean
  view_count: number
  heart_count: number
  comment_count: number
  share_count: number
  save_count: number
  status: WorkStatus
  scheduled_at: string | null
  published_at: string
  created_at: string
  // Joined
  creator?: Creator
}

export interface Series {
  id: string
  creator_id: string
  title: string
  description: string | null
  category: ContentCategory | null
  cover_url: string | null
  trailer_url: string | null
  season_count: number
  episode_count: number
  status: SeriesStatus
  created_at: string
  creator?: Creator
  episodes?: Work[]
}

export interface Album {
  id: string
  creator_id: string
  title: string
  description: string | null
  cover_url: string | null
  release_date: string | null
  album_type: AlbumType
  track_count: number
  created_at: string
  creator?: Creator
  tracks?: Work[]
}

export interface TasteProfile {
  id: string
  user_id: string
  preferred_categories: ContentCategory[]
  preferred_genres: string[]
  preferred_languages: string[]
  preferred_countries: string[]
  cultural_affinities: string[]
  mood_preferences: Mood[]
  onboarding_complete: boolean
  last_updated: string
}

export interface HistoryEntry {
  id: string
  user_id: string
  work_id: string
  progress_seconds: number
  progress_pct: number | null
  completed: boolean
  last_watched: string
  work?: Work
}

export interface Collection {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  is_public: boolean
  category_filter: ContentCategory | null
  work_count: number
  created_at: string
  works?: Work[]
}

export interface Comment {
  id: string
  work_id: string
  user_id: string
  content: string
  timestamp_ref: number | null
  parent_id: string | null
  heart_count: number
  created_at: string
  author?: { display_name: string; avatar_url: string | null; username: string }
  replies?: Comment[]
}

export interface Collab {
  id: string
  creator_id: string
  title: string
  type: CollabType
  category: ContentCategory | null
  description: string
  skills_needed: string[]
  location: string | null
  compensation_type: 'paid' | 'revenue_share' | 'credit_only' | null
  budget_range: string | null
  deadline: string | null
  status: CollabStatus
  application_count: number
  created_at: string
  creator?: Creator
}

export interface CollabApplication {
  id: string
  collab_id: string
  applicant_id: string
  pitch: string | null
  portfolio_links: string[]
  status: ApplicationStatus
  created_at: string
  applicant?: Creator
}

export interface Tip {
  id: string
  from_user_id: string
  to_creator_id: string
  work_id: string | null
  amount: number
  currency: string
  message: string | null
  payment_provider: PaymentProvider
  payment_reference: string | null
  status: string
  created_at: string
}

export interface Collaborator {
  name: string
  role: string
  creator_id: string | null
}

// AI types
export interface AIEnrichment {
  ai_summary: string
  mood_tags: Mood[]
  theme_tags: string[]
  genre_suggestions: string[]
  cultural_context: string
  recommended_for: string[]
}

export interface TasteProfileResult {
  preferred_categories: ContentCategory[]
  preferred_genres: string[]
  preferred_languages: string[]
  cultural_affinities: string[]
  mood_preferences: Mood[]
  first_feed_description: string
  welcome_message: string
}

export interface MoodRecommendation {
  work_ids: string[]
  curation_note: string
}

// Chat message
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

// Category metadata
export const CATEGORY_META: Record<ContentCategory, {
  label: string
  icon: string
  description: string
  slug: string
}> = {
  film:       { label: 'Film & Series',        icon: 'film',     description: 'Short films, web series, documentaries', slug: 'film' },
  music:      { label: 'Music',                icon: 'music',    description: 'Singles, albums, live sessions', slug: 'music' },
  dance:      { label: 'Dance',                icon: 'dance',    description: 'Choreography, tutorials, cultural dance', slug: 'dance' },
  writing:    { label: 'Writing',              icon: 'writing',  description: 'Short stories, novels, essays', slug: 'writing' },
  poetry:     { label: 'Poetry',               icon: 'poetry',   description: 'Spoken word, slam, audio poetry', slug: 'poetry' },
  comedy:     { label: 'Comedy',               icon: 'comedy',   description: 'Stand-up, sketches, web series', slug: 'comedy' },
  theatre:    { label: 'Theatre & Spoken Arts',icon: 'theatre',  description: 'Stage recordings, monologues, griots', slug: 'theatre' },
  visual_art: { label: 'Visual Art',           icon: 'art',      description: 'Art process, galleries, installations', slug: 'visual-art' },
}

export const MOOD_CONFIG: Record<string, {
  label: string
  emoji: string
  bg: string
  border: string
  text: string
}> = {
  energised:   { label: 'Energised',   emoji: '⚡', bg: 'rgba(201,168,76,0.15)',  border: 'rgba(201,168,76,0.5)',  text: '#E2C06A' },
  reflective:  { label: 'Reflective',  emoji: '🌊', bg: 'rgba(100,130,180,0.15)', border: 'rgba(100,130,180,0.5)', text: '#8AABCC' },
  joyful:      { label: 'Joyful',      emoji: '☀️', bg: 'rgba(196,98,45,0.15)',   border: 'rgba(196,98,45,0.5)',   text: '#D97A45' },
  melancholic: { label: 'Melancholic', emoji: '🌙', bg: 'rgba(120,100,160,0.15)', border: 'rgba(120,100,160,0.5)', text: '#A090D0' },
  inspired:    { label: 'Inspired',    emoji: '🔥', bg: 'rgba(80,160,120,0.15)',  border: 'rgba(80,160,120,0.5)',  text: '#60C090' },
  restless:    { label: 'Restless',    emoji: '🌪️', bg: 'rgba(180,60,80,0.15)',   border: 'rgba(180,60,80,0.5)',   text: '#E06070' },
}

export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
  'Congo', 'DR Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea',
  'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
  'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco',
  'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe',
  'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
  'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda',
  'Zambia', 'Zimbabwe',
]
