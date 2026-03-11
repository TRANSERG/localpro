'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  MapPin, Star, TrendingUp, Search, MessageSquare, BarChart3,
  CheckCircle, ArrowRight, Menu, X, ChevronDown, Phone, Mail,
  Globe, Award, Target, Eye, Zap, Users, Shield, Building2,
  Smartphone, Clock, ThumbsUp, BarChart2, Calendar, FileText,
  Layers, Activity
} from 'lucide-react'

/* ─── constants ─────────────────────────────────────────────────────────── */
const WA_NUMBER = '918552948957'
const WA_MSG = encodeURIComponent("Hi, I'd like a free Local SEO audit for my business.")
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${WA_MSG}`
const EMAIL = 'contact@transergllp.com'
const PHONE_DISPLAY = '+91 85529 48957'

/* ─── helpers ─────────────────────────────────────────────────────────── */
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/* ─── data ─────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

const STATS = [
  { value: '200+', label: 'Local Businesses Grown' },
  { value: '4.8★', label: 'Average Google Rating Achieved' },
  { value: '3×', label: 'More Calls & Directions' },
  { value: '15+', label: 'Cities Across India' },
]

const SERVICES = [
  {
    icon: MapPin,
    title: 'Google Business Profile Optimisation',
    desc: 'Complete GBP setup, keyword-rich descriptions, category selection, and ongoing optimisation to dominate local search and Google Maps.',
    keywords: ['GBP Audit', 'Photo Updates', 'Q&A Management', 'Business Hours'],
    color: 'blue',
  },
  {
    icon: Search,
    title: 'Local Keyword Research & Tracking',
    desc: 'Identify the exact search terms your ideal customers type. Track weekly rank changes and seize opportunities before competitors do.',
    keywords: ['Local Keywords', 'Rank Tracking', 'Competitor Gap', 'Volume Analysis'],
    color: 'indigo',
  },
  {
    icon: Star,
    title: 'Review Generation & Reputation Management',
    desc: 'Systematically collect genuine 5-star Google reviews with smart follow-up flows. Respond to every review professionally and promptly.',
    keywords: ['Review Requests', 'Response Templates', 'Rating Growth', 'Reputation Alerts'],
    color: 'yellow',
  },
  {
    icon: BarChart3,
    title: 'Competitor Intelligence',
    desc: 'Know exactly who you are up against locally, what they rank for, and where you can outrank them faster with targeted actions.',
    keywords: ['Competitor Profiles', 'Keyword Gaps', 'Listing Audit', 'Market Share'],
    color: 'purple',
  },
  {
    icon: FileText,
    title: 'Monthly Performance Reports',
    desc: 'Crystal-clear monthly reports showing calls, direction requests, website clicks, impressions, and month-on-month growth—in plain language.',
    keywords: ['MoM Growth', 'GBP Insights', 'Client Dashboard', 'PDF Reports'],
    color: 'green',
  },
  {
    icon: Calendar,
    title: 'Google Posts & Content Strategy',
    desc: "Regular Google Posts (offers, events, updates) to keep your profile active, boost engagement, and signal relevance to Google's algorithm.",
    keywords: ['Weekly Posts', 'Offer Posts', 'Event Listings', 'Photo Strategy'],
    color: 'orange',
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string; badgeText: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',   badge: 'bg-blue-100',   badgeText: 'text-blue-700' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', badge: 'bg-indigo-100', badgeText: 'text-indigo-700' },
  yellow: { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100',  badge: 'bg-amber-100',  badgeText: 'text-amber-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', badge: 'bg-purple-100', badgeText: 'text-purple-700' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-100',badge: 'bg-emerald-100',badgeText: 'text-emerald-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', badge: 'bg-orange-100', badgeText: 'text-orange-700' },
}

const STEPS = [
  {
    step: '01',
    icon: Target,
    title: 'Free Local SEO Audit',
    desc: 'We analyse your Google Business Profile, current rankings, reviews, and competitors—completely free. You get a clear picture of where you stand and what is holding you back.',
  },
  {
    step: '02',
    icon: Layers,
    title: 'Custom Growth Strategy',
    desc: 'Based on your audit, we build a tailored local SEO plan. No cookie-cutter packages—every action is specific to your business, location, and target customers.',
  },
  {
    step: '03',
    icon: Activity,
    title: 'Execute, Track & Grow',
    desc: 'We implement everything—profile updates, posts, review flows, keyword tracking—and send you a clear monthly report showing real growth in calls, clicks, and footfall.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '₹6,000',
    period: '/month',
    tagline: 'Perfect for single-location businesses just getting started online.',
    features: [
      'Google Business Profile full setup & optimisation',
      '10 target keywords tracked weekly',
      '4 Google Posts per month',
      'Monthly review request campaign',
      '1 competitor monitored',
      'Monthly performance report',
      'WhatsApp support',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₹12,000',
    period: '/month',
    tagline: 'For established businesses ready to dominate their local market.',
    features: [
      'Everything in Starter',
      '25 target keywords tracked weekly',
      '8 Google Posts per month',
      'Automated review generation system',
      '3 competitors monitored',
      'GBP Q&A management',
      'Bi-weekly strategy call',
      'Priority WhatsApp + email support',
    ],
    cta: 'Start Growing',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '₹20,000',
    period: '/month',
    tagline: 'Multi-location businesses or brands that want maximum local dominance.',
    features: [
      'Everything in Growth',
      '50+ keywords tracked across locations',
      'Daily Google Posts & photo updates',
      'Full reputation management & response',
      '5+ competitors monitored',
      'Local citation building & cleanup',
      'Weekly strategy calls',
      'Dedicated account manager',
    ],
    cta: 'Go Premium',
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'Dr. Suresh Sharma',
    role: 'Owner, Sharma Dental Clinic, Kothrud',
    initials: 'SS',
    color: '#3b82f6',
    rating: 5,
    text: 'Before VyapaarGrow, my clinic was invisible on Google Maps. Within 3 months, we went from 4 reviews to 47 reviews and our calls doubled. Now I turn away patients because we are fully booked!',
  },
  {
    name: 'Priya Kulkarni',
    role: 'Founder, FitZone Gym, Baner',
    initials: 'PK',
    color: '#10b981',
    rating: 5,
    text: 'The monthly reports are so clear—I can see exactly how many people called from Google, asked for directions, or visited our website. Our Google rating went from 3.8 to 4.7 in 4 months. Highly recommend!',
  },
  {
    name: 'Ramesh Gupta',
    role: 'Manager, Spice Garden Restaurant, Koregaon Park',
    initials: 'RG',
    color: '#f59e0b',
    rating: 5,
    text: 'We rank #1 for "best restaurant near Koregaon Park" now. The team handles everything—Google Posts, responding to reviews, updating our menu photos. Footfall has gone up by 40% since we started.',
  },
  {
    name: 'Anita Deshpande',
    role: 'Owner, Lakshmi Saree House, Deccan',
    initials: 'AD',
    color: '#8b5cf6',
    rating: 5,
    text: 'I was skeptical at first—I thought only big brands need SEO. But VyapaarGrow explained everything simply and the results speak for themselves. My shop now shows up on Google before shops that have been here for decades.',
  },
]

const FAQS = [
  {
    q: 'What exactly is Local SEO and why does my business need it?',
    a: 'Local SEO is the process of optimising your online presence so that your business appears when nearby customers search for your products or services on Google. For example, when someone searches "dentist near me" or "best gym in Baner," local SEO determines which businesses appear at the top. With over 90% of consumers using Google to find local businesses, not appearing there means losing customers to competitors every single day.',
  },
  {
    q: 'How long does it take to see results?',
    a: 'Most clients see measurable improvements in calls, direction requests, and website clicks within 60–90 days. Significant ranking improvements for competitive keywords typically take 3–6 months. Local SEO is a long-term investment—the results compound over time and, unlike paid ads, do not stop when you stop paying.',
  },
  {
    q: 'Do I need a website to benefit from VyapaarGrow?',
    a: 'No! Your Google Business Profile can drive calls, footfall, and direction requests entirely on its own—without a website. Many of our clients see dramatic results through GBP optimisation alone. That said, a website does amplify results, and we can recommend good partners if you need one.',
  },
  {
    q: 'What is included in the free audit?',
    a: 'Our free Local SEO Audit includes an analysis of your Google Business Profile completeness score, your current rankings for key local terms, a review of your online reputation and rating, a look at your top 3 local competitors, and a list of the most impactful actions we recommend. There is no obligation to proceed after the audit.',
  },
  {
    q: 'Is there a contract or lock-in period?',
    a: 'We offer flexible month-to-month arrangements with no long-term contracts. We believe our results speak for themselves—clients stay because they see genuine growth, not because they are locked in. That said, we always recommend committing for at least 3 months to see the full impact of our work.',
  },
  {
    q: 'Can you help businesses outside Pune?',
    a: 'Yes! While we started in Pune, we now serve local businesses across Maharashtra and other Indian cities including Mumbai, Nashik, Aurangabad, Kolhapur, and Nagpur. Our strategies work for any location-based business in India.',
  },
]

const PAIN_POINTS = [
  { icon: Eye, text: 'Competitors show up on Google Maps, but your business is invisible' },
  { icon: Phone, text: 'You get fewer calls and walk-ins even though your service is better' },
  { icon: Star, text: 'You have only a handful of reviews while competitors have hundreds' },
  { icon: Search, text: 'Customers cannot find you when they search for your exact service' },
  { icon: Globe, text: 'Your Google Business Profile is incomplete, outdated, or unclaimed' },
  { icon: BarChart2, text: 'You have no idea how many people found—or missed—your business online' },
]

/* ─── components ───────────────────────────────────────────────────────── */
function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{q}</span>
        <ChevronDown size={18} className={cn('text-gray-400 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white">
          <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id.replace('#', ''))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <header className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-gray-900 tracking-tight leading-none">VyapaarGrow</span>
              <p className="text-[10px] text-gray-500 leading-none">by TransergLLP</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Login
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Get Free Audit
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(l => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="w-full text-left px-3 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {l.label}
              </button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-center text-sm font-medium text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                Login to Dashboard
              </Link>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center"
              >
                Get Free Audit
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">India's Local SEO Growth Partner</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              Get Your Local Business{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-blue-600">Found on Google</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 9C60 3 150 1 298 9" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
              {' '}Before Your Competitors
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              VyapaarGrow by TransergLLP helps Indian local businesses rank higher on Google Maps,
              generate more 5-star reviews, and turn online searches into real customers—guaranteed results or we work for free.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-100"
              >
                Get Your Free Audit
                <ArrowRight size={18} />
              </a>
              <button
                onClick={() => scrollTo('#how-it-works')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base border border-gray-200 transition-all hover:border-gray-300"
              >
                See How It Works
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-green-500" />
                <span>No contract, cancel anytime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-green-500" />
                <span>Free audit, no credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-green-500" />
                <span>Results in 60 days or free month</span>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-3xl font-extrabold text-blue-600 mb-1">{s.value}</div>
                <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof logos ─────────────────────────────────────────── */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Trusted by local businesses across India
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {['Dental Clinics', 'Gyms & Fitness', 'Restaurants', 'Retail Stores', 'Service Businesses', 'Salons & Spas', 'Real Estate', 'Law Firms'].map(cat => (
              <div key={cat} className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                <CheckCircle size={13} className="text-gray-300" />
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain points ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 block">The Problem</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Does This Sound Familiar?
            </h2>
            <p className="text-gray-500 text-lg">
              Thousands of Indian local businesses struggle with the same problems every day.
              If any of these sound like you, VyapaarGrow can help.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {PAIN_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-red-500" />
                </div>
                <p className="text-sm text-gray-700 font-medium leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-600 text-base mb-4">
              <strong className="text-gray-900">The good news:</strong> every one of these problems has a proven solution.
            </p>
            <button
              onClick={() => scrollTo('#services')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              See Our Solutions <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────── */}
      <section id="services" className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">Our Services</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need to Dominate Local Search
            </h2>
            <p className="text-gray-500 text-lg">
              A complete local SEO system built for Indian businesses—from Google Business Profile optimisation to review management and beyond.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(svc => {
              const c = COLOR_MAP[svc.color]
              const Icon = svc.icon
              return (
                <div key={svc.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
                  <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center mb-4', c.bg)}>
                    <Icon size={20} className={c.text} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 leading-snug">{svc.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{svc.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {svc.keywords.map(kw => (
                      <span key={kw} className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', c.badge, c.badgeText)}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Start Growing in 3 Simple Steps
            </h2>
            <p className="text-gray-500 text-lg">
              No technical jargon. No complex setup. We do all the heavy lifting so you can focus on running your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="relative">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[calc(100%-24px)] w-12 h-0.5 bg-blue-100 z-0" />
                  )}
                  <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center z-10">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 mb-5 mx-auto">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div className="text-xs font-bold text-blue-300 tracking-widest mb-2">STEP {step.step}</div>
                    <h3 className="font-bold text-gray-900 text-base mb-3">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
            >
              Book Your Free Audit Now <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Why us ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-blue-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3 block">Why VyapaarGrow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Built for Indian Local Businesses—Not Agencies
            </h2>
            <p className="text-blue-100 text-lg">
              Most SEO agencies talk global. We live local. Every strategy is built around how Indian customers search, trust, and choose businesses.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Building2, title: 'Local Market Expertise', desc: 'Deep understanding of how Indian customers search in Hindi, English, and regional languages.' },
              { icon: Zap, title: 'Results in 60 Days', desc: 'We guarantee measurable improvements in calls and Google visibility within your first two months.' },
              { icon: Shield, title: 'Transparent Reporting', desc: 'Clear monthly reports in plain language—no confusing jargon, no hidden metrics, just real results.' },
              { icon: Users, title: 'Dedicated Support', desc: 'Your own account manager on WhatsApp, not a generic ticketing system. Real people, real answers.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-500 text-lg">
              No hidden fees. No long-term contracts. Choose the plan that fits your business—upgrade or cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={cn(
                  'rounded-2xl border p-7 relative transition-all',
                  plan.highlight
                    ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-200 scale-[1.03] text-white'
                    : 'bg-white border-gray-200 shadow-sm'
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span className="bg-amber-400 text-amber-900 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide shadow">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={cn('font-extrabold text-xl mb-1', plan.highlight ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
                  <p className={cn('text-sm mb-4 leading-snug', plan.highlight ? 'text-blue-100' : 'text-gray-500')}>{plan.tagline}</p>
                  <div className="flex items-end gap-1">
                    <span className={cn('text-4xl font-extrabold', plan.highlight ? 'text-white' : 'text-gray-900')}>{plan.price}</span>
                    <span className={cn('text-sm mb-1.5', plan.highlight ? 'text-blue-200' : 'text-gray-400')}>{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-7">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle size={15} className={cn('shrink-0 mt-0.5', plan.highlight ? 'text-blue-200' : 'text-blue-500')} />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-gray-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'block w-full py-3 rounded-xl font-bold text-sm transition-all text-center',
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50 shadow'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  )}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            All plans include onboarding, setup, and a free Local SEO Audit. GST extra as applicable.
          </p>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">Client Stories</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Real Results for Real Businesses
            </h2>
            <p className="text-gray-500 text-lg">
              Hear from business owners across India who grew their local presence with VyapaarGrow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <StarRating count={t.rating} />
                <p className="text-gray-700 text-sm leading-relaxed my-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics showcase ──────────────────────────────────────────── */}
      <section className="py-16 bg-blue-50 border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              { value: '78%', label: 'Average increase in Google profile views', icon: Eye },
              { value: '3.2×', label: 'More calls from Google in 6 months', icon: Phone },
              { value: '+1.4★', label: 'Average rating improvement', icon: Star },
              { value: '91%', label: 'Client retention rate after 6 months', icon: ThumbsUp },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
                <Icon size={18} className="text-blue-500 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-blue-600 mb-1">{value}</div>
                <div className="text-xs text-gray-500 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Common Questions Answered
            </h2>
            <p className="text-gray-500 text-lg">
              Everything you need to know about local SEO and how VyapaarGrow works.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map(f => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section id="contact-cta" className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6">
            <Award size={14} className="text-amber-300" />
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Free Audit — No Obligation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight">
            Ready to Get Found on Google?
          </h2>
          <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Book your free Local SEO audit today. We will analyse your Google presence, identify opportunities,
            and show you exactly how many customers you are losing to competitors—for free.
          </p>

          {/* Contact cards */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { icon: Phone, label: 'Call / WhatsApp', value: PHONE_DISPLAY, href: WA_LINK },
              { icon: Mail, label: 'Email Us', value: EMAIL, href: `mailto:${EMAIL}` },
              { icon: Globe, label: 'Chat on WhatsApp', value: 'Free 30-min Call', href: WA_LINK },
            ].map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl p-5 transition-colors group"
              >
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs text-blue-200 font-medium">{label}</span>
                <span className="text-sm font-bold text-white">{value}</span>
              </a>
            ))}
          </div>

          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-blue-700 font-extrabold px-10 py-4 rounded-2xl text-base shadow-2xl transition-all hover:scale-[1.02] active:scale-100"
          >
            Get My Free Audit Now <ArrowRight size={18} />
          </a>
          <p className="text-blue-200 text-sm mt-4">No credit card required · Results guaranteed</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <MapPin size={15} className="text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-base leading-none">VyapaarGrow</span>
                  <p className="text-[10px] text-gray-500 leading-none">by TransergLLP</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                India's dedicated local SEO partner for small and medium businesses.
              </p>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Services</p>
              <ul className="space-y-2 text-sm">
                {['GBP Optimisation', 'Local SEO', 'Keyword Tracking', 'Review Management', 'Competitor Analysis', 'Monthly Reports'].map(s => (
                  <li key={s}><span className="hover:text-gray-200 cursor-default transition-colors">{s}</span></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Company</p>
              <ul className="space-y-2 text-sm">
                {['About Us', 'Case Studies', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Service'].map(s => (
                  <li key={s}><span className="hover:text-gray-200 cursor-default transition-colors">{s}</span></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Contact</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin size={13} className="text-blue-500 shrink-0" />
                  <span>Pune, Maharashtra, India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={13} className="text-blue-500 shrink-0" />
                  <span>{PHONE_DISPLAY}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={13} className="text-blue-500 shrink-0" />
                  <span>{EMAIL}</span>
                </li>
              </ul>
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">We Serve</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Pune · Mumbai · Nashik · Aurangabad · Kolhapur · Nagpur · Pan India
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} TransergLLP. All rights reserved. VyapaarGrow™ is a brand of TransergLLP.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Local SEO Services India</span>
              <span>·</span>
              <span>Google Business Profile Management</span>
              <span>·</span>
              <span>GMB Optimisation</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Sticky WhatsApp Button ─────────────────────────────────── */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-sm px-4 py-3 rounded-full shadow-2xl shadow-green-400/40 transition-all hover:scale-105 active:scale-100 group"
      >
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>Chat with us</span>
      </a>
    </div>
  )
}
