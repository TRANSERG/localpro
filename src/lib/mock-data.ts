import type {
  Client, Profile, Keyword, Task, ReviewTracker,
  Competitor, MonthlyReport, BrandingProfile,
  ContentIdea, ContentCalendarEntry, SOP,
} from '@/types'

export function getMockClient(clientId: string): Client | undefined {
  return mockClients.find(c => c.id === clientId)
}

export function getMockKeywordsForClient(clientId: string): Keyword[] {
  return mockKeywords.filter(k => k.client_id === clientId)
}

export const mockProfiles: Profile[] = [
  { id: 'p1', created_at: '', updated_at: '', full_name: 'Rajesh Sharma', email: 'rajesh@agency.com', role: 'owner', phone: '9876543210', avatar_url: null, is_active: true },
  { id: 'p2', created_at: '', updated_at: '', full_name: 'Priya Patel', email: 'priya@agency.com', role: 'team', phone: '9876543211', avatar_url: null, is_active: true },
  { id: 'p3', created_at: '', updated_at: '', full_name: 'Amit Desai', email: 'amit@agency.com', role: 'team', phone: '9876543212', avatar_url: null, is_active: true },
]

export const mockClients: Client[] = [
  {
    id: 'c6', created_at: '2024-03-05T00:00:00Z', updated_at: '2024-03-05T00:00:00Z',
    business_name: 'Café Avalon', business_type: 'Café & Restaurant', city: 'Chh. Sambhaji Nagar', area: 'CIDCO Waluj Mahanagar 1',
    color_tag: '#7B0A0A', owner_name: 'Café Avalon Owner', phone: '7077071217',
    email: 'cafeavalonofficial@gmail.com', whatsapp: '7077071217',
    gbp_link: null, google_review_url: null, language_preference: 'English',
    website_url: null,
    facebook_page: 'CafeAvalon', instagram_handle: '@cafeavalonofficial',
    package_type: 'Premium', monthly_fee: 20000, start_date: '2024-03-05', renewal_date: '2025-03-05',
    payment_status: 'Paid', assigned_to: 'p1', performance_score: 70,
    next_followup_date: '2024-03-25', login_credentials: [],
    notes: 'Focus on Instagram food posts. Dark crimson brand identity.', is_active: true, client_user_id: null,
  },
  {
    id: 'c7', created_at: '2024-03-10T00:00:00Z', updated_at: '2024-03-10T00:00:00Z',
    business_name: 'Annabrahma Chinese Corner', business_type: 'Chinese Restaurant', city: 'Chh. Sambhaji Nagar', area: 'Bajaj Nagar',
    color_tag: '#7B0A0A', owner_name: 'Annabrahma Owner', phone: '9763345365',
    email: null, whatsapp: '9763345365',
    gbp_link: null, google_review_url: null, language_preference: 'Marathi',
    website_url: null,
    facebook_page: null, instagram_handle: '@annabrahma',
    package_type: 'Growth', monthly_fee: 12000, start_date: '2024-03-10', renewal_date: '2025-03-10',
    payment_status: 'Paid', assigned_to: 'p1', performance_score: 65,
    next_followup_date: '2024-03-25', login_credentials: [],
    notes: 'Marathi text, no logo in images. Chinese decorative style.', is_active: true, client_user_id: null,
  },
  {
    id: 'c8', created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z',
    business_name: 'Transerg LLP', business_type: 'IT & Technology', city: 'India', area: '',
    color_tag: '#C41E24', owner_name: 'Transerg Team', phone: '',
    email: null, whatsapp: '',
    gbp_link: null, google_review_url: null, language_preference: 'English',
    website_url: 'transergllp.com', facebook_page: null, instagram_handle: null,
    package_type: 'Premium', monthly_fee: 25000, start_date: '2026-03-15', renewal_date: '2027-03-15',
    payment_status: 'Paid', assigned_to: 'p1', performance_score: 80,
    next_followup_date: '2026-03-30', login_credentials: [],
    notes: 'AI & Mobile App Development Studio', is_active: true, client_user_id: null,
  },
]

export const mockKeywords: Keyword[] = [
  { id: 'k6', client_id: 'c6', created_at: '', updated_at: '', keyword: 'cafe in Waluj Sambhaji Nagar', keyword_type: 'Service+Location', monthly_search_volume: 720, competition: 'Medium', priority: 'High', used_in_gbp: false, used_on_website: false, current_ranking: 8, target_ranking: 3, last_updated: '2024-03-01', notes: null },
  { id: 'k7', client_id: 'c6', created_at: '', updated_at: '', keyword: 'best cafe near me Sambhaji Nagar', keyword_type: 'Best/Top', monthly_search_volume: 1100, competition: 'High', priority: 'High', used_in_gbp: false, used_on_website: false, current_ranking: 12, target_ranking: 5, last_updated: '2024-03-01', notes: null },
  { id: 'k8', client_id: 'c7', created_at: '', updated_at: '', keyword: 'chinese restaurant Bajaj Nagar Sambhaji Nagar', keyword_type: 'Service+Location', monthly_search_volume: 650, competition: 'Low', priority: 'High', used_in_gbp: false, used_on_website: false, current_ranking: 10, target_ranking: 3, last_updated: '2024-03-01', notes: null },
  { id: 'k9', client_id: 'c7', created_at: '', updated_at: '', keyword: 'best chinese food near me Sambhaji Nagar', keyword_type: 'Best/Top', monthly_search_volume: 900, competition: 'Medium', priority: 'High', used_in_gbp: false, used_on_website: false, current_ranking: 15, target_ranking: 5, last_updated: '2024-03-01', notes: null },
  { id: 'k10', client_id: 'c8', created_at: '', updated_at: '', keyword: 'mobile app development company', keyword_type: 'Service', monthly_search_volume: 2400, competition: 'High', priority: 'High', used_in_gbp: false, used_on_website: true, current_ranking: 8, target_ranking: 3, last_updated: '2026-03-15', notes: null },
  { id: 'k11', client_id: 'c8', created_at: '', updated_at: '', keyword: 'SaaS development company', keyword_type: 'Service', monthly_search_volume: 1800, competition: 'High', priority: 'High', used_in_gbp: false, used_on_website: true, current_ranking: 12, target_ranking: 5, last_updated: '2026-03-15', notes: null },
]

export const mockTasks: Task[] = [
  { id: 't6', created_at: '', updated_at: '', task_name: 'Generate weekly food posts', client_id: 'c6', assigned_to: 'p1', due_date: '2026-03-20', status: 'In Progress', frequency: 'Weekly', notes: null, month_year: '2026-03' },
  { id: 't7', created_at: '', updated_at: '', task_name: 'Create Annabrahma menu highlight posts', client_id: 'c7', assigned_to: 'p1', due_date: '2026-03-22', status: 'Not Started', frequency: 'Weekly', notes: null, month_year: '2026-03' },
  { id: 't8', created_at: '', updated_at: '', task_name: 'Design Week 1 SaaS poster', client_id: 'c8', assigned_to: 'p1', due_date: '2026-03-25', status: 'Not Started', frequency: 'Weekly', notes: null, month_year: '2026-03' },
]

export const mockReviews: ReviewTracker[] = []

export const mockCompetitors: Competitor[] = []

export const mockBrandingProfiles: BrandingProfile[] = [
  {
    id: 'br3', client_id: 'c6', created_at: '', updated_at: '',
    logo_url: 'https://jthlhbqyvoccafknflbs.supabase.co/storage/v1/object/public/logos/d6178a68-d5ae-41e7-87f3-7baa37588d3d/1773317462598.png',
    primary_color: '#7B0A0A', secondary_color: '#3D0000',
    brand_tone: 'Bold',
    content_pillars: ['Food Photography', 'Menu Highlights', 'Behind the Scenes', 'Customer Stories'],
    content_dos: 'Use dark crimson backgrounds\nCinematic food photography\nShow cheese pulls and steam\nDramatic lighting',
    content_donts: 'Never use bright/white backgrounds\nNever make it look illustrated\nNever show multiple dishes unless asked\nNever use same composition twice',
    hashtag_bank: '#CafeAvalon #SambhajiNagarCafe #WalujFood #CafeLife #FoodPorn #CheesePizza #CafeVibes',
    caption_templates: null,
    approved_post_types: ['Photos', 'Behind the Scenes', 'Events'],
    posting_frequency: 5,
    notes: 'Ultra-realistic cinematic food photography. Dark crimson brand identity.',
    gem_instructions: null,
  },
  {
    id: 'br4', client_id: 'c7', created_at: '', updated_at: '',
    logo_url: 'https://jthlhbqyvoccafknflbs.supabase.co/storage/v1/object/public/logos/7dd6ba3f-5f0c-4b01-b5a9-956482543cd3/1773406461768.jpg',
    primary_color: '#7B0A0A', secondary_color: '#3D0000',
    brand_tone: 'Bold',
    content_pillars: ['Food Photography', 'Menu Highlights', 'Behind the Scenes', 'Customer Stories'],
    content_dos: 'Use dark crimson backgrounds\nMarathi text only\nCinematic food photography\nShow steam rising from dishes',
    content_donts: 'Never use bright/white backgrounds\nNever use logos\nNever write in Hindi or English\nNever illustrate food',
    hashtag_bank: '#Annabrahma #ChineseFoodSambhajiNagar #BajajNagarFood #MarathiFood #ChineseCorner #VegChinese',
    caption_templates: null,
    approved_post_types: ['Photos', 'Behind the Scenes', 'Events'],
    posting_frequency: 5,
    notes: 'Marathi text only. No logo in images. Dark crimson Chinese aesthetic.',
    gem_instructions: null,
  },
  {
    id: 'br5', client_id: 'c8', created_at: '', updated_at: '',
    logo_url: null,
    primary_color: '#C41E24', secondary_color: '#1A1A1A',
    brand_tone: 'Professional',
    content_pillars: ['Mobile App Dev', 'SaaS Development', 'AI Integration', 'Startup MVPs', 'Case Studies'],
    content_dos: 'Use professional SaaS aesthetic\nHighlight key words in red #C41E24\nInclude device mockups\nUse 4:5 portrait format',
    content_donts: 'No cluttered backgrounds\nNo stock photo people\nNo landscape format unless asked\nNo off-brand colors',
    hashtag_bank: '#TransergLLP #AppDevelopment #SaaSDevelopment #AIIntegration #MobileApp #StartupMVP #TechPartner #CustomSoftware',
    caption_templates: null,
    approved_post_types: ['Tips', 'Photos', 'Case Studies', 'Behind the Scenes'],
    posting_frequency: 4,
    notes: 'Tech company. Clean SaaS-style poster design. Red + Black + White palette.',
    gem_instructions: null,
  },
]

export const mockPerformanceData = [
  { month: 'Oct', views: 3200, clicks: 840, calls: 115 },
  { month: 'Nov', views: 3650, clicks: 920, calls: 132 },
  { month: 'Dec', views: 3100, clicks: 780, calls: 98 },
  { month: 'Jan', views: 4280, clicks: 1180, calls: 161 },
  { month: 'Feb', views: 4920, clicks: 1320, calls: 185 },
  { month: 'Mar', views: 5350, clicks: 1490, calls: 212 },
]

// ── Content Studio mock data ─────────────────────────────────────────────────

export const mockContentIdeas: ContentIdea[] = [
  {
    id: 'ci5', client_id: 'c6', created_at: '', updated_at: '',
    title: 'Cheese Burst Pizza',
    description: 'Showcase the signature cheese burst pizza with dramatic cheese pull photography.',
    post_type: 'Photos', content_pillar: 'Menu Highlights',
    keywords_used: ['cafe in Waluj Sambhaji Nagar'],
    platform: ['Instagram'],
    status: 'approved', ai_generated: false, notes: null,
  },
  {
    id: 'ci6', client_id: 'c6', created_at: '', updated_at: '',
    title: 'Cold Coffee Devil\'s Own',
    description: 'Feature the signature Devil\'s Own cold coffee with dark moody aesthetics.',
    post_type: 'Photos', content_pillar: 'Menu Highlights',
    keywords_used: ['best cafe near me Sambhaji Nagar'],
    platform: ['Instagram'],
    status: 'approved', ai_generated: false, notes: null,
  },
  {
    id: 'ci7', client_id: 'c7', created_at: '', updated_at: '',
    title: 'Veg Manchurian Dry',
    description: 'Showcase the signature Veg Manchurian Dry with steam rising, cinematic Marathi food photography.',
    post_type: 'Photos', content_pillar: 'Menu Highlights',
    keywords_used: ['chinese restaurant Bajaj Nagar Sambhaji Nagar'],
    platform: ['Instagram'],
    status: 'approved', ai_generated: false, notes: null,
  },
  {
    id: 'ci8', client_id: 'c7', created_at: '', updated_at: '',
    title: 'Veg Hakka Noodles',
    description: 'Dramatic close-up of steaming Veg Hakka Noodles with floating herbs and dark cinematic background.',
    post_type: 'Photos', content_pillar: 'Menu Highlights',
    keywords_used: ['best chinese food near me Sambhaji Nagar'],
    platform: ['Instagram'],
    status: 'approved', ai_generated: false, notes: null,
  },
  {
    id: 'ci9', client_id: 'c8', created_at: '', updated_at: '',
    title: 'Mobile App Development for Startups',
    description: 'Poster highlighting iOS/Android development capabilities, fast MVP builds, and cross-platform solutions for startups.',
    post_type: 'Photos', content_pillar: 'Mobile App Dev',
    keywords_used: ['mobile app development company', 'MVP development for startups'],
    platform: ['Instagram', 'Facebook'],
    status: 'approved', ai_generated: true, notes: null,
  },
  {
    id: 'ci10', client_id: 'c8', created_at: '', updated_at: '',
    title: 'AI-Powered Digital Solutions',
    description: 'Poster showcasing AI integration services — machine learning, automation, GenAI tools for business transformation.',
    post_type: 'Photos', content_pillar: 'AI Integration',
    keywords_used: ['AI-powered digital solutions', 'SaaS development company'],
    platform: ['Instagram', 'Facebook'],
    status: 'approved', ai_generated: true, notes: null,
  },
]

export const mockContentCalendar: ContentCalendarEntry[] = [
  {
    id: 'cc3', client_id: 'c6', content_idea_id: 'ci5',
    created_at: '', updated_at: '',
    scheduled_date: '2026-03-22', month_year: '2026-03',
    platform: 'Instagram', status: 'draft',
    caption: null, hashtags: null,
    image_url: null, image_prompt: null, notes: null,
  },
  {
    id: 'cc4', client_id: 'c7', content_idea_id: 'ci7',
    created_at: '', updated_at: '',
    scheduled_date: '2026-03-24', month_year: '2026-03',
    platform: 'Instagram', status: 'draft',
    caption: null, hashtags: null,
    image_url: null, image_prompt: null, notes: null,
  },
  {
    id: 'cc5', client_id: 'c8', content_idea_id: 'ci9',
    created_at: '', updated_at: '',
    scheduled_date: '2026-03-25', month_year: '2026-03',
    platform: 'Instagram', status: 'draft',
    caption: null, hashtags: null,
    image_url: null, image_prompt: null, notes: null,
  },
]

export const mockSOPs: SOP[] = [
  {
    id: 'sop1',
    created_at: '',
    updated_at: '',
    sort_order: 1,
    title: 'Transerg LLP — Social Media Content Guidelines',
    category: 'Content',
    content: `TRANSERG LLP CONTENT GUIDELINES:
- Always highlight AI + Mobile App Development as core services
- Mention website transergllp.com in every caption
- Include at least one company stat per post: 50+ Companies Served, 200+ Projects Delivered, 5+ Years Experience, 40% Faster Time-to-Market, 95%+ Client Satisfaction
- Every post MUST end with a CTA — rotate these: "Start Your App Project", "Book a Free Consultation", "Build Your MVP Now", "Get a Free Discovery Call"
- Highlight red keyword #C41E24 on: AI, Mobile App, SaaS, MVP, Startup
- Use brand colors ONLY: Red #C41E24, Black #1A1A1A, White #FFFFFF
- Avoid stock photos of generic people — use device mockups and dashboards
- Poster format: 4:5 portrait (1080x1350px) for Instagram/LinkedIn`,
  },
  {
    id: 'sop2',
    created_at: '',
    updated_at: '',
    sort_order: 2,
    title: 'General Content Quality Standards',
    category: 'Content',
    content: `GENERAL CONTENT QUALITY STANDARDS:
- All captions must be authentic, professional, and on-brand
- Include location/context clues for local SEO where applicable
- Every post must have a clear hook in the first line
- Captions should tell a story or provide genuine value — avoid generic filler text
- Hashtags: 15-20 relevant, mix of high-volume and niche tags
- Always proofread for grammar, spelling, and brand voice consistency`,
  },
]
