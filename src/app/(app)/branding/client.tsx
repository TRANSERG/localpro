'use client'
import { useState, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { Client, BrandingProfile, POST_TYPES, BrandTone } from '@/types'
import { cn, getInitials } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { Plus, Edit2, Trash2, X, Upload, Loader2 } from 'lucide-react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

const BRAND_TONES: BrandTone[] = ['Formal', 'Friendly', 'Bold', 'Playful', 'Professional']

// ─── Stable helper components (outside main component to avoid focus loss) ────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-gray-600 mb-1">{children}</label>
}

function ModalInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
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

function ModalTextarea({
  value,
  onChange,
  placeholder = '',
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    />
  )
}

// ─── Logo upload ──────────────────────────────────────────────────────────────

const MAX_LOGO_BYTES = 300 * 1024 // 300 KB

function LogoUpload({
  currentUrl,
  clientId,
  onUploaded,
  onError,
  onUploading,
}: {
  currentUrl: string
  clientId: string
  onUploaded: (url: string) => void
  onError: (msg: string) => void
  onUploading: (v: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (file.size > MAX_LOGO_BYTES) {
      onError(`Logo must be under 300 KB (selected file is ${(file.size / 1024).toFixed(0)} KB)`)
      return
    }
    setUploading(true)
    onUploading(true)
    onError('')
    const supabase = createBrowserClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${clientId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })
    if (error) {
      onError(error.message)
      setUploading(false)
      onUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    onUploaded(publicUrl)
    setUploading(false)
    onUploading(false)
  }

  return (
    <div>
      {currentUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={currentUrl}
            alt="Brand logo"
            className="h-14 w-14 object-contain rounded-lg border border-gray-200 bg-gray-50 p-1 shrink-0"
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50 text-left"
            >
              {uploading ? 'Uploading…' : 'Change logo'}
            </button>
            <button
              type="button"
              onClick={() => onUploaded('')}
              className="text-xs text-red-500 hover:underline text-left"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full h-16 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm disabled:opacity-50"
        >
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            : <><Upload className="h-4 w-4" /> Click to upload logo</>}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP, SVG · max 300 KB</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type FormData = {
  primary_color: string
  secondary_color: string
  brand_tone: BrandTone
  content_pillars_raw: string   // comma-separated
  content_dos: string
  content_donts: string
  hashtag_bank: string
  caption_templates: string
  approved_post_types: string[]
  posting_frequency: string
  logo_url: string
  notes: string
}

const EMPTY_FORM: FormData = {
  primary_color: '#3b82f6',
  secondary_color: '#93c5fd',
  brand_tone: 'Professional',
  content_pillars_raw: '',
  content_dos: '',
  content_donts: '',
  hashtag_bank: '',
  caption_templates: '',
  approved_post_types: [],
  posting_frequency: '',
  logo_url: '',
  notes: '',
}

function brandingToForm(b: BrandingProfile): FormData {
  return {
    primary_color: b.primary_color ?? '#3b82f6',
    secondary_color: b.secondary_color ?? '#93c5fd',
    brand_tone: b.brand_tone ?? 'Professional',
    content_pillars_raw: (b.content_pillars ?? []).join(', '),
    content_dos: b.content_dos ?? '',
    content_donts: b.content_donts ?? '',
    hashtag_bank: b.hashtag_bank ?? '',
    caption_templates: b.caption_templates ?? '',
    approved_post_types: b.approved_post_types ?? [],
    posting_frequency: b.posting_frequency?.toString() ?? '',
    logo_url: b.logo_url ?? '',
    notes: b.notes ?? '',
  }
}

function formToPayload(form: FormData) {
  return {
    primary_color: form.primary_color || null,
    secondary_color: form.secondary_color || null,
    brand_tone: form.brand_tone || null,
    content_pillars: form.content_pillars_raw
      ? form.content_pillars_raw.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    content_dos: form.content_dos || null,
    content_donts: form.content_donts || null,
    hashtag_bank: form.hashtag_bank || null,
    caption_templates: form.caption_templates || null,
    approved_post_types: form.approved_post_types,
    posting_frequency: form.posting_frequency ? parseInt(form.posting_frequency) : null,
    logo_url: form.logo_url || null,
    notes: form.notes || null,
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function BrandingModal({
  branding,
  clientId,
  clientName,
  onClose,
  onSaved,
}: {
  branding?: BrandingProfile
  clientId: string
  clientName: string
  onClose: () => void
  onSaved: (b: BrandingProfile) => void
}) {
  const isEdit = !!branding
  const [form, setForm] = useState<FormData>(branding ? brandingToForm(branding) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const set = (k: keyof FormData, v: string | string[]) =>
    setForm(f => ({ ...f, [k]: v }))

  function togglePostType(type: string) {
    setForm(f => ({
      ...f,
      approved_post_types: f.approved_post_types.includes(type)
        ? f.approved_post_types.filter(t => t !== type)
        : [...f.approved_post_types, type],
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const payload = formToPayload(form)

    const res = await fetch(
      isEdit ? '/api/branding' : '/api/branding',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: branding!.id, ...payload } : { client_id: clientId, ...payload }),
      },
    )
    const json = await res.json()
    if (!json.ok) {
      setError(json.error ?? 'Failed to save')
      setSaving(false)
      return
    }
    onSaved(json.data as BrandingProfile)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Branding' : 'Create Branding Profile'} — {clientName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Brand Identity */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brand Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Primary Color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    className="h-8 w-12 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <ModalInput value={form.primary_color} onChange={v => set('primary_color', v)} placeholder="#3b82f6" />
                </div>
              </div>
              <div>
                <FieldLabel>Secondary Color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={e => set('secondary_color', e.target.value)}
                    className="h-8 w-12 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <ModalInput value={form.secondary_color} onChange={v => set('secondary_color', v)} placeholder="#93c5fd" />
                </div>
              </div>
              <div className="col-span-2">
                <FieldLabel>Brand Logo</FieldLabel>
                <LogoUpload
                  currentUrl={form.logo_url}
                  clientId={clientId}
                  onUploaded={url => set('logo_url', url)}
                  onError={msg => setError(msg)}
                  onUploading={setLogoUploading}
                />
              </div>
              <div>
                <FieldLabel>Posting Frequency (per week)</FieldLabel>
                <ModalInput value={form.posting_frequency} onChange={v => set('posting_frequency', v)} type="number" placeholder="3" />
              </div>
            </div>
          </div>

          {/* Brand Tone */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brand Tone</p>
            <div className="flex gap-2 flex-wrap">
              {BRAND_TONES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('brand_tone', t)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    form.brand_tone === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Content Pillars */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content</p>
            <div className="space-y-3">
              <div>
                <FieldLabel>Content Pillars (comma-separated)</FieldLabel>
                <ModalInput
                  value={form.content_pillars_raw}
                  onChange={v => set('content_pillars_raw', v)}
                  placeholder="Tips & Education, Before/After, Patient Stories"
                />
              </div>
              <div>
                <FieldLabel>Content Do's</FieldLabel>
                <ModalTextarea value={form.content_dos} onChange={v => set('content_dos', v)} placeholder="Use clear CTAs, post patient testimonials..." />
              </div>
              <div>
                <FieldLabel>Content Don'ts</FieldLabel>
                <ModalTextarea value={form.content_donts} onChange={v => set('content_donts', v)} placeholder="Avoid medical jargon, no stock photos..." />
              </div>
            </div>
          </div>

          {/* Approved Post Types */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Approved Post Types</p>
            <div className="flex gap-2 flex-wrap">
              {(POST_TYPES as readonly string[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => togglePostType(t)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    form.approved_post_types.includes(t)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {form.approved_post_types.includes(t) ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Social Templates</p>
            <div className="space-y-3">
              <div>
                <FieldLabel>Hashtag Bank</FieldLabel>
                <ModalTextarea value={form.hashtag_bank} onChange={v => set('hashtag_bank', v)} placeholder="#PuneDentist #SmilePune #KothrudDental..." />
              </div>
              <div>
                <FieldLabel>Caption Templates</FieldLabel>
                <ModalTextarea value={form.caption_templates} onChange={v => set('caption_templates', v)} rows={4} placeholder="Template 1: [Emoji] Headline&#10;Body copy...&#10;&#10;Template 2: ..." />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <FieldLabel>Internal Notes</FieldLabel>
            <ModalTextarea value={form.notes} onChange={v => set('notes', v)} placeholder="Any additional branding notes..." />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || logoUploading}
            className="h-9 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {logoUploading ? 'Uploading logo…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  clientName,
  onConfirm,
  onCancel,
}: {
  clientName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-2">Delete Branding Profile?</h2>
        <p className="text-sm text-gray-500 mb-6">
          This will permanently delete the branding profile for <strong>{clientName}</strong>. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrandingPage({
  initialBrandings,
  initialClients,
}: {
  initialBrandings: BrandingProfile[]
  initialClients: Client[]
}) {
  const [brandings, setBrandings] = useState(initialBrandings)
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? '')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BrandingProfile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const branding = brandings.find(b => b.client_id === selectedClientId) ?? null
  const client = initialClients.find(c => c.id === selectedClientId)

  function handleSaved(b: BrandingProfile) {
    setBrandings(prev => {
      const idx = prev.findIndex(x => x.id === b.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = b
        return next
      }
      return [...prev, b]
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/branding?id=${deleteTarget.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      setBrandings(prev => prev.filter(b => b.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Branding & Content" subtitle="Client brand profiles and content guidelines" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Client list */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:w-52 lg:shrink-0">
            {initialClients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={cn(
                  'shrink-0 text-left rounded-xl p-3 border transition-colors min-w-[150px] lg:min-w-0 lg:w-full',
                  selectedClientId === c.id
                    ? 'bg-white border-blue-200 shadow-sm'
                    : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200',
                )}
              >
                <div className="flex items-center gap-2">
                  <ClientAvatar client={c} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{c.business_name}</p>
                    {brandings.some(b => b.client_id === c.id) && (
                      <p className="text-[10px] text-green-600 font-medium">Profile set</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Branding content */}
          <div className="flex-1 space-y-4 min-w-0">
            {branding && client ? (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-700">{client.business_name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(branding)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>

                {/* Colors & Tone */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Brand Identity</p>
                  <div className="flex flex-wrap gap-6 items-start">
                    {branding.logo_url && (
                      <div>
                        <p className="text-[11px] text-gray-500 mb-2">Logo</p>
                        <img
                          src={branding.logo_url}
                          alt="Brand logo"
                          className="h-12 w-auto max-w-[80px] object-contain rounded-lg border border-gray-200 bg-gray-50 p-1"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">Primary Color</p>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: branding.primary_color ?? '#3b82f6' }} />
                        <span className="text-xs font-mono text-gray-700">{branding.primary_color ?? '—'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">Secondary Color</p>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: branding.secondary_color ?? '#93c5fd' }} />
                        <span className="text-xs font-mono text-gray-700">{branding.secondary_color ?? '—'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">Brand Tone</p>
                      <div className="flex gap-2 flex-wrap">
                        {BRAND_TONES.map(t => (
                          <span
                            key={t}
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[11px] font-medium border',
                              t === branding.brand_tone
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-50 text-gray-500 border-gray-200',
                            )}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {branding.posting_frequency && (
                      <div>
                        <p className="text-[11px] text-gray-500 mb-2">Posting Frequency</p>
                        <p className="text-sm font-bold text-gray-900">{branding.posting_frequency}x / week</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content pillars */}
                {branding.content_pillars?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Pillars</p>
                    <div className="flex flex-wrap gap-2">
                      {branding.content_pillars.map((p, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: `${client.color_tag}15`, color: client.color_tag ?? '#3b82f6', borderColor: `${client.color_tag}30` }}
                          className="rounded-full px-3 py-1 text-xs font-medium border"
                        >
                          {i + 1}. {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved post types */}
                {branding.approved_post_types?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Approved Post Types</p>
                    <div className="flex flex-wrap gap-2">
                      {(POST_TYPES as readonly string[]).map(t => (
                        <span
                          key={t}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium border',
                            branding.approved_post_types.includes(t)
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-400 border-gray-200',
                          )}
                        >
                          {branding.approved_post_types.includes(t) ? '✓ ' : ''}{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(branding.content_dos || branding.content_donts) && (
                  <div className="grid grid-cols-2 gap-4">
                    {branding.content_dos && (
                      <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">✅ Content Do's</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{branding.content_dos}</p>
                      </div>
                    )}
                    {branding.content_donts && (
                      <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">❌ Content Don'ts</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{branding.content_donts}</p>
                      </div>
                    )}
                  </div>
                )}

                {branding.hashtag_bank && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"># Hashtag Bank</p>
                    <p className="text-sm text-blue-600 font-mono leading-relaxed">{branding.hashtag_bank}</p>
                  </div>
                )}

                {branding.caption_templates && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Caption Templates</p>
                    <pre className="text-sm text-gray-700 font-sans whitespace-pre-line leading-relaxed">{branding.caption_templates}</pre>
                  </div>
                )}

                {branding.notes && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-gray-700">{branding.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                {initialClients.length === 0 ? (
                  <p className="text-sm text-gray-400">No clients yet. Add clients first.</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4">No branding profile for {client?.business_name ?? 'this client'} yet.</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" /> Create Branding Profile
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {modalOpen && client && (
        <BrandingModal
          branding={branding ?? undefined}
          clientId={selectedClientId}
          clientName={client.business_name}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          clientName={client?.business_name ?? ''}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
