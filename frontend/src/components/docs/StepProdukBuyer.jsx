import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, Globe, DollarSign, CreditCard, HelpCircle, ExternalLink, Calculator, Copy, Check } from 'lucide-react'

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

const Field = ({ label, required, children, tooltip, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center">
      <span>{label}</span>
      {required && <span className="text-accent ml-0.5">*</span>}
      {tooltip && <Tooltip content={tooltip} />}
    </label>
    {children}
  </div>
)

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/30" />}
    <input
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

const DEFAULT_ITEM = { name: '', hs_code: '', qty_kg: '', qty_bags: '', price_usd: '', total_usd: '' }

export default function StepProdukBuyer({ formData, onChange }) {
  const items = formData.items?.length ? formData.items : [{ ...DEFAULT_ITEM }]

  // Converter tool states
  const [idrAmount, setIdrAmount] = useState('')
  const [usdResult, setUsdResult] = useState(0)
  const [realtimeKurs, setRealtimeKurs] = useState(16000)
  const [kursLoading, setKursLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch real-time exchange rate on mount
  useEffect(() => {
    async function fetchRealtimeRate() {
      setKursLoading(true)
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const data = await res.json()
        if (data && data.rates && data.rates.IDR) {
          const rate = data.rates.IDR
          setRealtimeKurs(rate)
          // Automatically update parent form rate if not manually set yet
          if (!formData.usd_idr_rate) {
            onChange('usd_idr_rate', rate)
          }
        }
      } catch (err) {
        console.error('Gagal memuat kurs real-time:', err)
        // Fallback to saved state rate or static fallback
        setRealtimeKurs(parseFloat(formData.usd_idr_rate) || 16000)
      } finally {
        setKursLoading(false)
      }
    }
    fetchRealtimeRate()
  }, [])

  // Use either the manually inputted rate or the loaded real-time rate
  const kursReferal = parseFloat(formData.usd_idr_rate) || realtimeKurs

  // Calculate currency conversion
  useEffect(() => {
    const idr = parseFloat(idrAmount) || 0
    if (kursReferal > 0) {
      setUsdResult(idr / kursReferal)
    } else {
      setUsdResult(0)
    }
  }, [idrAmount, kursReferal])

  const updateItem = (idx, field, val) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item
      
      // 1. Create a draft of the item with the raw value updated
      const rawItem = { ...item, [field]: val }
      
      // 2. Parse numbers cleanly
      const qty = parseFloat(rawItem.qty_kg) || 0
      const price = parseFloat(rawItem.price_usd) || 0
      const total = qty * price
      
      // 3. Keep properties as typed inputs for typing comfort, but totals as safe floats
      return {
        ...rawItem,
        qty_kg: field === 'qty_kg' ? val : rawItem.qty_kg,
        price_usd: field === 'price_usd' ? val : rawItem.price_usd,
        total_usd: total
      }
    })
    onChange('items', updated)
  }

  const addItem = () => onChange('items', [...items, { ...DEFAULT_ITEM }])

  const removeItem = (idx) => {
    if (items.length <= 1) return
    onChange('items', items.filter((_, i) => i !== idx))
  }

  // Safe float reduction to prevent string concatenation
  const grandTotal = items.reduce((sum, it) => {
    const itemTotal = parseFloat(it.total_usd) || 0
    return sum + itemTotal
  }, 0)

  return (
    <div className="space-y-6">
      {/* Produk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nama Produk" required tooltip="Nama umum produk Anda, misalnya Kopi Arabika Gayo.">
          <Input
            icon={Package}
            placeholder="Kopi Arabika Gayo"
            value={formData.product_name || ''}
            onChange={e => onChange('product_name', e.target.value)}
          />
        </Field>
        <Field 
          label="HS Code" 
          tooltip="Kode klasifikasi barang internasional (8 digit) untuk tarif ekspor. Contoh kopi mentah: 0901.11.10."
        >
          <div className="flex flex-col gap-1.5 w-full">
            <Input
              placeholder="0901.11.10"
              value={formData.hs_code || ''}
              onChange={e => onChange('hs_code', e.target.value)}
            />
            <a 
              href="https://insw.go.id/intr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-accent font-bold hover:underline flex items-center gap-1 mt-0.5"
            >
              <ExternalLink size={10} /> Cari Referensi HS Code Resmi
            </a>
          </div>
        </Field>
        <Field label="Spesifikasi Produk" className="md:col-span-2" tooltip="Rincian mutu produk. Misalnya tingkat kadar air, ukuran, warna, atau standar sertifikasi.">
          <Textarea
            placeholder="Grade 1, kadar air maks 12%, ukuran biji ≥ 6mm"
            value={formData.product_spec || ''}
            onChange={e => onChange('product_spec', e.target.value)}
          />
        </Field>
      </div>

      {/* Integrated IDR to USD Converter */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center text-accent">
            <Calculator size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-secondary uppercase tracking-widest">Kalkulator Konversi Kurs</h4>
            <p className="text-[10px] text-secondary/50 font-medium">Bantu hitung harga Rupiah (IDR) ke Dollar AS (USD) menggunakan kurs referensi Rp {kursReferal.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-secondary">
            <span className="text-secondary/40 mr-1.5">IDR</span>
            <input
              type="text"
              placeholder="Masukkan Rp..."
              value={idrAmount ? parseInt(idrAmount.toString().replace(/\D/g, ''), 10).toLocaleString('id-ID') : ''}
              onChange={e => {
                const rawVal = e.target.value.replace(/\D/g, '')
                setIdrAmount(rawVal ? parseInt(rawVal, 10) : '')
              }}
              className="bg-transparent outline-none w-28 text-secondary"
            />
          </div>
          <span className="text-secondary/40 font-black text-xs">→</span>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-accent">
            <span className="mr-1.5">USD</span>
            <span>{usdResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>
          {usdResult > 0 && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(usdResult.toFixed(2))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-black rounded-lg transition-all
                ${copied 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-accent text-white hover:bg-accent/90'}`}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Tersalin!' : 'Salin Hasil'}
            </button>
          )}
        </div>
      </div>


      {/* Items Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black text-secondary/60 uppercase tracking-widest">
            Rincian Barang <span className="text-accent">*</span>
          </p>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-light text-accent text-xs font-bold rounded-xl
              hover:bg-accent hover:text-white transition-all"
          >
            <Plus size={12} /> Tambah Baris
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="grid bg-secondary text-white text-[10px] font-black uppercase tracking-widest px-3 py-2.5 items-center"
               style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px' }}>
            <span className="flex items-center">Nama / Deskripsi <Tooltip content="Nama spesifik barang yang diekspor." /></span>
            <span className="text-center flex items-center justify-center">Qty (Kg) <Tooltip content="Berat bersih barang dalam satuan Kilogram." /></span>
            <span className="text-center flex items-center justify-center">Qty (Bags) <Tooltip content="Jumlah karung/kemasan barang." /></span>
            <span className="text-center flex items-center justify-center">HS Code <Tooltip content="Kode klasifikasi spesifik untuk barang ini." /></span>
            <span className="text-right flex items-center justify-end">Harga/Kg (USD) <Tooltip content="Harga satuan per kilogram dalam Dollar AS." /></span>
            <span></span>
          </div>

          {items.map((item, idx) => {
            // Formatting helper for currency in the row input
            const formatRowUSD = (val) => {
              if (val === undefined || val === null || val === '') return ''
              const clean = val.toString().replace(/[^0-9.]/g, '')
              const parts = clean.split('.')
              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              return parts.join('.')
            }

            return (
              <div
                key={idx}
                className="grid items-center gap-2 px-3 py-2.5 border-t border-slate-100 bg-white hover:bg-slate-50/50"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px' }}
              >
                <input
                  className="bg-transparent text-sm text-secondary placeholder:text-secondary/30 outline-none"
                  placeholder="Nama barang"
                  value={item.name || ''}
                  onChange={e => updateItem(idx, 'name', e.target.value)}
                />
                <input
                  className="bg-transparent text-sm text-secondary text-center placeholder:text-secondary/30 outline-none"
                  placeholder="0"
                  type="text"
                  value={item.qty_kg ? parseFloat(item.qty_kg).toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const rawVal = e.target.value.replace(/\D/g, '')
                    updateItem(idx, 'qty_kg', rawVal ? parseInt(rawVal, 10) : '')
                  }}
                />
                <input
                  className="bg-transparent text-sm text-secondary text-center placeholder:text-secondary/30 outline-none"
                  placeholder="0"
                  type="text"
                  value={item.qty_bags ? parseFloat(item.qty_bags).toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const rawVal = e.target.value.replace(/\D/g, '')
                    updateItem(idx, 'qty_bags', rawVal ? parseInt(rawVal, 10) : '')
                  }}
                />
                <input
                  className="bg-transparent text-sm text-secondary text-center placeholder:text-secondary/30 outline-none"
                  placeholder="0901.10"
                  value={item.hs_code || ''}
                  onChange={e => updateItem(idx, 'hs_code', e.target.value)}
                />
                <input
                  className="bg-transparent text-sm text-secondary text-right placeholder:text-secondary/30 outline-none"
                  placeholder="0.00"
                  type="text"
                  value={formatRowUSD(item.price_usd)}
                  onChange={e => {
                    // Allow digits and single decimal dot
                    const cleanVal = e.target.value.replace(/[^0-9.]/g, '')
                    // Prevent multiple decimal dots
                    const dots = cleanVal.split('.')
                    const finalVal = dots.length > 2 ? `${dots[0]}.${dots[1]}` : cleanVal
                    updateItem(idx, 'price_usd', finalVal)
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-red-300 hover:text-red-500
                    hover:bg-red-50 transition-all"
                  disabled={items.length <= 1}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}

          {/* Total */}
          <div className="flex justify-end items-center gap-3 px-4 py-3 bg-accent/5 border-t border-slate-200">
            <span className="text-xs font-black text-secondary/50 uppercase tracking-widest">Grand Total</span>
            <span className="text-base font-black text-accent">
              USD {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Buyer */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-3">
          Data Pembeli / Buyer
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Perusahaan Buyer" required tooltip="Nama resmi perusahaan pembeli di luar negeri.">
            <Input
              icon={Globe}
              placeholder="Tokyo Trading Co., Ltd."
              value={formData.buyer_name || ''}
              onChange={e => onChange('buyer_name', e.target.value)}
            />
          </Field>
          <Field label="Negara Buyer" required tooltip="Negara tujuan pengiriman produk / domisili pembeli.">
            <Input
              placeholder="Jepang"
              value={formData.buyer_country || ''}
              onChange={e => onChange('buyer_country', e.target.value)}
            />
          </Field>
          <Field label="Alamat Buyer" className="md:col-span-2" tooltip="Alamat lengkap kantor atau gudang penerima di luar negeri.">
            <Textarea
              placeholder="1-2-3 Shibuya, Tokyo 150-0002, Japan"
              value={formData.buyer_address || ''}
              onChange={e => onChange('buyer_address', e.target.value)}
            />
          </Field>

          <Field label="Incoterm" required tooltip="Syarat penyerahan barang yang disepakati. FOB = Penjual menanggung biaya sampai pelabuhan muat. CIF = Penjual menanggung sampai pelabuhan tujuan (termasuk asuransi & uang kapal).">
            <Select
              value={formData.incoterm || ''}
              onChange={e => onChange('incoterm', e.target.value)}
            >
              <option value="">-- Pilih Incoterm --</option>
              <option value="FOB">FOB (Free On Board)</option>
              <option value="CIF">CIF (Cost, Insurance, Freight)</option>
              <option value="CNF">CNF (Cost and Freight)</option>
              <option value="EXW">EXW (Ex Works)</option>
              <option value="DDP">DDP (Delivered Duty Paid)</option>
              <option value="CFR">CFR (Cost and Freight)</option>
            </Select>
          </Field>

          <Field label="Syarat Pembayaran" required tooltip="Metode pembayaran yang disepakati. Contoh: T/T 30% DP + 70% setelah B/L terbit (transfer bank dengan uang muka 30% sisanya setelah barang dikirim).">
            <Input
              icon={CreditCard}
              placeholder="T/T 30% DP + 70% setelah B/L"
              value={formData.payment_method || ''}
              onChange={e => onChange('payment_method', e.target.value)}
            />
          </Field>

          <Field label="Tanggal Transaksi" tooltip="Tanggal kesepakatan penjualan dibuat atau tanggal penandatanganan dokumen.">
            <Input
              type="date"
              value={formData.transaction_date || ''}
              onChange={e => onChange('transaction_date', e.target.value)}
            />
          </Field>

          <Field label="No. Invoice Referensi" tooltip="Nomor invoice transaksi Anda untuk mempermudah pelacakan.">
            <Input
              icon={DollarSign}
              placeholder="INV-2025-NE-001"
              value={formData.invoice_ref_no || ''}
              onChange={e => onChange('invoice_ref_no', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
