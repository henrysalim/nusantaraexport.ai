import { DollarSign, Truck, Anchor, Shield, Percent, CreditCard, HelpCircle } from 'lucide-react'

// Tooltip helper component
const Tooltip = ({ content }) => (
  <div className="group relative inline-block ml-1 cursor-pointer align-middle">
    <HelpCircle size={13} className="text-secondary/40 hover:text-accent transition-colors" />
    <span className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all 
      bg-slate-800 text-white text-[10px] p-2.5 rounded-xl w-52 shadow-xl font-medium leading-relaxed normal-case
      -left-10 md:-left-24 bottom-6 mb-1 after:content-[''] after:absolute after:top-full after:left-1/2 
      after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
      {content}
    </span>
  </div>
)

const Field = ({ label, required, hint, tooltip, children, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <div className="flex items-baseline justify-between">
      <label className="text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center">
        <span>{label}</span>
        {required && <span className="text-accent ml-0.5">*</span>}
        {tooltip && <Tooltip content={tooltip} />}
      </label>
      {hint && <span className="text-[10px] text-secondary/30">{hint}</span>}
    </div>
    {children}
  </div>
)

const Input = ({ icon: Icon, prefix, suffix, ...props }) => (
  <div className="relative flex items-center">
    {Icon && <Icon size={14} className="absolute left-3 text-secondary/30 z-10" />}
    {prefix && (
      <span className="absolute left-3 text-xs font-bold text-secondary/40 z-10">
        {prefix}
      </span>
    )}
    <input
      {...props}
      className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-sm text-secondary
        placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50
        transition-all
        ${Icon ? 'pl-9' : prefix ? 'pl-10' : 'px-3'}
        ${suffix ? 'pr-10' : 'pr-3'}`}
    />
    {suffix && (
      <span className="absolute right-3 text-xs font-bold text-secondary/40">{suffix}</span>
    )}
  </div>
)

const Textarea = ({ ...props }) => (
  <textarea
    rows={2}
    {...props}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-secondary
      placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50
      transition-all resize-none"
  />
)

export default function StepKeuangan({ formData, onChange }) {
  // Live summary calculation
  const items = formData.items || []
  const grandTotalUSD = items.reduce((sum, it) => sum + (parseFloat(it.total_usd) || 0), 0)
  const kurs = parseFloat(formData.usd_idr_rate) || 0
  const loading = parseFloat(formData.loading_cost) || 0
  const trucking = parseFloat(formData.trucking_cost) || 0
  const thc = parseFloat(formData.thc_cost) || 0
  const insPct = parseFloat(formData.insurance_pct) || 0
  const depPct = parseFloat(formData.deposit_pct) || 0

  const fobUSD = grandTotalUSD + (kurs > 0 ? (loading + trucking + thc) / kurs : 0)
  const insurance = grandTotalUSD * insPct / 100
  const cifUSD = fobUSD + insurance
  const deposit = grandTotalUSD * depPct / 100

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Format helper for IDR currency (thousands separator using dot)
  const formatIDR = (val) => {
    if (val === undefined || val === null || val === '') return ''
    const numStr = val.toString().replace(/\D/g, '')
    if (!numStr) return ''
    return parseInt(numStr, 10).toLocaleString('id-ID')
  }

  // Parse helper to extract raw integer
  const parseRawInt = (formattedVal) => {
    const raw = formattedVal.replace(/\D/g, '')
    return raw ? parseInt(raw, 10) : ''
  }

  return (
    <div className="space-y-6">
      {/* Kurs */}
      <div>
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Kurs & Referensi
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kurs USD → IDR" required hint="Update sesuai kurs hari ini" tooltip="Nilai tukar mata uang 1 Dollar Amerika Serikat ke dalam Rupiah saat ini.">
            <Input
              icon={DollarSign}
              prefix="Rp"
              type="text"
              placeholder="16.000"
              value={formatIDR(formData.usd_idr_rate)}
              onChange={e => onChange('usd_idr_rate', parseRawInt(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* Biaya Logistik */}
      <div>
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Biaya Logistik (IDR)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Biaya Loading / Stuffing" tooltip="Biaya jasa memasukkan (pemuatan) barang Anda ke dalam kontainer / truk logistik.">
            <Input
              prefix="Rp"
              type="text"
              placeholder="1.000.000"
              value={formatIDR(formData.loading_cost)}
              onChange={e => onChange('loading_cost', parseRawInt(e.target.value))}
            />
          </Field>
          <Field label="Biaya Trucking" tooltip="Biaya pengiriman darat menggunakan truk dari gudang Anda menuju ke pelabuhan.">
            <Input
              prefix="Rp"
              type="text"
              placeholder="5.000.000"
              value={formatIDR(formData.trucking_cost)}
              onChange={e => onChange('trucking_cost', parseRawInt(e.target.value))}
            />
          </Field>
          <Field label="THC (Terminal Handling Charge)" tooltip="Biaya yang ditagih oleh pelabuhan untuk penanganan kontainer Anda di terminal peti kemas.">
            <Input
              prefix="Rp"
              type="text"
              placeholder="5.000.000"
              value={formatIDR(formData.thc_cost)}
              onChange={e => onChange('thc_cost', parseRawInt(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* Persentase */}
      <div>
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Asuransi & Deposit
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Asuransi" hint="dari nilai barang" tooltip="Persentase biaya asuransi untuk melindungi barang dari kerusakan selama perjalanan di laut.">
            <Input
              icon={Shield}
              type="number"
              step="0.1"
              placeholder="0.5"
              value={formData.insurance_pct || ''}
              suffix="%"
              onChange={e => onChange('insurance_pct', e.target.value)}
            />
          </Field>
          <Field label="Deposit / DP" hint="dari grand total" tooltip="Uang muka yang harus dibayar pembeli terlebih dahulu sebelum barang diproduksi/dikirim (biasanya 30%).">
            <Input
              icon={Percent}
              type="number"
              step="1"
              placeholder="30"
              value={formData.deposit_pct || ''}
              suffix="%"
              onChange={e => onChange('deposit_pct', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Bank Account */}
      <Field label="Rekening Bank" tooltip="Detail informasi bank Anda untuk menerima transfer pembayaran dari luar negeri. Tulis lengkap dengan kode SWIFT jika ada.">
        <Textarea
          placeholder="Bank Mandiri, A/C: 1234567890 a.n. CV Nusantara Jaya"
          value={formData.bank_account || ''}
          onChange={e => onChange('bank_account', e.target.value)}
        />
      </Field>


      {/* Live Summary */}
      {grandTotalUSD > 0 && kurs > 0 && (
        <div className="bg-accent/5 border border-accent/15 rounded-2xl p-5">
          <p className="text-xs font-black text-accent/70 uppercase tracking-widest mb-3">
            Kalkulasi Otomatis
          </p>
          <div className="space-y-2">
            {[
              ['Nilai Barang (EXW)', `USD ${fmt(grandTotalUSD)}`],
              [`Logistik (Loading + Trucking + THC)`, kurs > 0 ? `USD ${fmt((loading + trucking + thc) / kurs)}` : '—'],
              ['Total FOB', `USD ${fmt(fobUSD)}`],
              [`Asuransi (${insPct}%)`, `USD ${fmt(insurance)}`],
              ['Total CIF', `USD ${fmt(cifUSD)}`],
              [`Deposit ${depPct}%`, `USD ${fmt(deposit)}`],
            ].map(([label, val], i) => (
              <div key={i} className={`flex justify-between text-sm py-1 ${i === 2 || i === 4 ? 'border-t border-accent/15 pt-2 font-black text-accent' : 'text-secondary/70'}`}>
                <span>{label}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
