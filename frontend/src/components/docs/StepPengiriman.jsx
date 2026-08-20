import { Ship, Anchor, Box, Hash, HelpCircle } from 'lucide-react'

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

const Field = ({ label, required, tooltip, children, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center">
      <span>{label}</span>
      {required && <span className="text-accent ml-0.5">*</span>}
      {tooltip && <Tooltip content={tooltip} />}
    </label>
    {children}
  </div>
)

const Input = ({ icon: Icon, type = 'text', ...props }) => (
  <div className="relative">
    {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/30" />}
    <input
      type={type}
      {...props}
      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-secondary
        placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50
        transition-all ${Icon ? 'pl-9' : ''}`}
    />
  </div>
)

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-secondary
      focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all"
  >
    {children}
  </select>
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

export default function StepPengiriman({ formData, onChange }) {
  return (
    <div className="space-y-6">
      {/* Pelabuhan */}
      <div>
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Pelabuhan & Rute
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Pelabuhan Muat (Port of Loading)" required tooltip="Nama pelabuhan asal tempat barang dimuat ke atas kapal (misal: Tanjung Priok, Tanjung Perak).">
            <Input
              icon={Anchor}
              placeholder="Tanjung Priok, Jakarta"
              value={formData.port_loading || ''}
              onChange={e => onChange('port_loading', e.target.value)}
            />
          </Field>
          <Field label="Pelabuhan Tujuan (Port of Destination)" required tooltip="Nama pelabuhan negara tujuan tempat kapal menurunkan barang (misal: Yokohama, Shanghai).">
            <Input
              icon={Anchor}
              placeholder="Yokohama, Jepang"
              value={formData.port_destination || ''}
              onChange={e => onChange('port_destination', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Kapal & Jadwal */}
      <div>
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Kapal & Jadwal
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Kapal / Vessel" tooltip="Nama kapal kargo laut yang mengangkut kontainer barang ekspor Anda. Contoh: MV GLORY STAR.">
            <Input
              icon={Ship}
              placeholder="MV GLORY STAR"
              value={formData.vessel_name || ''}
              onChange={e => onChange('vessel_name', e.target.value)}
            />
          </Field>
          <Field label="Nama Forwarder / Shipping Line" required tooltip="Nama perusahaan agen ekspedisi logistik internasional yang mengurus pengiriman peti kemas Anda.">
            <Input
              icon={Ship}
              placeholder="EVERGREEN / Maersk"
              value={formData.forwarder_name || ''}
              onChange={e => onChange('forwarder_name', e.target.value)}
            />
          </Field>
          <Field label="ETD (Estimated Time of Departure)" tooltip="Tanggal perkiraan kapal berangkat dari pelabuhan asal.">
            <Input
              type="date"
              value={formData.etd_date || ''}
              onChange={e => onChange('etd_date', e.target.value)}
            />
          </Field>
          <Field label="ETA (Estimated Time of Arrival)" tooltip="Tanggal perkiraan kapal tiba di pelabuhan tujuan.">
            <Input
              type="date"
              value={formData.eta_date || ''}
              onChange={e => onChange('eta_date', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Container */}
      <div>
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Container & Pengepakan
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipe Container" required tooltip="Ukuran peti kemas yang disewa. Standar ekspor biasanya memakai ukuran 20 kaki atau 40 kaki.">
            <Select
              value={formData.container_type || ''}
              onChange={e => onChange('container_type', e.target.value)}
            >
              <option value="">-- Pilih Tipe --</option>
              <option value="20 Feet">20 Feet</option>
              <option value="40 Feet">40 Feet</option>
              <option value="40 HC">40 HC (High Cube)</option>
            </Select>
          </Field>
          <Field label="Nomor Container" tooltip="Nomor seri pengenal unik pada peti kemas Anda. Contoh: MSCU-4521673.">
            <Input
              icon={Box}
              placeholder="MSCU-4521673"
              value={formData.container_no || ''}
              onChange={e => onChange('container_no', e.target.value)}
            />
          </Field>
          <Field label="Nomor Seal" tooltip="Nomor segel pengaman kontainer yang dipasang setelah barang selesai dimuat (stuffing).">
            <Input
              icon={Hash}
              placeholder="SL-001234"
              value={formData.seal_no || ''}
              onChange={e => onChange('seal_no', e.target.value)}
            />
          </Field>
          <Field label="Alamat Penjemputan (Gudang)" tooltip="Alamat gudang tempat barang Anda dimuat (loading) ke dalam kontainer.">
            <Textarea
              placeholder="Jl. Industri No. 5, Kawasan JIEP, Jakarta Timur"
              value={formData.pickup_address || ''}
              onChange={e => onChange('pickup_address', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Summary card */}
      {(formData.port_loading || formData.port_destination) && (
        <div className="flex items-center gap-4 bg-accent/5 border border-accent/10 rounded-2xl p-4">
          <div className="flex items-center justify-center w-10 h-10 bg-accent-light rounded-xl">
            <Ship size={18} className="text-accent" />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-black text-secondary">{formData.port_loading || '—'}</span>
            <span className="text-accent font-black">→</span>
            <span className="font-black text-secondary">{formData.port_destination || '—'}</span>
            {formData.vessel_name && (
              <span className="text-secondary/40">· {formData.vessel_name}</span>
            )}
            {formData.container_type && (
              <span className="px-2 py-0.5 bg-accent-light text-accent text-[10px] font-black rounded-lg">
                {formData.container_type}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
