'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Client, Profile, COLOR_TAGS, LANGUAGES } from '@/types'
import { formatINR, formatDate, getStatusClasses, getInitials, cn } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import {
  Plus, Search, Globe, Phone, MessageCircle,
  ExternalLink, Edit2, Trash2, X, QrCode, ChevronDown, ChevronUp,
} from 'lucide-react'
import { detectSectorType } from '@/lib/client-sector-utils'
import type { SectorData, MenuItem, ServiceItem, TreatmentItem, OfferingItem } from '@/lib/client-sector-utils'
import { ReviewQRModal } from '@/components/ui/review-qr-modal'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

// ─── Stable helper components (defined OUTSIDE any other component) ───────────
// Defining these inside ClientModal caused React to treat them as new component
// types on every re-render, unmounting inputs and losing focus after each keystroke.

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-gray-400 text-xs">—</span>
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
  const bg = score >= 75 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50'
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${bg}`}>
      <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${color}`}>{score}%</span>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-gray-600 mb-1">{children}</label>
}

function ModalInput({
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  )
}

function ModalSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const RESTAURANT_CATEGORIES = ['Starters', 'Main Course', 'Snacks', 'Breakfast', 'Beverages', 'Desserts', 'Thali', 'Specials']
const SALON_CATEGORIES = ['Hair', 'Skin', 'Nails', 'Bridal', 'Spa', 'Makeup', 'Other']
const RESTAURANT_FEATURES = ['Dine-in', 'Takeaway', 'Home Delivery', 'Catering', 'Online Order']
const CLINIC_CONSULTATION = ['In-person', 'Online', 'Both']
const SALON_BOOKING = ['Walk-in', 'Appointment', 'Both']
const FITNESS_FACILITIES = ['AC Gym', 'Pool', 'Sauna', 'Group Classes', 'Personal Training', 'Cardio Zone', 'Weight Zone']
const RETAIL_PRICE_RANGES = ['Budget', 'Mid-range', 'Premium', 'Luxury']

function BusinessOfferingsForm({
  businessType,
  value,
  onChange,
  clientId,
}: {
  businessType: string
  value: SectorData | null
  onChange: (d: SectorData | null) => void
  clientId: string
}) {
  const sector = detectSectorType(businessType || 'generic')
  const base: SectorData = value ?? { clientId, sectorType: sector, updatedAt: '' }

  function update(partial: Partial<SectorData>) {
    onChange({ ...base, ...partial, sectorType: sector, clientId })
  }

  if (sector === 'restaurant') {
    const items: MenuItem[] = base.restaurant?.menuItems ?? []
    const features: string[] = base.restaurant?.features ?? []
    const [newName, setNewName] = useState('')
    const [newCat, setNewCat] = useState(RESTAURANT_CATEGORIES[0])
    const [newPrice, setNewPrice] = useState('')

    function addItem() {
      if (!newName.trim()) return
      update({ restaurant: { menuItems: [...items, { name: newName.trim(), category: newCat, price: newPrice || undefined }], features } })
      setNewName(''); setNewPrice('')
    }
    function removeItem(i: number) {
      update({ restaurant: { menuItems: items.filter((_, idx) => idx !== i), features } })
    }
    function toggleFeature(f: string) {
      update({ restaurant: { menuItems: items, features: features.includes(f) ? features.filter(x => x !== f) : [...features, f] } })
    }

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Restaurant / Cafe Menu</p>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-700 flex-1">{item.name}</span>
              <span className="text-[10px] text-gray-400">{item.category}</span>
              {item.price && <span className="text-[10px] text-gray-400">₹{item.price}</span>}
              <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Dish name" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select value={newCat} onChange={e => setNewCat(e.target.value)} className="h-7 rounded border border-gray-200 px-1.5 text-xs focus:outline-none">
            {RESTAURANT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="₹ price" className="w-16 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="button" onClick={addItem} className="h-7 px-2.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">Features:</p>
          <div className="flex flex-wrap gap-1.5">
            {RESTAURANT_FEATURES.map(f => (
              <button key={f} type="button" onClick={() => toggleFeature(f)}
                className={cn('px-2.5 py-1 rounded-full text-[10px] border transition-colors', features.includes(f) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (sector === 'salon') {
    const services: ServiceItem[] = base.salon?.services ?? []
    const bookingType = base.salon?.bookingType ?? 'Both'
    const [newName, setNewName] = useState('')
    const [newCat, setNewCat] = useState(SALON_CATEGORIES[0])
    const [newPrice, setNewPrice] = useState('')

    function addService() {
      if (!newName.trim()) return
      update({ salon: { services: [...services, { name: newName.trim(), category: newCat, price: newPrice || undefined }], bookingType } })
      setNewName(''); setNewPrice('')
    }
    function removeService(i: number) {
      update({ salon: { services: services.filter((_, idx) => idx !== i), bookingType } })
    }

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-pink-600 uppercase tracking-wide">Salon / Beauty Services</p>
        <div className="space-y-1.5">
          {services.map((svc, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-700 flex-1">{svc.name}</span>
              <span className="text-[10px] text-gray-400">{svc.category}</span>
              {svc.price && <span className="text-[10px] text-gray-400">₹{svc.price}</span>}
              <button type="button" onClick={() => removeService(i)} className="text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Service name" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select value={newCat} onChange={e => setNewCat(e.target.value)} className="h-7 rounded border border-gray-200 px-1.5 text-xs focus:outline-none">
            {SALON_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="₹ price" className="w-16 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="button" onClick={addService} className="h-7 px-2.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Booking Type:</p>
          <div className="flex gap-1.5">
            {SALON_BOOKING.map(b => (
              <button key={b} type="button" onClick={() => update({ salon: { services, bookingType: b } })}
                className={cn('px-2.5 py-1 rounded-full text-[10px] border transition-colors', bookingType === b ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (sector === 'clinic') {
    const specializations: string[] = base.clinic?.specializations ?? []
    const treatments: TreatmentItem[] = base.clinic?.treatments ?? []
    const consultationType = base.clinic?.consultationType ?? 'In-person'
    const [newSpec, setNewSpec] = useState('')
    const [newTreatment, setNewTreatment] = useState('')

    function addSpec() {
      if (!newSpec.trim()) return
      update({ clinic: { specializations: [...specializations, newSpec.trim()], treatments, consultationType } })
      setNewSpec('')
    }
    function removeSpec(i: number) {
      update({ clinic: { specializations: specializations.filter((_, idx) => idx !== i), treatments, consultationType } })
    }
    function addTreatment() {
      if (!newTreatment.trim()) return
      update({ clinic: { specializations, treatments: [...treatments, { name: newTreatment.trim() }], consultationType } })
      setNewTreatment('')
    }
    function removeTreatment(i: number) {
      update({ clinic: { specializations, treatments: treatments.filter((_, idx) => idx !== i), consultationType } })
    }

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Clinic / Healthcare</p>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Specializations:</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {specializations.map((s, i) => (
              <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] rounded-full px-2.5 py-1">
                {s} <button type="button" onClick={() => removeSpec(i)}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="e.g. Dermatology" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button type="button" onClick={addSpec} className="h-7 px-2.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Treatments:</p>
          <div className="space-y-1 mb-2">
            {treatments.map((t, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                <span className="text-xs flex-1">{t.name}</span>
                <button type="button" onClick={() => removeTreatment(i)} className="text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newTreatment} onChange={e => setNewTreatment(e.target.value)} placeholder="e.g. Skin Consultation" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button type="button" onClick={addTreatment} className="h-7 px-2.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Consultation:</p>
          <div className="flex gap-1.5">
            {CLINIC_CONSULTATION.map(c => (
              <button key={c} type="button" onClick={() => update({ clinic: { specializations, treatments, consultationType: c } })}
                className={cn('px-2.5 py-1 rounded-full text-[10px] border transition-colors', consultationType === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (sector === 'fitness') {
    const programs: OfferingItem[] = base.fitness?.programs ?? []
    const facilities: string[] = base.fitness?.facilities ?? []
    const [newProgram, setNewProgram] = useState('')

    function addProgram() {
      if (!newProgram.trim()) return
      update({ fitness: { programs: [...programs, { name: newProgram.trim() }], facilities } })
      setNewProgram('')
    }
    function removeProgram(i: number) {
      update({ fitness: { programs: programs.filter((_, idx) => idx !== i), facilities } })
    }
    function toggleFacility(f: string) {
      update({ fitness: { programs, facilities: facilities.includes(f) ? facilities.filter(x => x !== f) : [...facilities, f] } })
    }

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Gym / Fitness</p>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Programs:</p>
          <div className="space-y-1 mb-2">
            {programs.map((p, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                <span className="text-xs flex-1">{p.name}</span>
                <button type="button" onClick={() => removeProgram(i)} className="text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newProgram} onChange={e => setNewProgram(e.target.value)} placeholder="e.g. Weight Loss Program" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button type="button" onClick={addProgram} className="h-7 px-2.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">Facilities:</p>
          <div className="flex flex-wrap gap-1.5">
            {FITNESS_FACILITIES.map(f => (
              <button key={f} type="button" onClick={() => toggleFacility(f)}
                className={cn('px-2.5 py-1 rounded-full text-[10px] border transition-colors', facilities.includes(f) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Generic / retail / everything else
  const offerings: OfferingItem[] = base.generic?.offerings ?? []
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  function addOffering() {
    if (!newName.trim()) return
    update({ generic: { offerings: [...offerings, { name: newName.trim(), description: newDesc.trim() || undefined }] } })
    setNewName(''); setNewDesc('')
  }
  function removeOffering(i: number) {
    update({ generic: { offerings: offerings.filter((_, idx) => idx !== i) } })
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Services / Offerings</p>
      <div className="space-y-1.5">
        {offerings.map((o, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-700 flex-1">{o.name}</span>
            {o.description && <span className="text-[10px] text-gray-400 truncate max-w-32">{o.description}</span>}
            <button type="button" onClick={() => removeOffering(i)} className="text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Service/product name" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description (optional)" className="flex-1 h-7 rounded border border-gray-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="button" onClick={addOffering} className="h-7 px-2.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type FormData = {
  business_name: string
  business_type: string
  city: string
  area: string
  color_tag: string
  owner_name: string
  phone: string
  email: string
  whatsapp: string
  gbp_link: string
  google_review_url: string
  language_preference: string
  website_url: string
  facebook_page: string
  instagram_handle: string
  package_type: string
  monthly_fee: string
  start_date: string
  renewal_date: string
  payment_status: string
  assigned_to: string
  next_followup_date: string
  notes: string
}

function ClientModal({
  client,
  profiles,
  onClose,
  onSaved,
}: {
  client?: Client
  profiles: Profile[]
  onClose: () => void
  onSaved: (c: Client) => void
}) {
  const isEdit = !!client
  const [form, setForm] = useState<FormData>({
    business_name: client?.business_name ?? '',
    business_type: client?.business_type ?? '',
    city: client?.city ?? 'Pune',
    area: client?.area ?? '',
    color_tag: client?.color_tag ?? '#3b82f6',
    owner_name: client?.owner_name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    whatsapp: client?.whatsapp ?? '',
    gbp_link: client?.gbp_link ?? '',
    google_review_url: client?.google_review_url ?? '',
    language_preference: client?.language_preference ?? 'English',
    website_url: client?.website_url ?? '',
    facebook_page: client?.facebook_page ?? '',
    instagram_handle: client?.instagram_handle ?? '',
    package_type: client?.package_type ?? 'Starter',
    monthly_fee: client?.monthly_fee?.toString() ?? '',
    start_date: client?.start_date ?? '',
    renewal_date: client?.renewal_date ?? '',
    payment_status: client?.payment_status ?? 'Pending',
    assigned_to: client?.assigned_to ?? '',
    next_followup_date: client?.next_followup_date ?? '',
    notes: client?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offeringsOpen, setOfferingsOpen] = useState(false)
  const [sectorData, setSectorData] = useState<SectorData | null>(null)

  // Load existing sector data when editing
  useEffect(() => {
    if (client?.id) {
      fetch(`/api/clients/sector-data?clientId=${client.id}`)
        .then(r => r.json())
        .then(j => { if (j.ok && j.data) setSectorData(j.data) })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.business_name.trim()) { setError('Business name is required'); return }
    setSaving(true)
    setError(null)
    const supabase = createBrowserClient()
    const payload = {
      business_name: form.business_name.trim(),
      business_type: form.business_type || null,
      city: form.city || 'Pune',
      area: form.area || null,
      color_tag: form.color_tag,
      owner_name: form.owner_name || null,
      phone: form.phone || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      gbp_link: form.gbp_link || null,
      google_review_url: form.google_review_url || null,
      language_preference: form.language_preference || 'English',
      website_url: form.website_url || null,
      facebook_page: form.facebook_page || null,
      instagram_handle: form.instagram_handle || null,
      package_type: form.package_type as Client['package_type'],
      monthly_fee: form.monthly_fee ? parseInt(form.monthly_fee) : null,
      start_date: form.start_date || null,
      renewal_date: form.renewal_date || null,
      payment_status: form.payment_status as Client['payment_status'],
      assigned_to: form.assigned_to || null,
      next_followup_date: form.next_followup_date || null,
      notes: form.notes || null,
      is_active: true,
      login_credentials: client?.login_credentials ?? [],
    }

    if (isEdit && client) {
      const { data, error: err } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', client.id)
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      if (sectorData) {
        await fetch('/api/clients/sector-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sectorData, clientId: client.id }),
        }).catch(() => {})
      }
      onSaved(data as Client)
    } else {
      const { data, error: err } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      if (sectorData) {
        await fetch('/api/clients/sector-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sectorData, clientId: (data as Client).id }),
        }).catch(() => {})
      }
      onSaved(data as Client)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Color tag */}
          <div>
            <FieldLabel>Client Color Tag</FieldLabel>
            <div className="flex gap-2 flex-wrap">
              {COLOR_TAGS.map(c => (
                <button key={c} onClick={() => set('color_tag', c)}
                  className={cn('h-7 w-7 rounded-full border-2 transition-all', form.color_tag === c ? 'border-gray-900 scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Business Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Business Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel>Business Name *</FieldLabel>
                <ModalInput value={form.business_name} onChange={v => set('business_name', v)} />
              </div>
              <div>
                <FieldLabel>Business Type</FieldLabel>
                <ModalInput value={form.business_type} onChange={v => set('business_type', v)} placeholder="Dentistry, Gym, etc." />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <ModalInput value={form.city} onChange={v => set('city', v)} />
              </div>
              <div className="col-span-2">
                <FieldLabel>Area / Locality</FieldLabel>
                <ModalInput value={form.area} onChange={v => set('area', v)} placeholder="Kothrud, Baner, Aundh..." />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel>Owner Name</FieldLabel>
                <ModalInput value={form.owner_name} onChange={v => set('owner_name', v)} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <ModalInput value={form.phone} onChange={v => set('phone', v)} type="tel" />
              </div>
              <div>
                <FieldLabel>WhatsApp</FieldLabel>
                <ModalInput value={form.whatsapp} onChange={v => set('whatsapp', v)} type="tel" />
              </div>
              <div className="col-span-2">
                <FieldLabel>Email</FieldLabel>
                <ModalInput value={form.email} onChange={v => set('email', v)} type="email" />
              </div>
            </div>
          </div>

          {/* Online Presence */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Online Presence</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel>GBP Link</FieldLabel>
                <ModalInput value={form.gbp_link} onChange={v => set('gbp_link', v)} placeholder="https://g.page/..." />
              </div>
              <div className="col-span-2">
                <FieldLabel>Google Review URL</FieldLabel>
                <ModalInput value={form.google_review_url} onChange={v => set('google_review_url', v)} placeholder="https://g.page/business/review" />
                {form.google_review_url && client?.id && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    Share review page: /review/{client.id}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Review Language</FieldLabel>
                <ModalSelect value={form.language_preference} onChange={v => set('language_preference', v)} options={[...LANGUAGES]} />
              </div>
              <div className="col-span-2">
                <FieldLabel>Website URL</FieldLabel>
                <ModalInput value={form.website_url} onChange={v => set('website_url', v)} placeholder="https://..." />
              </div>
              <div>
                <FieldLabel>Facebook Page</FieldLabel>
                <ModalInput value={form.facebook_page} onChange={v => set('facebook_page', v)} placeholder="pagename" />
              </div>
              <div>
                <FieldLabel>Instagram Handle</FieldLabel>
                <ModalInput value={form.instagram_handle} onChange={v => set('instagram_handle', v)} placeholder="@handle" />
              </div>
            </div>
          </div>

          {/* Package & Billing */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Package & Billing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Package</FieldLabel>
                <ModalSelect value={form.package_type} onChange={v => set('package_type', v)} options={['Starter', 'Growth', 'Premium']} />
              </div>
              <div>
                <FieldLabel>Monthly Fee (₹)</FieldLabel>
                <ModalInput value={form.monthly_fee} onChange={v => set('monthly_fee', v)} type="number" placeholder="12000" />
              </div>
              <div>
                <FieldLabel>Start Date</FieldLabel>
                <ModalInput value={form.start_date} onChange={v => set('start_date', v)} type="date" />
              </div>
              <div>
                <FieldLabel>Renewal Date</FieldLabel>
                <ModalInput value={form.renewal_date} onChange={v => set('renewal_date', v)} type="date" />
              </div>
              <div>
                <FieldLabel>Payment Status</FieldLabel>
                <ModalSelect value={form.payment_status} onChange={v => set('payment_status', v)} options={['Paid', 'Pending', 'Overdue']} />
              </div>
              <div>
                <FieldLabel>Next Follow-up</FieldLabel>
                <ModalInput value={form.next_followup_date} onChange={v => set('next_followup_date', v)} type="date" />
              </div>
            </div>
          </div>

          {/* Management */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Management</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <FieldLabel>Assigned Team Member</FieldLabel>
                <select
                  value={form.assigned_to}
                  onChange={e => set('assigned_to', e.target.value)}
                  className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Not assigned</option>
                  {profiles.filter(p => p.role !== 'client').map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Business Offerings */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOfferingsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <div>
                <p className="text-xs font-semibold text-gray-700">Business Offerings <span className="text-gray-400 font-normal">(Optional)</span></p>
                <p className="text-[10px] text-gray-400 mt-0.5">Menu items, services, or products — helps AI generate more specific content</p>
              </div>
              {offeringsOpen ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
            </button>
            {offeringsOpen && (
              <div className="px-4 py-4 space-y-4">
                <BusinessOfferingsForm
                  businessType={form.business_type}
                  value={sectorData}
                  onChange={setSectorData}
                  clientId={client?.id ?? ''}
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="h-9 px-5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage({
  initialClients,
  initialProfiles,
}: {
  initialClients: Client[]
  initialProfiles: Profile[]
}) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [filterPkg, setFilterPkg] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState<Client | undefined>()
  const [qrClient, setQrClient] = useState<Client | undefined>()
  const [isPending, startTransition] = useTransition()

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.business_name.toLowerCase().includes(q) || c.area?.toLowerCase().includes(q) || c.owner_name?.toLowerCase().includes(q)
    const matchPkg = filterPkg === 'All' || c.package_type === filterPkg
    const matchStatus = filterStatus === 'All' || c.payment_status === filterStatus
    return matchSearch && matchPkg && matchStatus
  })

  function openAdd() { setEditClient(undefined); setShowModal(true) }
  function openEdit(c: Client) { setEditClient(c); setShowModal(true) }

  function handleSaved(saved: Client) {
    setClients(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    startTransition(() => router.refresh())
  }

  async function handleDelete(clientId: string) {
    const supabase = createBrowserClient()
    await supabase.from('clients').update({ is_active: false }).eq('id', clientId)
    setClients(prev => prev.filter(c => c.id !== clientId))
    startTransition(() => router.refresh())
  }

  const totalMRR = clients.reduce((s, c) => s + (c.monthly_fee ?? 0), 0)
  const overdue = clients.filter(c => c.payment_status === 'Overdue').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Clients"
        subtitle={`${clients.filter(c => c.is_active).length} active clients · ${formatINR(totalMRR)}/month MRR`}
        actions={
          <button onClick={openAdd} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Client
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
              className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterPkg} onChange={e => setFilterPkg(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Packages</option>
            <option>Starter</option><option>Growth</option><option>Premium</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Payments</option>
            <option>Paid</option><option>Pending</option><option>Overdue</option>
          </select>
          <span className="ml-auto text-xs text-gray-500">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
          {overdue > 0 && (
            <span className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1 font-medium">
              ⚠️ {overdue} overdue payment{overdue > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Client', 'Contact', 'Package', 'Fee', 'Payment', 'Assigned To', 'Score', 'Follow-up', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(client => {
                  const assignee = initialProfiles.find(p => p.id === client.assigned_to)
                  return (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ClientAvatar client={client} size="xl" className="rounded-xl" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{client.business_name}</p>
                            <p className="text-xs text-gray-400 truncate">{client.area ? `${client.area}, ` : ''}{client.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700 font-medium">{client.owner_name}</p>
                          <div className="flex items-center gap-2">
                            {client.phone && <a href={`tel:${client.phone}`} className="text-gray-400 hover:text-blue-600"><Phone className="h-3 w-3" /></a>}
                            {client.whatsapp && <a href={`https://wa.me/91${client.whatsapp}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-600"><MessageCircle className="h-3 w-3" /></a>}
                            {client.website_url && <a href={client.website_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600"><Globe className="h-3 w-3" /></a>}
                            {client.gbp_link && <a href={client.gbp_link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-500"><ExternalLink className="h-3 w-3" /></a>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(client.package_type ?? 'Starter'))}>
                          {client.package_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{formatINR(client.monthly_fee)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(client.payment_status ?? 'Pending'))}>
                          {client.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                              {getInitials(assignee.full_name ?? 'TM')}
                            </div>
                            <span className="text-xs text-gray-600 hidden xl:block">{assignee.full_name?.split(' ')[0]}</span>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3"><ScoreBadge score={client.performance_score} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(client.next_followup_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {client.google_review_url && (
                            <button
                              onClick={() => setQrClient(client)}
                              title="Copy review URL / Download QR"
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                              <QrCode className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => openEdit(client)} className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(client.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {clients.length === 0 ? 'No clients yet. Add your first client!' : 'No clients match your search.'}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <ClientModal
          client={editClient}
          profiles={initialProfiles}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {qrClient && (
        <ReviewQRModal
          client={qrClient}
          onClose={() => setQrClient(undefined)}
        />
      )}
    </div>
  )
}
