// ============================================================
// LocalRank Pro — TypeScript Types (Phase 1)
// ============================================================

export type UserRole = 'owner' | 'team' | 'client'
export type PackageType = 'Starter' | 'Growth' | 'Premium'
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue'
export type TaskStatus = 'Not Started' | 'In Progress' | 'Done' | 'Overdue'
export type AuditStatus = 'Done' | 'In Progress' | 'Pending'
export type PriorityLevel = 'High' | 'Medium' | 'Low'
export type TaskFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'One-time'
export type BrandTone = 'Formal' | 'Friendly' | 'Bold' | 'Playful' | 'Professional'

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  full_name: string | null
  email: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
}

export interface LoginCredential {
  label: string
  username: string
  password: string
  url?: string
}

export interface Client {
  id: string
  created_at: string
  updated_at: string
  business_name: string
  business_type: string | null
  city: string | null
  area: string | null
  color_tag: string | null
  owner_name: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  gbp_link: string | null
  google_review_url: string | null
  language_preference: string | null
  website_url: string | null
  facebook_page: string | null
  instagram_handle: string | null
  package_type: PackageType | null
  monthly_fee: number | null
  start_date: string | null
  renewal_date: string | null
  payment_status: PaymentStatus | null
  assigned_to: string | null
  performance_score: number | null
  next_followup_date: string | null
  login_credentials: LoginCredential[]
  notes: string | null
  is_active: boolean
  client_user_id: string | null
  // joined
  assigned_profile?: Profile
  // populated by getClients() via branding_profiles join
  branding_logo_url?: string | null
  branding_primary_color?: string | null
}

export interface GBPAuditItem {
  id: string
  created_at: string
  updated_at: string
  section: string
  task_name: string
  sort_order: number
}

export interface GBPAuditResponse {
  id: string
  client_id: string
  audit_item_id: string
  created_at: string
  updated_at: string
  status: AuditStatus
  priority: PriorityLevel
  notes: string | null
  // joined
  audit_item?: GBPAuditItem
}

export interface Keyword {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  keyword: string
  keyword_type: string | null
  monthly_search_volume: number | null
  competition: 'Low' | 'Medium' | 'High' | null
  priority: PriorityLevel | null
  used_in_gbp: boolean
  used_on_website: boolean
  current_ranking: number | null
  target_ranking: number | null
  last_updated: string | null
  notes: string | null
}

export interface Task {
  id: string
  created_at: string
  updated_at: string
  task_name: string
  client_id: string | null
  assigned_to: string | null
  due_date: string | null
  status: TaskStatus
  frequency: TaskFrequency
  notes: string | null
  month_year: string | null
  // joined
  client?: Client
  assigned_profile?: Profile
}

export interface ReviewTracker {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  month_year: string
  reviews_start: number
  new_reviews: number
  total_reviews: number
  average_rating: number | null
  target_rating: number | null
  all_responded: boolean
  review_request_sent_date: string | null
  negative_reviews_count: number
  action_on_negatives: string | null
  notes: string | null
  // joined
  client?: Client
}

export interface Competitor {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  competitor_name: string
  gbp_link: string | null
  review_count: number | null
  average_rating: number | null
  ranking_position: number | null
  our_client_ranking: number | null
  strengths: string | null
  weaknesses: string | null
  last_checked_date: string | null
  notes: string | null
}

export interface MonthlyReport {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  month_year: string
  profile_views: number | null
  search_views: number | null
  map_views: number | null
  total_calls: number | null
  direction_requests: number | null
  website_clicks: number | null
  total_reviews: number | null
  new_reviews: number | null
  average_rating: number | null
  top_keyword: string | null
  top_keyword_ranking: number | null
  prev_profile_views: number | null
  prev_total_calls: number | null
  prev_website_clicks: number | null
  overall_performance_score: number | null
  report_sent: boolean
  report_sent_date: string | null
  notes: string | null
}

export interface BrandingProfile {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  brand_tone: BrandTone | null
  content_pillars: string[]
  content_dos: string | null
  content_donts: string | null
  hashtag_bank: string | null
  caption_templates: string | null
  approved_post_types: string[]
  posting_frequency: number | null
  notes: string | null
  gem_instructions: string | null
  reference_images?: string[]
}

export interface GBPSettings {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  utm_tracking: boolean
  google_ads_connected: boolean
  booking_link_added: boolean
  booking_url: string | null
  products_section_filled: boolean
  messaging_enabled: boolean
  messaging_autoreply: boolean
  website_linked_verified: boolean
  analytics_connected: boolean
  search_console_connected: boolean
  service_area_defined: boolean
  service_area_details: string | null
  attributes_filled: boolean
  photos_minimum_10: boolean
  category_optimized: boolean
  gbp_category: string | null
  qa_populated: boolean
  short_name_set: boolean
  gbp_short_url: string | null
  last_settings_review: string | null
}

export interface SOP {
  id: string
  created_at: string
  updated_at: string
  title: string
  category: string | null
  content: string | null
  sort_order: number
}

// ============================================================
// GMB (Google My Business / Google Business Profile) Types
// ============================================================

export interface GmbToken {
  id: string
  client_id: string
  google_email: string | null
  account_name: string | null
  location_name: string | null
  location_title: string | null
  access_token: string
  refresh_token: string
  token_expires_at: string
  reviews_synced_at: string | null
  posts_synced_at: string | null
  insights_synced_at: string | null
  info_synced_at: string | null
  created_at: string
  updated_at: string
}

export type GmbStarRating = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'

export interface GmbReview {
  id: string
  client_id: string
  gmb_review_id: string
  reviewer_name: string | null
  reviewer_photo: string | null
  star_rating: GmbStarRating
  comment: string | null
  review_time: string | null
  reply_comment: string | null
  reply_time: string | null
  created_at: string
}

export type GmbTopicType = 'STANDARD' | 'EVENT' | 'OFFER'

export interface GmbPost {
  id: string
  client_id: string
  gmb_post_id: string | null
  topic_type: GmbTopicType
  summary: string | null
  event_title: string | null
  event_start: string | null
  event_end: string | null
  cta_type: string | null
  cta_url: string | null
  media_urls: string[]
  state: string | null
  create_time: string | null
  created_at: string
}

export interface GmbInsight {
  id: string
  client_id: string
  metric_date: string
  metric_type: string
  value: number
  created_at: string
}

export interface GmbBusinessInfo {
  id: string
  client_id: string
  title: string | null
  description: string | null
  primary_phone: string | null
  website_uri: string | null
  primary_category_name: string | null
  primary_category_display_name: string | null
  open_for_business: string | null
  address: {
    addressLines?: string[]
    locality?: string
    administrativeArea?: string
    postalCode?: string
    regionCode?: string
  } | null
  regular_hours: Array<{ openDay: string; openTime: string; closeTime: string }>
  synced_at: string
  created_at: string
  updated_at: string
}

export interface GmbConnectionStatus {
  client_id: string
  is_connected: boolean
  google_email: string | null
  location_title: string | null
  reviews_synced_at: string | null
  posts_synced_at: string | null
  insights_synced_at: string | null
  info_synced_at: string | null
}

export interface NewGmbPost {
  topic_type: GmbTopicType
  summary: string
  event_title?: string
  event_start?: string
  event_end?: string
  cta_type?: string
  cta_url?: string
}

// Utility types
export const KEYWORD_TYPES = [
  'Service+Location',
  'Near Me',
  'Emergency',
  'Best/Top',
  'Affordable',
  'Problem Based',
  'Neighborhood',
  'Service Specific',
  'Question Based',
  'Brand',
] as const

export const POST_TYPES = [
  'Offers',
  'Tips',
  'Photos',
  'Events',
  'Reviews',
  'Behind the Scenes',
] as const

export const COLOR_TAGS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
]

export const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Gujarati',
  'Malayalam',
] as const

export type LanguagePreference = (typeof LANGUAGES)[number]

export interface ReviewGenerateRequest {
  clientId: string
  stars: number
  language: string
}

export interface ReviewGenerateResponse {
  ok: boolean
  reviews?: string[]
  error?: string
}

// ============================================================
// Content Studio Types
// ============================================================

export type ContentIdeaStatus = 'idea' | 'approved' | 'rejected'
export type ContentCalendarStatus = 'draft' | 'generated' | 'approved' | 'published'
export type ContentPlatform = 'Instagram' | 'Facebook' | 'GBP' | 'WhatsApp'

export interface ContentIdea {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  title: string
  description: string | null
  post_type: string
  content_pillar: string | null
  keywords_used: string[]
  platform: ContentPlatform[]
  status: ContentIdeaStatus
  ai_generated: boolean
  notes: string | null
}

export interface ContentCalendarEntry {
  id: string
  client_id: string
  content_idea_id: string | null
  created_at: string
  updated_at: string
  scheduled_date: string
  month_year: string
  platform: ContentPlatform
  status: ContentCalendarStatus
  caption: string | null
  hashtags: string | null
  image_url: string | null
  image_prompt: string | null
  image_ratio: string | null
  notes: string | null
  // joined
  idea?: ContentIdea
}

export const CONTENT_PLATFORMS: ContentPlatform[] = ['Instagram', 'Facebook', 'GBP', 'WhatsApp']
export const CONTENT_IDEA_STATUSES: ContentIdeaStatus[] = ['idea', 'approved', 'rejected']
export const CONTENT_CALENDAR_STATUSES: ContentCalendarStatus[] = ['draft', 'generated', 'approved', 'published']

// ============================================================
// Calendar Occasion Types
// ============================================================

export type OccasionCategory = 'festival' | 'occasion' | 'industry' | 'sports'

export interface CalendarOccasion {
  name: string
  date: string          // YYYY-MM-DD
  description: string
  category: OccasionCategory
}
