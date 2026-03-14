import type {
  Client, Profile, Keyword, Task, ReviewTracker,
  Competitor, MonthlyReport, BrandingProfile,
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
    id: 'c1', created_at: '2024-01-15T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
    business_name: 'Sharma Dental Clinic', business_type: 'Dentistry', city: 'Pune', area: 'Kothrud',
    color_tag: '#3b82f6', owner_name: 'Dr. Sunil Sharma', phone: '9822334455',
    email: 'sunil@sharmadental.com', whatsapp: '9822334455',
    gbp_link: 'https://g.page/sharmadental', google_review_url: 'https://g.page/sharmadental/review', language_preference: 'English',
    website_url: 'https://sharmadental.com',
    facebook_page: 'sharmadental', instagram_handle: '@sharmadental',
    package_type: 'Growth', monthly_fee: 12000, start_date: '2024-01-15', renewal_date: '2025-01-15',
    payment_status: 'Paid', assigned_to: 'p2', performance_score: 78,
    next_followup_date: '2024-03-20',
    login_credentials: [{ label: 'GBP Email', username: 'sunil@sharmadental.com', password: 'gbp@1234', url: 'https://business.google.com' }],
    notes: 'Very responsive. Wants to grow to 200+ reviews.', is_active: true, client_user_id: null,
  },
  {
    id: 'c2', created_at: '2024-02-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
    business_name: 'Pune Plumbing Services', business_type: 'Plumbing', city: 'Pune', area: 'Aundh',
    color_tag: '#10b981', owner_name: 'Vikas Patil', phone: '9833445566',
    email: 'vikas@puneplumbing.com', whatsapp: '9833445566',
    gbp_link: 'https://g.page/puneplumbing', google_review_url: 'https://g.page/puneplumbing/review', language_preference: 'Hindi',
    website_url: 'https://puneplumbing.com',
    facebook_page: null, instagram_handle: null,
    package_type: 'Starter', monthly_fee: 6000, start_date: '2024-02-01', renewal_date: '2025-02-01',
    payment_status: 'Pending', assigned_to: 'p3', performance_score: 52,
    next_followup_date: '2024-03-15', login_credentials: [],
    notes: 'Needs GBP setup. Basic package.', is_active: true, client_user_id: null,
  },
  {
    id: 'c3', created_at: '2024-01-20T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
    business_name: 'FitZone Gym', business_type: 'Fitness & Gym', city: 'Pune', area: 'Baner',
    color_tag: '#f59e0b', owner_name: 'Rohit Joshi', phone: '9844556677',
    email: 'rohit@fitzoneGym.com', whatsapp: '9844556677',
    gbp_link: 'https://g.page/fitzonepune', google_review_url: 'https://g.page/fitzonepune/review', language_preference: 'English',
    website_url: 'https://fitzonegym.com',
    facebook_page: 'fitzoneGym', instagram_handle: '@fitzonegym',
    package_type: 'Premium', monthly_fee: 20000, start_date: '2024-01-20', renewal_date: '2025-01-20',
    payment_status: 'Paid', assigned_to: 'p2', performance_score: 91,
    next_followup_date: '2024-03-18', login_credentials: [],
    notes: 'Top client. Running Google Ads.', is_active: true, client_user_id: null,
  },
  {
    id: 'c4', created_at: '2024-02-10T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
    business_name: 'Spice Garden Restaurant', business_type: 'Restaurant', city: 'Pune', area: 'Koregaon Park',
    color_tag: '#ef4444', owner_name: 'Meena Kulkarni', phone: '9855667788',
    email: 'meena@spicegarden.com', whatsapp: '9855667788',
    gbp_link: null, google_review_url: null, language_preference: 'Marathi',
    website_url: 'https://spicegarden.com',
    facebook_page: 'SpiceGardenPune', instagram_handle: '@spicegardenpune',
    package_type: 'Growth', monthly_fee: 12000, start_date: '2024-02-10', renewal_date: '2025-02-10',
    payment_status: 'Overdue', assigned_to: 'p3', performance_score: 44,
    next_followup_date: '2024-03-10', login_credentials: [],
    notes: 'GBP not set up. Payment overdue — urgent.', is_active: true, client_user_id: null,
  },
  {
    id: 'c5', created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
    business_name: 'Lakshmi Saree House', business_type: 'Retail — Clothing', city: 'Pune', area: 'Deccan',
    color_tag: '#8b5cf6', owner_name: 'Sanjay Iyer', phone: '9866778899',
    email: 'sanjay@lakshmisarees.com', whatsapp: '9866778899',
    gbp_link: 'https://g.page/lakshmisarees', google_review_url: 'https://g.page/lakshmisarees/review', language_preference: 'English',
    website_url: null,
    facebook_page: 'LakshmiSareeHouse', instagram_handle: '@lakshmisarees',
    package_type: 'Starter', monthly_fee: 6000, start_date: '2024-03-01', renewal_date: '2025-03-01',
    payment_status: 'Paid', assigned_to: 'p2', performance_score: 35,
    next_followup_date: '2024-03-25', login_credentials: [],
    notes: 'New client. Initial audit pending.', is_active: true, client_user_id: null,
  },
]

export const mockKeywords: Keyword[] = [
  // c1 — Sharma Dental Clinic
  { id: 'k1',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'dentist in Kothrud Pune',       keyword_type: 'Service+Location', monthly_search_volume: 880,  competition: 'Medium', priority: 'High',   used_in_gbp: true,  used_on_website: true,  current_ranking: 3,  target_ranking: 1, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k2',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'dental clinic near me Pune',    keyword_type: 'Near Me',          monthly_search_volume: 1200, competition: 'High',   priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 7,  target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k3',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'best dentist Pune',             keyword_type: 'Best/Top',         monthly_search_volume: 2400, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: 14, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k4',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'teeth whitening Pune',          keyword_type: 'Service Specific', monthly_search_volume: 590,  competition: 'Medium', priority: 'High',   used_in_gbp: true,  used_on_website: true,  current_ranking: 5,  target_ranking: 2, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k5',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'root canal treatment Pune',     keyword_type: 'Service Specific', monthly_search_volume: 480,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k6',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'dental implants Pune',          keyword_type: 'Service Specific', monthly_search_volume: 720,  competition: 'Medium', priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k7',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'orthodontist Kothrud Pune',     keyword_type: 'Service+Location', monthly_search_volume: 320,  competition: 'Low',    priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k8',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'emergency dentist Pune',        keyword_type: 'Emergency',        monthly_search_volume: 680,  competition: 'Low',    priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 6,  target_ranking: 2, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k9',  client_id: 'c1', created_at: '', updated_at: '', keyword: 'affordable dentist Pune',       keyword_type: 'Affordable',       monthly_search_volume: 560,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k10', client_id: 'c1', created_at: '', updated_at: '', keyword: 'how often should I visit dentist', keyword_type: 'Question Based', monthly_search_volume: 390,  competition: 'Low',    priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },

  // c2 — Pune Plumbing Services
  { id: 'k11', client_id: 'c2', created_at: '', updated_at: '', keyword: 'plumber in Aundh Pune',         keyword_type: 'Service+Location', monthly_search_volume: 590,  competition: 'Low',    priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 12, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k12', client_id: 'c2', created_at: '', updated_at: '', keyword: 'plumber near me Pune',          keyword_type: 'Near Me',          monthly_search_volume: 1800, competition: 'High',   priority: 'High',   used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k13', client_id: 'c2', created_at: '', updated_at: '', keyword: 'emergency plumber Pune',        keyword_type: 'Emergency',        monthly_search_volume: 920,  competition: 'Medium', priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 8,  target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k14', client_id: 'c2', created_at: '', updated_at: '', keyword: 'pipe leakage repair Pune',      keyword_type: 'Problem Based',    monthly_search_volume: 440,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k15', client_id: 'c2', created_at: '', updated_at: '', keyword: 'bathroom fitting Pune',         keyword_type: 'Service Specific', monthly_search_volume: 380,  competition: 'Low',    priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 8, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k16', client_id: 'c2', created_at: '', updated_at: '', keyword: 'plumbing services Pune',        keyword_type: 'Service+Location', monthly_search_volume: 1100, competition: 'High',   priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 15, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k17', client_id: 'c2', created_at: '', updated_at: '', keyword: 'water tank cleaning Pune',      keyword_type: 'Service Specific', monthly_search_volume: 650,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k18', client_id: 'c2', created_at: '', updated_at: '', keyword: '24 hour plumber Pune',          keyword_type: 'Emergency',        monthly_search_volume: 760,  competition: 'Medium', priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k19', client_id: 'c2', created_at: '', updated_at: '', keyword: 'drainage blockage Pune',        keyword_type: 'Problem Based',    monthly_search_volume: 530,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },

  // c3 — FitZone Gym
  { id: 'k20', client_id: 'c3', created_at: '', updated_at: '', keyword: 'gym in Baner Pune',             keyword_type: 'Service+Location', monthly_search_volume: 1400, competition: 'High',   priority: 'High',   used_in_gbp: true,  used_on_website: true,  current_ranking: 1,  target_ranking: 1, last_updated: '2024-03-01', notes: 'Top position — maintain', is_selected: true  },
  { id: 'k21', client_id: 'c3', created_at: '', updated_at: '', keyword: 'best gym near me Pune',         keyword_type: 'Best/Top',         monthly_search_volume: 2200, competition: 'High',   priority: 'Medium', used_in_gbp: true,  used_on_website: true,  current_ranking: 4,  target_ranking: 2, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k22', client_id: 'c3', created_at: '', updated_at: '', keyword: 'gym membership Pune',           keyword_type: 'Service Specific', monthly_search_volume: 2800, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k23', client_id: 'c3', created_at: '', updated_at: '', keyword: 'personal trainer Pune',         keyword_type: 'Service Specific', monthly_search_volume: 1600, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k24', client_id: 'c3', created_at: '', updated_at: '', keyword: 'fitness center Baner',          keyword_type: 'Neighborhood',     monthly_search_volume: 840,  competition: 'Medium', priority: 'High',   used_in_gbp: true,  used_on_website: true,  current_ranking: 2,  target_ranking: 1, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k25', client_id: 'c3', created_at: '', updated_at: '', keyword: 'zumba classes Pune',            keyword_type: 'Service Specific', monthly_search_volume: 490,  competition: 'Low',    priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k26', client_id: 'c3', created_at: '', updated_at: '', keyword: 'weight loss gym Pune',          keyword_type: 'Problem Based',    monthly_search_volume: 1100, competition: 'Medium', priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k27', client_id: 'c3', created_at: '', updated_at: '', keyword: 'crossfit gym Pune',             keyword_type: 'Service Specific', monthly_search_volume: 680,  competition: 'Low',    priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k28', client_id: 'c3', created_at: '', updated_at: '', keyword: 'yoga classes Baner Pune',       keyword_type: 'Service+Location', monthly_search_volume: 740,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },

  // c4 — Spice Garden Restaurant
  { id: 'k29', client_id: 'c4', created_at: '', updated_at: '', keyword: 'restaurant in Koregaon Park',   keyword_type: 'Service+Location', monthly_search_volume: 1900, competition: 'Medium', priority: 'High',   used_in_gbp: true,  used_on_website: true,  current_ranking: 5,  target_ranking: 2, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k30', client_id: 'c4', created_at: '', updated_at: '', keyword: 'best restaurant Pune',          keyword_type: 'Best/Top',         monthly_search_volume: 4200, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 8, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k31', client_id: 'c4', created_at: '', updated_at: '', keyword: 'Indian restaurant near me Pune', keyword_type: 'Near Me',         monthly_search_volume: 2100, competition: 'High',   priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 9,  target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k32', client_id: 'c4', created_at: '', updated_at: '', keyword: 'family restaurant Pune',        keyword_type: 'Service Specific', monthly_search_volume: 1600, competition: 'High',   priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 11, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k33', client_id: 'c4', created_at: '', updated_at: '', keyword: 'lunch buffet Pune',             keyword_type: 'Service Specific', monthly_search_volume: 1200, competition: 'Medium', priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k34', client_id: 'c4', created_at: '', updated_at: '', keyword: 'birthday dinner Koregaon Park', keyword_type: 'Service+Location', monthly_search_volume: 940,  competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k35', client_id: 'c4', created_at: '', updated_at: '', keyword: 'outdoor seating restaurant Pune', keyword_type: 'Service Specific', monthly_search_volume: 720, competition: 'Low',   priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k36', client_id: 'c4', created_at: '', updated_at: '', keyword: 'veg restaurant Pune',           keyword_type: 'Service Specific', monthly_search_volume: 1800, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k37', client_id: 'c4', created_at: '', updated_at: '', keyword: 'late night dining Pune',        keyword_type: 'Service Specific', monthly_search_volume: 1400, competition: 'Medium', priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },

  // c5 — Lakshmi Saree House
  { id: 'k38', client_id: 'c5', created_at: '', updated_at: '', keyword: 'saree shop in Deccan Pune',     keyword_type: 'Service+Location', monthly_search_volume: 640,  competition: 'Low',    priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 4,  target_ranking: 1, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k39', client_id: 'c5', created_at: '', updated_at: '', keyword: 'silk sarees Pune',              keyword_type: 'Service Specific', monthly_search_volume: 1100, competition: 'Medium', priority: 'High',   used_in_gbp: true,  used_on_website: false, current_ranking: 8,  target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k40', client_id: 'c5', created_at: '', updated_at: '', keyword: 'best saree shop near me Pune',  keyword_type: 'Near Me',          monthly_search_volume: 1800, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k41', client_id: 'c5', created_at: '', updated_at: '', keyword: 'Kanjivaram saree Pune',         keyword_type: 'Service Specific', monthly_search_volume: 880,  competition: 'Medium', priority: 'High',   used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k42', client_id: 'c5', created_at: '', updated_at: '', keyword: 'bridal saree shop Pune',        keyword_type: 'Service Specific', monthly_search_volume: 1400, competition: 'Medium', priority: 'High',   used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k43', client_id: 'c5', created_at: '', updated_at: '', keyword: 'designer blouse stitching Pune', keyword_type: 'Service Specific', monthly_search_volume: 590, competition: 'Low',    priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: true  },
  { id: 'k44', client_id: 'c5', created_at: '', updated_at: '', keyword: 'lehenga shop Pune',             keyword_type: 'Service Specific', monthly_search_volume: 2200, competition: 'High',   priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k45', client_id: 'c5', created_at: '', updated_at: '', keyword: 'cotton sarees Pune',            keyword_type: 'Service Specific', monthly_search_volume: 960,  competition: 'Medium', priority: 'Medium', used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 5, last_updated: '2024-03-01', notes: null,                       is_selected: false },
  { id: 'k46', client_id: 'c5', created_at: '', updated_at: '', keyword: 'saree shop Deccan Gymkhana',    keyword_type: 'Neighborhood',     monthly_search_volume: 420,  competition: 'Low',    priority: 'Low',    used_in_gbp: false, used_on_website: false, current_ranking: null, target_ranking: 3, last_updated: '2024-03-01', notes: null,                       is_selected: false },
]

export const mockTasks: Task[] = [
  { id: 't1', created_at: '', updated_at: '', task_name: 'Publish 2 GBP posts', client_id: 'c1', assigned_to: 'p2', due_date: '2024-03-10', status: 'Done', frequency: 'Weekly', notes: null, month_year: '2024-03' },
  { id: 't2', created_at: '', updated_at: '', task_name: 'Respond to all reviews', client_id: 'c2', assigned_to: 'p3', due_date: '2024-03-05', status: 'Overdue', frequency: 'Weekly', notes: 'Negative review needs urgent response', month_year: '2024-03' },
  { id: 't3', created_at: '', updated_at: '', task_name: 'Send monthly performance report', client_id: 'c3', assigned_to: 'p2', due_date: '2024-03-31', status: 'Not Started', frequency: 'Monthly', notes: null, month_year: '2024-03' },
  { id: 't4', created_at: '', updated_at: '', task_name: 'GBP audit checklist update', client_id: 'c5', assigned_to: 'p2', due_date: '2024-03-15', status: 'In Progress', frequency: 'One-time', notes: 'New client onboarding', month_year: '2024-03' },
  { id: 't5', created_at: '', updated_at: '', task_name: 'Collect overdue payment', client_id: 'c4', assigned_to: 'p1', due_date: '2024-03-08', status: 'Overdue', frequency: 'Monthly', notes: 'Overdue since Feb', month_year: '2024-03' },
]

export const mockReviews: ReviewTracker[] = [
  { id: 'r1', client_id: 'c1', created_at: '', updated_at: '', month_year: '2024-03', reviews_start: 87, new_reviews: 8, total_reviews: 95, average_rating: 4.7, target_rating: 4.8, all_responded: true, review_request_sent_date: '2024-03-05', negative_reviews_count: 0, action_on_negatives: null, notes: null },
  { id: 'r2', client_id: 'c2', created_at: '', updated_at: '', month_year: '2024-03', reviews_start: 23, new_reviews: 2, total_reviews: 25, average_rating: 4.1, target_rating: 4.5, all_responded: false, review_request_sent_date: null, negative_reviews_count: 1, action_on_negatives: 'Pending response', notes: null },
  { id: 'r3', client_id: 'c3', created_at: '', updated_at: '', month_year: '2024-03', reviews_start: 212, new_reviews: 18, total_reviews: 230, average_rating: 4.8, target_rating: 4.8, all_responded: true, review_request_sent_date: '2024-03-02', negative_reviews_count: 1, action_on_negatives: 'Responded professionally', notes: null },
]

export const mockCompetitors: Competitor[] = [
  { id: 'comp1', client_id: 'c1', created_at: '', updated_at: '', competitor_name: 'SmileCare Dental', gbp_link: 'https://g.page/smilecare', review_count: 145, average_rating: 4.6, ranking_position: 1, our_client_ranking: 3, strengths: 'More reviews, older GBP', weaknesses: 'No recent posts', last_checked_date: '2024-03-01', notes: null },
  { id: 'comp2', client_id: 'c3', created_at: '', updated_at: '', competitor_name: 'PowerFit Gym', gbp_link: 'https://g.page/powerfit', review_count: 98, average_rating: 4.5, ranking_position: 2, our_client_ranking: 1, strengths: 'Strong Instagram presence', weaknesses: 'No GBP posts', last_checked_date: '2024-03-01', notes: null },
]

export const mockBrandingProfiles: BrandingProfile[] = [
  {
    id: 'br1', client_id: 'c1', created_at: '', updated_at: '',
    logo_url: null,
    primary_color: '#1d4ed8', secondary_color: '#93c5fd',
    brand_tone: 'Professional',
    content_pillars: ['Oral Health Tips', 'Patient Testimonials', 'Before & After', 'Team Spotlights'],
    content_dos: 'Use clear CTAs\nPost patient testimonials (with consent)\nShare educational dental tips\nUse bright, clean photos',
    content_donts: 'Avoid medical jargon\nNo stock photos — use real clinic images\nDon\'t post without proofreading',
    hashtag_bank: '#PuneDentist #SharmaDental #KothrudDentist #SmilePune #DentalCarePune #OralHealth #DentalClinic',
    caption_templates: '✨ Template 1 — Tip Post:\n[Tip headline]\n\nDid you know? [2-3 sentence tip]\n\nBook your check-up today: [link]\n\n[hashtags]\n\n---\n✨ Template 2 — Testimonial:\n"[Patient quote]" — [First name], Kothrud\n\nThank you for trusting us with your smile! 😊\n\n[hashtags]',
    approved_post_types: ['Tips', 'Reviews', 'Photos'],
    posting_frequency: 3,
    notes: 'Client prefers English content. Always get approval before posting.',
  },
  {
    id: 'br2', client_id: 'c3', created_at: '', updated_at: '',
    logo_url: null,
    primary_color: '#d97706', secondary_color: '#fde68a',
    brand_tone: 'Bold',
    content_pillars: ['Workout Tips', 'Member Transformations', 'Class Schedules', 'Nutrition Advice'],
    content_dos: 'Use energetic, motivational language\nPost transformation photos with consent\nHighlight special offers\nUse action shots from gym floor',
    content_donts: 'Avoid overly salesy tone\nNo blurry photos\nDon\'t promise specific weight loss results',
    hashtag_bank: '#FitZonePune #GymBaner #PuneFitness #FitnessMotivation #GymLife #BanerGym #TransformationTuesday',
    caption_templates: '💪 Template 1 — Motivation Monday:\nMonday motivation: [motivational line]\n\n[2-3 sentence body about fitness]\n\nJoin us this week! 📞 [phone]\n\n[hashtags]\n\n---\n🏆 Template 2 — Member Story:\nMeet [first name]! They transformed in [X] months at FitZone 💥\n\n[Their journey in 2-3 lines]\n\nStart your journey → [link]\n\n[hashtags]',
    approved_post_types: ['Tips', 'Photos', 'Events', 'Behind the Scenes'],
    posting_frequency: 5,
    notes: 'Very active on Instagram. Prioritize Reels format.',
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
