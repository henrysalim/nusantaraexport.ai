import { Upload, Building2, Phone, Mail, Globe, User } from 'lucide-react'
import { useRef } from 'react'

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest">
      {label} {required && <span className="text-accent">*</span>}
    </label>
    {children}
  </div>
)

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/30" />
    )}
    <input
      {...props}
      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-secondary
        placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50
        transition-all ${Icon ? 'pl-9' : ''}`}
    />
  </div>
)

const Textarea = ({ ...props }) => (
  <textarea
    rows={3}
    {...props}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-secondary
      placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50
      transition-all resize-none"
  />
)

export default function StepProfilUMKM({ formData, onChange }) {
  const fileRef = useRef()

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => onChange('company_logo_url', reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-secondary/60 uppercase tracking-widest">
          Logo Perusahaan
        </label>
        <div className="flex items-center gap-4">
          {formData.company_logo_url ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-accent/20 bg-slate-50 flex-shrink-0">
              <img
                src={formData.company_logo_url}
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50
              flex items-center justify-center text-secondary/20 flex-shrink-0">
              <Building2 size={28} />
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-accent-light text-accent text-sm font-bold
                rounded-xl hover:bg-accent hover:text-white transition-all"
            >
              <Upload size={14} />
              {formData.company_logo_url ? 'Ganti Logo' : 'Upload Logo'}
            </button>
            <p className="text-xs text-secondary/40 mt-1">PNG, JPG maks 2MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>
      </div>

      {/* Company Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Perusahaan / UMKM" required>
          <Input
            icon={Building2}
            placeholder="CV Nusantara Jaya Ekspor"
            value={formData.company_name || ''}
            onChange={e => onChange('company_name', e.target.value)}
          />
        </Field>

        <Field label="Nama Pemilik / Penandatangan" required>
          <Input
            icon={User}
            placeholder="Budi Santoso"
            value={formData.owner_name || ''}
            onChange={e => onChange('owner_name', e.target.value)}
          />
        </Field>

        <Field label="Nomor Telepon" required>
          <Input
            icon={Phone}
            placeholder="+62 812 3456 7890"
            value={formData.company_phone || ''}
            onChange={e => onChange('company_phone', e.target.value)}
          />
        </Field>

        <Field label="Email">
          <Input
            icon={Mail}
            type="email"
            placeholder="info@perusahaan.com"
            value={formData.company_email || ''}
            onChange={e => onChange('company_email', e.target.value)}
          />
        </Field>

        <Field label="Website">
          <Input
            icon={Globe}
            placeholder="www.perusahaan.com"
            value={formData.company_website || ''}
            onChange={e => onChange('company_website', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Alamat Lengkap" required>
        <Textarea
          placeholder="Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta 10220"
          value={formData.company_address || ''}
          onChange={e => onChange('company_address', e.target.value)}
        />
      </Field>

      {/* Preview card */}
      {(formData.company_name || formData.company_phone) && (
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 flex items-center gap-4">
          {formData.company_logo_url ? (
            <img src={formData.company_logo_url} alt="" className="w-10 h-10 object-contain rounded-xl" />
          ) : (
            <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-accent" />
            </div>
          )}
          <div>
            <p className="font-black text-secondary text-sm">{formData.company_name || '—'}</p>
            <p className="text-xs text-secondary/50">{formData.company_phone} {formData.company_email && `· ${formData.company_email}`}</p>
          </div>
        </div>
      )}
    </div>
  )
}
