import { useState } from "react";
import { FileText, Package, Download, CheckCircle2, X } from "lucide-react";

const MOCK_INVOICE = {
  type: 'Commercial Invoice',
  number: 'INV-2025-NE-00147',
  date: '20 Maret 2025',
  exporter: 'CV Nusantara Jaya',
  buyer: 'Tokyo Trading Co., Ltd.',
  items: [
    { name: 'Kopi Arabika Gayo (Grade 1)', qty: '2,000 kg', unit_price: '$5.20/kg', total: '$10,400.00' },
    { name: 'Kopi Robusta Lampung (Grade 2)', qty: '3,000 kg', unit_price: '$3.80/kg', total: '$11,400.00' },
  ],
  subtotal: '$21,800.00',
  freight: '$1,950.00',
  insurance: '$218.00',
  grand_total: '$23,968.00',
  incoterm: 'CIF Yokohama',
}

const MOCK_PACKING = {
  type: 'Packing List',
  number: 'PL-2025-NE-00147',
  date: '20 Maret 2025',
  vessel: 'MV GLORY STAR',
  port_loading: 'Tanjung Priok, Jakarta',
  port_destination: 'Yokohama, Jepang',
  container: 'MSCU-4521673 (20ft)',
  items: [
    { desc: 'Kopi Arabika Gayo', pcs: '40 karung @ 50kg', net_wt: '2,000 kg', gross_wt: '2,080 kg', dims: '60x40x30 cm' },
    { desc: 'Kopi Robusta Lampung', pcs: '60 karung @ 50kg', net_wt: '3,000 kg', gross_wt: '3,120 kg', dims: '60x40x30 cm' },
  ],
  total_net: '5,000 kg',
  total_gross: '5,200 kg',
  total_pcs: '100 karung',
}

export default function DocumentGenerator() {
  const [preview, setPreview] = useState(null) // 'invoice' | 'packing' | null
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(null) // 'invoice' | 'packing' | null

  const handleGenerate = (type) => {
    setPreview(type)
    setGenerated(null)
  }

  const handleDownload = (type) => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(type)
      // Simulate download
      setTimeout(() => setGenerated(null), 3000)
    }, 1500)
  }

  const doc = preview === 'invoice' ? MOCK_INVOICE : MOCK_PACKING

  return (
    <div className="flex flex-col gap-4" role="region" aria-label="Pembuat dokumen ekspor otomatis">
      <p className="text-secondary/50 text-sm font-medium mb-2 leading-relaxed">
        Pilih dokumen yang ingin dibuat secara otomatis.
      </p>

      <button
        onClick={() => handleGenerate("invoice")}
        className={`danantara-card flex items-center justify-between p-5 transition-all w-full group rounded-2xl ${preview === 'invoice' ? 'bg-accent-light border-accent/20' : 'bg-slate-soft hover:bg-white'}`}
        aria-label="Buat Commercial Invoice"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center text-accent" aria-hidden="true">
            <FileText size={20} />
          </div>
          <span className="font-black text-secondary">Commercial Invoice</span>
        </div>
        <span className="text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
      </button>

      <button
        onClick={() => handleGenerate("packing-list")}
        className={`danantara-card flex items-center justify-between p-5 transition-all w-full group rounded-2xl ${preview === 'packing-list' ? 'bg-accent-light border-accent/20' : 'bg-slate-soft hover:bg-white'}`}
        aria-label="Buat Packing List"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-secondary" aria-hidden="true">
            <Package size={20} />
          </div>
          <span className="font-black text-secondary">Packing List</span>
        </div>
        <span className="text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
      </button>

      {/* Document Preview */}
      {preview && (
        <div className="mt-2 animate-fadeInUp" aria-live="polite">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Doc Header */}
            <div className="bg-secondary p-4 flex justify-between items-center">
              <div>
                <h4 className="text-white font-black text-sm">{doc.type}</h4>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Preview Dokumen</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-white/50 hover:text-white" aria-label="Tutup preview">
                <X size={18} />
              </button>
            </div>

            {/* Doc Content */}
            <div className="p-5 text-xs space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-secondary/50 font-bold">No. Dokumen</span>
                <span className="font-black text-secondary">{doc.number}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-secondary/50 font-bold">Tanggal</span>
                <span className="font-bold text-secondary">{doc.date}</span>
              </div>

              {preview === 'invoice' && (
                <>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-secondary/50 font-bold">Eksportir</span>
                    <span className="font-bold text-secondary">{doc.exporter}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-secondary/50 font-bold">Pembeli</span>
                    <span className="font-bold text-secondary">{doc.buyer}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-2">Detail Barang</p>
                    {doc.items.map((item, i) => (
                      <div key={i} className="bg-slate-soft p-3 rounded-xl mb-2">
                        <div className="font-bold text-secondary mb-1">{item.name}</div>
                        <div className="flex justify-between text-secondary/50">
                          <span>{item.qty} × {item.unit_price}</span>
                          <span className="font-black text-accent">{item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-accent-light p-3 rounded-xl">
                    <div className="flex justify-between mb-1"><span className="text-secondary/50">Subtotal</span><span className="font-bold">{doc.subtotal}</span></div>
                    <div className="flex justify-between mb-1"><span className="text-secondary/50">Freight ({doc.incoterm})</span><span className="font-bold">{doc.freight}</span></div>
                    <div className="flex justify-between mb-1"><span className="text-secondary/50">Asuransi</span><span className="font-bold">{doc.insurance}</span></div>
                    <div className="flex justify-between pt-2 border-t border-accent/20 mt-2">
                      <span className="font-black text-secondary">TOTAL</span>
                      <span className="font-black text-accent text-base">{doc.grand_total}</span>
                    </div>
                  </div>
                </>
              )}

              {preview === 'packing-list' && (
                <>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-secondary/50 font-bold">Kapal</span>
                    <span className="font-bold text-secondary">{doc.vessel}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-secondary/50 font-bold">Kontainer</span>
                    <span className="font-bold text-secondary">{doc.container}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-secondary/50 font-bold">Pelabuhan Muat</span>
                    <span className="font-bold text-secondary">{doc.port_loading}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-secondary/50 font-bold">Tujuan</span>
                    <span className="font-bold text-secondary">{doc.port_destination}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-2">Detail Isi Kontainer</p>
                    {doc.items.map((item, i) => (
                      <div key={i} className="bg-slate-soft p-3 rounded-xl mb-2">
                        <div className="font-bold text-secondary mb-1">{item.desc}</div>
                        <div className="grid grid-cols-2 gap-1 text-secondary/50 text-[10px]">
                          <span>Jumlah: {item.pcs}</span>
                          <span>Dimensi: {item.dims}</span>
                          <span>Netto: {item.net_wt}</span>
                          <span>Bruto: {item.gross_wt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-accent-light p-3 rounded-xl">
                    <div className="flex justify-between mb-1"><span className="text-secondary/50">Total Koli</span><span className="font-bold">{doc.total_pcs}</span></div>
                    <div className="flex justify-between mb-1"><span className="text-secondary/50">Berat Netto</span><span className="font-bold">{doc.total_net}</span></div>
                    <div className="flex justify-between"><span className="text-secondary/50">Berat Bruto</span><span className="font-black text-accent">{doc.total_gross}</span></div>
                  </div>
                </>
              )}
            </div>

            {/* Download Button */}
            <div className="p-4 bg-slate-soft border-t border-slate-100">
              {generated ? (
                <div className="flex items-center justify-center gap-2 py-3 text-green-600 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  Dokumen berhasil diunduh!
                </div>
              ) : (
                <button
                  onClick={() => handleDownload(preview)}
                  disabled={generating}
                  className="btn-primary w-full justify-center py-3 text-sm"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Membuat PDF...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download size={16} />
                      Unduh {doc.type} (PDF)
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
