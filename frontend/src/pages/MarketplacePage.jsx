import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart,
  MapPin, ShieldCheck, Leaf, Globe, 
  X, ArrowRight, Package, Truck,
  Plus, Loader, AlertCircle, RefreshCw, Phone, MessageCircle,
  ImagePlus, Trash2, Upload
} from 'lucide-react';
import gsap from 'gsap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ["Semua", "Makanan & Minuman", "Kerajinan", "Tekstil & Pakaian", "Minyak Atsiri", "Furniture"];

const EMPTY_FORM = {
  name: '', category: 'Makanan & Minuman', description: '',
  price_usd: '', price_idr: '', min_order_qty: '',
  hs_code: '', location: '', lead_time: '',
  packaging: '', seller_name: '', badges: '', whatsapp_number: '',
};

// Buat URL WhatsApp dengan draft pesan (Bahasa Inggris untuk buyer internasional)
const buildWhatsAppUrl = (product) => {
  const number = product.whatsapp_number?.replace(/[^0-9]/g, '');
  if (!number) return null;
  const msg = encodeURIComponent(
    `Hello, I found your product *${product.name}* on NusantaraExport.AI and I am interested in placing an order.\n\n` +
    `🛒 Product  : ${product.name}\n` +
    `💰 Price    : USD ${product.price_usd}${product.price_idr ? ` / IDR ${Number(product.price_idr).toLocaleString('id-ID')}` : ''}\n` +
    `📍 Origin   : ${product.location || '-'}\n` +
    `📋 MOQ      : ${product.min_order_qty || '-'}\n\n` +
    `Could you please provide more details on availability, shipping terms, and how to proceed with an order? Thank you!`
  );
  return `https://wa.me/${number}?text=${msg}`;
};

export default function MarketplacePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formImages, setFormImages] = useState([]); // [{preview: dataUrl, file: File}]
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const overlayRef = useRef(null);
  const modalContentRef = useRef(null);

  // Fetch produk dari API
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeCategory !== 'Semua') params.category = activeCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get('/api/marketplace/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.error('Marketplace fetch error:', err);
      setError('Gagal memuat produk marketplace. Periksa koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  // Format currency
  const formatIDR = (price) => price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
    : null;
  const formatUSD = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  // Modal Detail
  const openDetail = (product) => {
    setSelectedProduct(product);
    setTimeout(() => {
      if (overlayRef.current && modalContentRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalContentRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
      }
    }, 10);
  };

  const closeDetail = () => {
    if (overlayRef.current && modalContentRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
      gsap.to(modalContentRef.current, { y: 30, opacity: 0, duration: 0.3, onComplete: () => setSelectedProduct(null) });
    } else {
      setSelectedProduct(null);
    }
  };

  const addToInquiry = () => {
    setCartCount(prev => prev + 1);
    closeDetail();
  };

  // Tambah Produk Baru
  const handleImageFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const remaining = 3 - formImages.length;
    validFiles.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormImages(prev => [...prev, { preview: e.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => setFormImages(prev => prev.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault();
    handleImageFiles(e.dataTransfer.files);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    if (!form.name.trim() || !form.category || !form.price_usd) {
      setFormError('Nama produk, kategori, dan harga USD wajib diisi.');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        price_usd: parseFloat(form.price_usd),
        price_idr: form.price_idr ? parseFloat(form.price_idr) : null,
        min_order_qty: form.min_order_qty.trim() || null,
        hs_code: form.hs_code.trim() || null,
        location: form.location.trim() || null,
        lead_time: form.lead_time.trim() || null,
        packaging: form.packaging.trim() || null,
        seller_name: form.seller_name.trim() || user?.full_name || '',
        badges: form.badges ? form.badges.split(',').map(b => b.trim()).filter(Boolean) : [],
        images: formImages.map(img => img.preview),
        whatsapp_number: form.whatsapp_number.replace(/[^0-9]/g, '') || null,
      };

      const res = await api.post('/api/marketplace/products', payload);
      setProducts(prev => [res.data, ...prev]);
      setFormSuccess('✅ Produk berhasil ditambahkan ke marketplace!');
      setForm(EMPTY_FORM);
      setFormImages([]);
      setTimeout(() => { setShowAddForm(false); setFormSuccess(''); }, 2000);
    } catch (err) {
      console.error('Add product error:', err);
      setFormError(err.response?.data?.detail || 'Gagal menambahkan produk.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-soft pt-28 pb-20">
      {/* Header & Hero Section */}
      <div className="bg-secondary text-white py-12 px-6 mb-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
              Etalase <span className="text-accent">Global</span> UMKM
            </h1>
            <p className="text-white/80 text-lg">
              Temukan produk-produk premium dari UMKM Indonesia yang telah siap ekspor. 
              Kualitas terbaik, terkurasi, dan bersertifikasi.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => isAuthenticated ? setShowAddForm(true) : navigate('/login')}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 transition-colors px-6 py-3 rounded-xl font-bold"
            >
              <Plus size={18} /> Tambah Produk
            </button>
            <div className="relative">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-6 py-3 rounded-xl font-bold">
                <ShoppingCart size={20} />
                Inquiry List
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-secondary">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" size={20} />
            <input 
              type="text" 
              placeholder="Cari produk atau nama UMKM..." 
              className="w-full pl-12 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-secondary focus:border-accent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-black">
              Cari
            </button>
          </form>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeCategory === cat 
                  ? 'bg-secondary text-white shadow-md' 
                  : 'bg-slate-50 text-secondary/70 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-bold">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchProducts} className="ml-auto flex items-center gap-1.5 text-sm hover:underline">
              <RefreshCw size={14} /> Coba lagi
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader className="animate-spin text-accent mb-4" size={44} />
            <span className="text-secondary/50 font-bold">Memuat produk marketplace...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Search size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-secondary">Produk tidak ditemukan</h3>
            <p className="text-secondary/50 mt-2">Coba gunakan kata kunci atau kategori lain.</p>
            <button
                onClick={() => isAuthenticated ? setShowAddForm(true) : navigate('/login')}
                className="mt-6 inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors"
              >
                <Plus size={16} /> Jadilah yang pertama menambah produk
              </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="danantara-card group flex flex-col bg-white rounded-3xl overflow-hidden cursor-pointer"
                onClick={() => openDetail(product)}
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Package size={48} className="text-slate-300" />
                    </div>
                  )}
                  {product.badges && product.badges.length > 0 && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.badges.slice(0, 2).map((badge, idx) => (
                        <span key={idx} className="bg-white/90 backdrop-blur-sm text-secondary px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5">
                          {idx === 0 ? <ShieldCheck size={14} className="text-accent" /> : <Leaf size={14} className="text-green-600" />}
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                  {product.location && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white font-bold text-sm flex items-center gap-1.5">
                        <MapPin size={14} className="text-accent" /> {product.location}
                      </p>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-black text-accent uppercase tracking-wider">{product.category}</p>
                  </div>
                  
                  <h3 className="text-xl font-black text-secondary leading-tight mb-1 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm font-medium text-secondary/60 mb-4">{product.seller_name}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-black text-secondary">
                        {formatUSD(product.price_usd)}
                      </span>
                      {product.price_idr && (
                        <span className="text-sm font-bold text-secondary/50">
                          {formatIDR(product.price_idr)} <span className="font-normal text-xs">/ unit</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      {product.min_order_qty && (
                        <span className="text-xs font-bold text-secondary/70 bg-slate-100 px-3 py-1.5 rounded-lg">
                          MOQ: {product.min_order_qty}
                        </span>
                      )}
                      <button className="ml-auto w-10 h-10 bg-accent-light text-accent rounded-full flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detail Produk */}
      {selectedProduct && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[100] bg-secondary/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
        >
          <div 
            ref={modalContentRef}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
          >
            <button 
              onClick={closeDetail}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
              {/* Image Side */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100 shrink-0">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={64} className="text-slate-300" />
                  </div>
                )}
                {selectedProduct.badges && selectedProduct.badges.length > 0 && (
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    {selectedProduct.badges.map((badge, idx) => (
                      <span key={idx} className="bg-white text-secondary px-3 py-1.5 rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5">
                        {idx === 0 ? <ShieldCheck size={14} className="text-accent" /> : <Leaf size={14} className="text-green-600" />}
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail Side */}
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col md:overflow-y-auto">
                <div className="mb-6">
                  <span className="text-xs font-black text-accent uppercase tracking-widest">{selectedProduct.category}</span>
                  <h2 className="text-3xl font-black text-secondary leading-tight mt-1 mb-2">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm font-bold text-secondary/60">
                    {selectedProduct.seller_name && (
                      <span className="flex items-center gap-1.5"><Globe size={16} /> {selectedProduct.seller_name}</span>
                    )}
                    {selectedProduct.location && (
                      <span className="flex items-center gap-1.5"><MapPin size={16} /> {selectedProduct.location}</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-secondary/50 uppercase tracking-widest mb-1">Harga Ekspor</p>
                      <p className="text-3xl font-black text-secondary">{formatUSD(selectedProduct.price_usd)}</p>
                      {selectedProduct.price_idr && (
                        <p className="text-sm font-bold text-secondary/50 mt-1">{formatIDR(selectedProduct.price_idr)}</p>
                      )}
                    </div>
                    {selectedProduct.min_order_qty && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-secondary/50 uppercase tracking-widest mb-1">Minimum Order</p>
                        <p className="text-xl font-black text-secondary">{selectedProduct.min_order_qty}</p>
                      </div>
                    )}
                  </div>
                  {selectedProduct.hs_code && (
                    <p className="text-xs text-secondary/40 font-bold mt-2">HS Code: {selectedProduct.hs_code}</p>
                  )}
                </div>

                {selectedProduct.description && (
                  <div className="space-y-6 mb-8 flex-1">
                    <div>
                      <h4 className="font-black text-secondary mb-2">Deskripsi Produk</h4>
                      <p className="text-secondary/70 text-sm leading-relaxed">{selectedProduct.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.lead_time && (
                        <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3">
                          <Truck className="text-accent shrink-0" size={20} />
                          <div>
                            <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Lead Waktu</p>
                            <p className="font-bold text-secondary text-sm">{selectedProduct.lead_time}</p>
                          </div>
                        </div>
                      )}
                      {selectedProduct.packaging && (
                        <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3">
                          <Package className="text-accent shrink-0" size={20} />
                          <div>
                            <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Packaging</p>
                            <p className="font-bold text-secondary text-sm">{selectedProduct.packaging}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Kontak Penjual */}
                {selectedProduct.whatsapp_number && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-0.5">Kontak Penjual (WhatsApp)</p>
                      <p className="font-black text-green-800 text-sm truncate">
                        +{selectedProduct.whatsapp_number}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={addToInquiry}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Tambah ke Inquiry List
                  </button>
                  {buildWhatsAppUrl(selectedProduct) ? (
                    <a
                      href={buildWhatsAppUrl(selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors shadow-md"
                    >
                      <MessageCircle size={18} />
                      Hubungi via WhatsApp
                    </a>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-secondary font-bold py-4 rounded-xl transition-colors">
                      <MessageCircle size={18} />
                      Hubungi Penjual
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Produk */}
      {showAddForm && (
        <div className="fixed inset-0 z-[200] bg-secondary/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-black text-secondary">Daftarkan Produk Ekspor</h2>
                <button onClick={() => { setShowAddForm(false); setFormError(''); setFormSuccess(''); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-secondary/50" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-bold">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleAddProduct} className="space-y-4">

                {/* ── Image Upload ── */}
                <div>
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">
                    Foto Produk <span className="text-secondary/30 font-normal normal-case">(maks. 3 gambar)</span>
                  </label>

                  {/* Preview strip */}
                  {formImages.length > 0 && (
                    <div className="flex gap-3 mb-3 flex-wrap">
                      {formImages.map((img, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 group shrink-0">
                          <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded">{i + 1}</span>
                        </div>
                      ))}
                      {formImages.length < 3 && (
                        <label
                          htmlFor="img-upload-extra"
                          className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors shrink-0"
                        >
                          <Plus size={20} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400 mt-1">Tambah</span>
                          <input id="img-upload-extra" type="file" accept="image/*" multiple className="hidden"
                            onChange={e => handleImageFiles(e.target.files)} />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Drop zone — only show when no images yet */}
                  {formImages.length === 0 && (
                    <label
                      htmlFor="img-upload"
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      className="flex flex-col items-center justify-center gap-3 w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-slate-100 group-hover:bg-accent/10 rounded-2xl flex items-center justify-center transition-colors">
                        <Upload size={22} className="text-slate-400 group-hover:text-accent transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-secondary/70 text-sm">Klik atau seret gambar ke sini</p>
                        <p className="text-xs text-secondary/40 mt-1">JPG, PNG, WebP — maks. 3 gambar</p>
                      </div>
                      <input id="img-upload" type="file" accept="image/*" multiple className="hidden"
                        onChange={e => handleImageFiles(e.target.files)} />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nama Produk *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Kopi Arabika Gayo Premium"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Kategori *</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent">
                      {CATEGORIES.filter(c => c !== 'Semua').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">HS Code</label>
                    <input type="text" value={form.hs_code} onChange={e => setForm({...form, hs_code: e.target.value})}
                      placeholder="0901.11"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Harga Ekspor (USD) *</label>
                    <input type="number" step="0.01" min="0" value={form.price_usd} onChange={e => setForm({...form, price_usd: e.target.value})}
                      placeholder="12.50"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Harga (IDR)</label>
                    <input type="number" min="0" value={form.price_idr} onChange={e => setForm({...form, price_idr: e.target.value})}
                      placeholder="195000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Minimum Order</label>
                    <input type="text" value={form.min_order_qty} onChange={e => setForm({...form, min_order_qty: e.target.value})}
                      placeholder="100 kg"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Nama UMKM / Koperasi</label>
                    <input type="text" value={form.seller_name} onChange={e => setForm({...form, seller_name: e.target.value})}
                      placeholder="Koperasi Kopi Gayo"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Lokasi</label>
                    <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                      placeholder="Aceh Tengah, Aceh"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Lead Time</label>
                    <input type="text" value={form.lead_time} onChange={e => setForm({...form, lead_time: e.target.value})}
                      placeholder="14 Hari Kerja"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Packaging</label>
                    <input type="text" value={form.packaging} onChange={e => setForm({...form, packaging: e.target.value})}
                      placeholder="Jute Bag (60kg) dengan GrainPro"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={12} className="text-green-600" />
                        Nomor WhatsApp Penjual <span className="text-green-600">(Buyer akan menghubungi via WA ini)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 font-bold text-sm">+62</span>
                      <input
                        type="tel"
                        value={form.whatsapp_number}
                        onChange={e => setForm({...form, whatsapp_number: e.target.value})}
                        placeholder="81318756412"
                        className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-green-500"
                      />
                    </div>
                    <p className="text-xs text-secondary/40 mt-1.5">Format: tanpa 0 di awal. Contoh: 81318756412</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Sertifikasi / Badges (pisah koma)</label>
                    <input type="text" value={form.badges} onChange={e => setForm({...form, badges: e.target.value})}
                      placeholder="Organik, Fair Trade, Halal"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Deskripsi Produk</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      rows={3}
                      placeholder="Jelaskan keunggulan produk, proses produksi, standar kualitas..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-secondary outline-none focus:border-accent resize-none" />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => { setShowAddForm(false); setFormError(''); }}
                    className="flex-1 py-4 text-sm font-black text-secondary border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={formLoading}
                    className="flex-1 py-4 bg-accent text-white text-sm font-black rounded-2xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
                    {formLoading ? <Loader className="animate-spin" size={16} /> : <Plus size={16} />}
                    {formLoading ? 'Menyimpan...' : 'Daftarkan Produk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
