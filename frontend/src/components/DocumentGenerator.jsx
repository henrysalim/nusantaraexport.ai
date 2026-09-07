import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Ship, DollarSign, Download,
  ChevronRight, ChevronLeft, Save, CheckCircle2, Plus,
  FolderOpen, Trash2, Clock, AlertCircle, User, ExternalLink
} from 'lucide-react'
import StepProdukBuyer from './docs/StepProdukBuyer'
import StepPengiriman from './docs/StepPengiriman'
import StepKeuangan from './docs/StepKeuangan'
import StepUnduh from './docs/StepUnduh'
import { saveDocDraft, getDocDrafts, getDocDraft, deleteDocDraft, generateDocPDF } from '../services/api'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── Step config (4 steps, Profil removed — auto-filled from account) ─
const STEPS = [
  { key: 'produk',   label: 'Produk & Buyer',   icon: Package,     short: 'Produk' },
  { key: 'kirim',    label: 'Pengiriman',        icon: Ship,        short: 'Kirim' },
  { key: 'biaya',    label: 'Keuangan',          icon: DollarSign,  short: 'Biaya' },
  { key: 'unduh',    label: 'Unduh Dokumen',     icon: Download,    short: 'Unduh' },
]

const EMPTY_FORM = {
  title: 'Draft Dokumen Ekspor',
  // Company info — auto-filled from user profile, not editable in wizard
  company_logo_url: null,
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_website: '',
  owner_name: '',
  // Step 1: Produk & Buyer
  product_name: '',
  hs_code: '',
  product_spec: '',
  items: [{ name: '', hs_code: '', qty_kg: '', qty_bags: '', price_usd: '', total_usd: '' }],
  buyer_name: '',
  buyer_country: '',
  buyer_address: '',
  incoterm: '',
  payment_method: '',
  transaction_date: '',
  invoice_ref_no: '',
  // Step 2: Pengiriman
  port_loading: '',
  port_destination: '',
  vessel_name: '',
  etd_date: '',
  eta_date: '',
  container_no: '',
  seal_no: '',
  container_type: '',
  forwarder_name: '',
  pickup_address: '',
  // Step 3: Keuangan
  usd_idr_rate: '',
  price_at_warehouse: '',
  qty_kg: '',
  loading_cost: '',
  trucking_cost: '',
  thc_cost: '',
  insurance_pct: '',
  deposit_pct: '30',
  bank_account: '',
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  return `${Math.floor(hrs / 24)} hari lalu`
}

// ─── Main Component ───────────────────────────────────────────────
export default function DocumentGenerator() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [view, setView] = useState('checking') // 'checking' | 'no-profile' | 'list' | 'wizard'
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [profileData, setProfileData] = useState(null) // company info from user profile
  const [draftId, setDraftId] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [downloading, setDownloading] = useState({})
  const [downloaded, setDownloaded] = useState({})

  // ── On mount: load user profile & guard business_name
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.get('/api/auth/me')
        const data = res.data?.user ?? res.data
        const profile = {
          company_name: data.business_name || data.full_name || '',
          company_phone: data.phone || '',
          company_email: data.email || '',
          company_website: '',
          owner_name: data.full_name || '',
          company_address: data.province ? `Provinsi ${data.province}` : '',
          company_logo_url: null,
        }
        setProfileData(profile)

        // Guard: jika business_name belum diisi → tampilkan prompt
        if (!data.business_name || data.business_name.trim() === '') {
          setView('no-profile')
        } else {
          setView('list')
        }
      } catch {
        // Fallback dari AuthContext — tidak bisa cek business_name, lanjut saja
        if (user) {
          setProfileData({
            company_name: user.full_name || '',
            company_phone: '',
            company_email: user.email || '',
            company_website: '',
            owner_name: user.full_name || '',
            company_address: '',
            company_logo_url: null,
          })
        }
        setView('list')
      }
    }
    checkProfile()
  }, [user])

  // Load drafts on mount
  useEffect(() => {
    if (view === 'list') loadDrafts()
  }, [view])

  async function loadDrafts() {
    setLoadingDrafts(true)
    try {
      const res = await getDocDrafts()
      setDrafts(res.data || [])
    } catch {
      setDrafts([])
    } finally {
      setLoadingDrafts(false)
    }
  }

  // ── Field update
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ── Save draft (always inject fresh profile data)
  async function handleSave(silent = false) {
    setSaving(true)
    setSaveError(null)
    try {
      // Merge current profile info into the saved body
      const body = { ...profileData, ...formData }
      const res = await saveDocDraft(body, draftId)
      if (!draftId) setDraftId(res.data.id)
      if (!silent) {
        setSaveMsg('Draft tersimpan!')
        setTimeout(() => setSaveMsg(null), 2500)
      }
      return res.data.id
    } catch (err) {
      if (!silent) setSaveError('Gagal menyimpan draft. Coba lagi.')
      return null
    } finally {
      setSaving(false)
    }
  }

  // ── Next step (auto-save)
  async function handleNext() {
    const id = await handleSave(true)
    if (!draftId && id) setDraftId(id)
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1)
  }

  // ── Open existing draft
  async function handleOpenDraft(id) {
    try {
      const res = await getDocDraft(id)
      const data = res.data
      // Override company fields with current profile so they stay fresh
      setFormData({ ...EMPTY_FORM, ...data, ...profileData })
      setDraftId(id)
      setCurrentStep(0)
      setDownloaded({})
      setView('wizard')
    } catch {
      alert('Gagal memuat draft.')
    }
  }

  // ── New draft
  function handleNewDraft() {
    // Pre-populate company info from user profile
    setFormData({ ...EMPTY_FORM, ...(profileData || {}) })
    setDraftId(null)
    setCurrentStep(0)
    setDownloaded({})
    setSaveMsg(null)
    setSaveError(null)
    setView('wizard')
  }

  // ── Delete draft
  async function handleDeleteDraft(id, e) {
    e.stopPropagation()
    if (!confirm('Hapus draft ini?')) return
    try {
      await deleteDocDraft(id)
      setDrafts(d => d.filter(dr => dr.id !== id))
    } catch {
      alert('Gagal menghapus draft.')
    }
  }

  // ── Download PDF
  async function handleDownload(docType) {
    setDownloading(d => ({ ...d, [docType]: true }))
    try {
      let currentId = draftId
      if (!currentId) {
        currentId = await handleSave(true)
      }
      if (!currentId) {
        alert('Gagal menyimpan draft sebelum mengunduh. Silakan coba lagi.')
        return
      }
      const res = await generateDocPDF(docType, currentId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeCompany = (formData.company_name || 'dokumen').replace(/\s+/g, '_')
      a.download = `${docType}_${safeCompany}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setDownloaded(d => ({ ...d, [docType]: true }))
    } catch (err) {
      console.error('Download PDF error:', err)
      alert(`Gagal membuat PDF untuk ${docType}. Pastikan server backend sedang aktif.`)
    } finally {
      setDownloading(d => ({ ...d, [docType]: false }))
    }
  }

  // ─── VIEW: CHECKING PROFILE ───────────────────────────────────
  if (view === 'checking') {
    return (
      <div className="flex items-center justify-center py-16 text-secondary/30">
        <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Memuat profil...
      </div>
    )
  }

  // ─── VIEW: NO BUSINESS_NAME GUARD ────────────────────────────
  if (view === 'no-profile') {
    return (
      <div className="flex flex-col items-center text-center py-10 space-y-5">
        {/* Icon */}
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
          <User size={28} className="text-amber-500" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-black text-secondary">Lengkapi Profil Usaha Anda</h3>
          <p className="text-sm text-secondary/50 leading-relaxed">
            Nama usaha Anda belum diisi. Data ini diperlukan untuk mengisi header semua dokumen ekspor secara otomatis.
          </p>
        </div>
        <button
          onClick={() => navigate('/profil')}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-black
            rounded-xl hover:bg-accent/90 shadow-md shadow-accent/20 transition-all hover:scale-[1.02]"
          id="btn-goto-profile"
        >
          <ExternalLink size={15} />
          Lengkapi Profil Sekarang
        </button>
        <button
          onClick={() => setView('list')}
          className="text-xs text-secondary/30 hover:text-secondary/50 underline transition-colors"
        >
          Lewati dan lanjutkan tanpa nama usaha
        </button>
      </div>
    )
  }

  // ─── VIEW: DRAFT LIST ─────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="space-y-5" role="region" aria-label="Daftar draft dokumen ekspor">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-secondary">Generator Dokumen Ekspor</h3>
            <p className="text-xs text-secondary/50 font-medium mt-0.5">
              9 dokumen ekspor otomatis — data tersimpan sebagai draft
            </p>
          </div>
          <button
            onClick={handleNewDraft}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-black
              rounded-xl hover:bg-accent/90 shadow-md shadow-accent/20 transition-all hover:scale-[1.02]"
            id="btn-new-draft"
          >
            <Plus size={15} />
            Buat Baru
          </button>
        </div>

        {/* Draft List */}
        {loadingDrafts ? (
          <div className="flex items-center justify-center py-12 text-secondary/30">
            <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Memuat draft...
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <FolderOpen size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-black text-secondary/50 text-sm">Belum ada draft</p>
            <p className="text-xs text-secondary/30 mt-1">Klik "Buat Baru" untuk mulai membuat dokumen ekspor</p>
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => handleOpenDraft(draft.id)}
                className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4
                  hover:border-accent/30 hover:shadow-sm transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-secondary text-sm truncate">
                      {draft.title || 'Draft Dokumen Ekspor'}
                    </p>
                    {draft.status === 'completed' && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[9px] font-black rounded-md">
                        SELESAI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {draft.company_name && (
                      <span className="text-xs text-secondary/40 font-medium">{draft.company_name}</span>
                    )}
                    {draft.buyer_name && (
                      <>
                        <span className="text-secondary/20">→</span>
                        <span className="text-xs text-secondary/40">{draft.buyer_name}</span>
                      </>
                    )}
                    {draft.buyer_country && (
                      <span className="text-xs text-accent/60 font-medium">{draft.buyer_country}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1 text-[10px] text-secondary/30 font-medium">
                    <Clock size={10} />
                    {formatRelativeTime(draft.updated_at)}
                  </span>
                  <button
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                    aria-label="Hapus draft"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={16} className="text-secondary/20 group-hover:text-accent transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── VIEW: WIZARD ───────────────────────────────────────────────
  const StepComponents = [StepProdukBuyer, StepPengiriman, StepKeuangan, StepUnduh]
  const ActiveStep = StepComponents[currentStep]
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="space-y-5" role="region" aria-label="Wizard pembuatan dokumen ekspor">

      {/* Back to list */}
      <button
        onClick={() => { setView('list'); loadDrafts() }}
        className="flex items-center gap-1.5 text-sm text-secondary/50 font-bold hover:text-accent transition-colors"
      >
        <ChevronLeft size={16} />
        Kembali ke Daftar Draft
      </button>

      {/* Draft Title */}
      <input
        className="w-full text-lg font-black text-secondary bg-transparent border-0 outline-none
          placeholder:text-secondary/20 border-b-2 border-transparent focus:border-accent/30 pb-1 transition-all"
        placeholder="Nama Draft (contoh: Ekspor Kopi Gayo ke Jepang)"
        value={formData.title || ''}
        onChange={e => handleChange('title', e.target.value)}
      />

      {/* Step Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isActive = idx === currentStep
          const isDone = idx < currentStep
          return (
            <button
              key={step.key}
              role="tab"
              aria-selected={isActive}
              onClick={async () => {
                // auto-save before jumping
                if (idx > currentStep) {
                  await handleSave(true)
                }
                setCurrentStep(idx)
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap
                transition-all relative flex-shrink-0
                ${isActive
                  ? 'bg-secondary text-white shadow-md'
                  : isDone
                    ? 'bg-accent/10 text-accent hover:bg-accent/20'
                    : 'bg-slate-100 text-secondary/40 hover:bg-slate-200 hover:text-secondary/60'
                }`}
            >
              {isDone ? (
                <CheckCircle2 size={13} />
              ) : (
                <Icon size={13} />
              )}
              <span className="hidden sm:block">{step.label}</span>
              <span className="sm:hidden">{step.short}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-secondary rounded-full pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>

      {/* Save status */}
      {(saveMsg || saveError) && (
        <div className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl
          ${saveMsg ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
          {saveMsg ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {saveMsg || saveError}
        </div>
      )}

      {/* Profile Info Banner — auto-filled from user profile */}
      {profileData?.company_name && (
        <div className="flex items-center gap-3 bg-accent/5 border border-accent/10 rounded-xl px-4 py-2.5">
          <div className="w-7 h-7 bg-accent-light rounded-lg flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary/40 font-medium">Data perusahaan dari profil Anda</p>
            <p className="text-xs font-black text-secondary truncate">
              {profileData.company_name}
              {profileData.company_phone && <span className="font-normal text-secondary/50"> · {profileData.company_phone}</span>}
            </p>
          </div>
          <button
            onClick={() => navigate('/profil')}
            className="flex items-center gap-1 text-[10px] text-accent font-black hover:underline flex-shrink-0"
          >
            <ExternalLink size={10} />
            Edit
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 min-h-[300px]"
           role="tabpanel" id={`step-panel-${currentStep}`}>
        {isLastStep ? (
          <StepUnduh
            docId={draftId}
            formData={formData}
            downloading={downloading}
            downloaded={downloaded}
            onDownload={handleDownload}
            onNavigateStep={setCurrentStep}
          />
        ) : (
          <ActiveStep formData={formData} onChange={handleChange} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pt-3 pb-6 sm:pb-0 border-t border-slate-100">
        <button
          onClick={() => currentStep === 0 ? setView('list') : setCurrentStep(s => s - 1)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-secondary/60
            bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
        >
          <ChevronLeft size={15} />
          {currentStep === 0 ? 'Batal' : 'Sebelumnya'}
        </button>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Manual save */}
          {!isLastStep && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-accent
                bg-accent-light rounded-xl hover:bg-accent/15 transition-all"
              id="btn-save-draft"
            >
              <Save size={13} />
              {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
          )}

          {/* Next / Finish */}
          {!isLastStep && (
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-white
                bg-accent rounded-xl hover:bg-accent/90 shadow-md shadow-accent/20 transition-all
                hover:scale-[1.02] disabled:opacity-60"
              id={`btn-step-next-${currentStep}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  Selanjutnya
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Draft ID info */}
      {draftId && (
        <p className="text-[10px] text-secondary/20 text-center font-mono">
          Draft ID: {draftId}
        </p>
      )}
    </div>
  )
}
