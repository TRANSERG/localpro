import type {
  Client, Profile, Keyword, Task, ReviewTracker,
  Competitor, MonthlyReport,
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
  { id: 'k1', client_id: 'c1', created_at: '', updated_at: '', keyword: 'dentist in Kothrud Pune', keyword_type: 'Service+Location', monthly_search_volume: 880, competition: 'Medium', priority: 'High', used_in_gbp: true, used_on_website: true, current_ranking: 3, target_ranking: 1, last_updated: '2024-03-01', notes: null },
  { id: 'k2', client_id: 'c1', created_at: '', updated_at: '', keyword: 'dental clinic near me Pune', keyword_type: 'Near Me', monthly_search_volume: 1200, competition: 'High', priority: 'High', used_in_gbp: true, used_on_website: false, current_ranking: 7, target_ranking: 3, last_updated: '2024-03-01', notes: null },
  { id: 'k3', client_id: 'c2', created_at: '', updated_at: '', keyword: 'plumber in Aundh Pune', keyword_type: 'Service+Location', monthly_search_volume: 590, competition: 'Low', priority: 'High', used_in_gbp: false, used_on_website: false, current_ranking: 12, target_ranking: 5, last_updated: '2024-03-01', notes: null },
  { id: 'k4', client_id: 'c3', created_at: '', updated_at: '', keyword: 'gym in Baner Pune', keyword_type: 'Service+Location', monthly_search_volume: 1400, competition: 'High', priority: 'High', used_in_gbp: true, used_on_website: true, current_ranking: 1, target_ranking: 1, last_updated: '2024-03-01', notes: 'Top position — maintain' },
  { id: 'k5', client_id: 'c3', created_at: '', updated_at: '', keyword: 'best gym near me Pune', keyword_type: 'Best/Top', monthly_search_volume: 2200, competition: 'High', priority: 'Medium', used_in_gbp: true, used_on_website: true, current_ranking: 4, target_ranking: 2, last_updated: '2024-03-01', notes: null },
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

export const mockPerformanceData = [
  { month: 'Oct', views: 3200, clicks: 840, calls: 115 },
  { month: 'Nov', views: 3650, clicks: 920, calls: 132 },
  { month: 'Dec', views: 3100, clicks: 780, calls: 98 },
  { month: 'Jan', views: 4280, clicks: 1180, calls: 161 },
  { month: 'Feb', views: 4920, clicks: 1320, calls: 185 },
  { month: 'Mar', views: 5350, clicks: 1490, calls: 212 },
]
