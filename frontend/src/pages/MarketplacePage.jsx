import { useState, useRef } from 'react';
import { 
  Search, ShoppingCart, Star, 
  MapPin, ShieldCheck, Leaf, Globe, 
  X, Mail, ArrowRight, Package, Truck
} from 'lucide-react';
import gsap from 'gsap';

// Mock Data Produk UMKM
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Kopi Arabika Gayo Premium",
    umkm: "Koperasi Kopi Gayo",
    location: "Aceh Tengah, Aceh",
    priceUSD: 12.50,
    priceIDR: 195000,
    rating: 4.9,
    reviews: 124,
    moq: "100 kg",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Roasted_coffee_beans.jpg",
    category: "Makanan & Minuman",
    badges: ["Sertifikasi Organik", "Fair Trade"],
    description: "Kopi Arabika Gayo dengan cita rasa kompleks, tingkat keasaman rendah, dan aroma rempah yang khas. Diproses secara fully washed dan ditanam di ketinggian 1200-1500 mdpl.",
    leadTime: "14 Hari Kerja",
    packaging: "Jute Bag (60kg) dengan GrainPro"
  },
  {
    id: 2,
    name: "Kerajinan Tas Anyaman Rotan",
    umkm: "Rotan Lestari Bali",
    location: "Gianyar, Bali",
    priceUSD: 24.00,
    priceIDR: 375000,
    rating: 4.8,
    reviews: 89,
    moq: "50 pcs",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Fashionable_stylish_rattan_bag_on_a_tropical_wood_background._Tropical_island_of_Bali%2C_Indonesia._Rattan_handbag._%2842448810905%29.jpg",
    category: "Kerajinan",
    badges: ["Eco-friendly", "Handmade"],
    description: "Tas anyaman rotan asli Bali buatan tangan pengrajin lokal. Kuat, tahan lama, dan menggunakan pewarna alami yang ramah lingkungan.",
    leadTime: "21 Hari Kerja",
    packaging: "Karton Box Ekspor"
  },
  {
    id: 3,
    name: "Kain Batik Tulis Sutera",
    umkm: "Batik Pusaka Solo",
    location: "Surakarta, Jawa Tengah",
    priceUSD: 85.00,
    priceIDR: 1325000,
    rating: 5.0,
    reviews: 42,
    moq: "20 pcs",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Batik_Trusmi_Cirebon_%2823%29.jpg",
    category: "Tekstil & Pakaian",
    badges: ["Cultural Heritage", "Premium Silk"],
    description: "Batik tulis asli berbahan sutera 100% dengan motif klasik Solo. Dikerjakan dengan teknik tradisional selama 3 bulan per lembarnya.",
    leadTime: "30 Hari Kerja",
    packaging: "Premium Gift Box & Outer Carton"
  },
  {
    id: 4,
    name: "Biji Kakao Fermentasi Grade A",
    umkm: "Cokelat Nusantara",
    location: "Jembrana, Bali",
    priceUSD: 8.50,
    priceIDR: 132000,
    rating: 4.7,
    reviews: 215,
    moq: "500 kg",
    image: "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?auto=format&fit=crop&q=80&w=800",
    category: "Makanan & Minuman",
    badges: ["Export Ready", "High Cocoa Butter"],
    description: "Biji kakao fermentasi standar ekspor dengan kadar air maksimal 7.5%. Memiliki profil rasa fruity dan floral khas kakao Bali.",
    leadTime: "10 Hari Kerja",
    packaging: "Karung Goni 50kg"
  },
  {
    id: 5,
    name: "Minyak Nilam (Patchouli Oil)",
    umkm: "Atsiri Alam Indonesia",
    location: "Garut, Jawa Barat",
    priceUSD: 45.00,
    priceIDR: 700000,
    rating: 4.9,
    reviews: 67,
    moq: "10 kg",
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Rosemary_Oil_in_a_bottle_and_rosemary_herb.jpg",
    category: "Minyak Atsiri",
    badges: ["100% Pure", "Sertifikasi ISO"],
    description: "Minyak nilam murni hasil destilasi uap. Kandungan Patchouli Alcohol (PA) minimum 30%, sangat cocok untuk industri parfum global.",
    leadTime: "14 Hari Kerja",
    packaging: "Drum Aluminium (5kg / 10kg)"
  },
  {
    id: 6,
    name: "Mebel Kayu Jati Minimalis",
    umkm: "Jepara Woodcraft",
    location: "Jepara, Jawa Tengah",
    priceUSD: 250.00,
    priceIDR: 3900000,
    rating: 4.8,
    reviews: 112,
    moq: "1 Kontainer 20ft",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Teak_Garden_Furniture_Patio_Set.jpg",
    category: "Furniture",
    badges: ["Sertifikasi SVLK", "Kiln Dried"],
    description: "Set kursi dan meja berbahan kayu jati perhutani TPK. Finishing natural teak oil standar ekspor dengan ketahanan cuaca tinggi.",
    leadTime: "45 Hari Kerja",
    packaging: "Corrugated Paper & Pallet Kayu"
  }
];

const CATEGORIES = ["Semua", "Makanan & Minuman", "Kerajinan", "Tekstil & Pakaian", "Minyak Atsiri", "Furniture"];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const overlayRef = useRef(null);
  const modalContentRef = useRef(null);

  // Filter produk berdasarkan pencarian dan kategori
  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesCategory = activeCategory === "Semua" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.umkm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format currency
  const formatIDR = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };
  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  // Buka Modal Detail
  const openDetail = (product) => {
    setSelectedProduct(product);
    // Animasi GSAP muncul
    setTimeout(() => {
      if (overlayRef.current && modalContentRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalContentRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
      }
    }, 10); // sedikit delay agar DOM render selesai
  };

  // Tutup Modal Detail
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
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" size={20} />
            <input 
              type="text" 
              placeholder="Cari produk atau nama UMKM..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-secondary focus:border-accent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Search size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-secondary">Produk tidak ditemukan</h3>
            <p className="text-secondary/50 mt-2">Coba gunakan kata kunci atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="danantara-card group flex flex-col bg-white rounded-3xl overflow-hidden cursor-pointer"
                onClick={() => openDetail(product)}
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.badges.map((badge, idx) => (
                      <span key={idx} className="bg-white/90 backdrop-blur-sm text-secondary px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5">
                        {idx === 0 ? <ShieldCheck size={14} className="text-accent" /> : <Leaf size={14} className="text-green-600" />}
                        {badge}
                      </span>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white font-bold text-sm flex items-center gap-1.5">
                      <MapPin size={14} className="text-accent" /> {product.location}
                    </p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-black text-accent uppercase tracking-wider">{product.category}</p>
                    <div className="flex items-center gap-1 text-sm font-bold text-secondary">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      {product.rating} <span className="text-secondary/40 font-medium">({product.reviews})</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-secondary leading-tight mb-1 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm font-medium text-secondary/60 mb-4">{product.umkm}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-black text-secondary">
                        {formatUSD(product.priceUSD)}
                      </span>
                      <span className="text-sm font-bold text-secondary/50">
                        {formatIDR(product.priceIDR)} <span className="font-normal text-xs">/ unit</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-bold text-secondary/70 bg-slate-100 px-3 py-1.5 rounded-lg">
                        MOQ: {product.moq}
                      </span>
                      <button className="w-10 h-10 bg-accent-light text-accent rounded-full flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
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
            {/* Close Button */}
            <button 
              onClick={closeDetail}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
              {/* Image Side */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100 shrink-0">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {selectedProduct.badges.map((badge, idx) => (
                    <span key={idx} className="bg-white text-secondary px-3 py-1.5 rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5">
                      {idx === 0 ? <ShieldCheck size={14} className="text-accent" /> : <Leaf size={14} className="text-green-600" />}
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detail Side */}
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col md:overflow-y-auto">
                <div className="mb-6">
                  <span className="text-xs font-black text-accent uppercase tracking-widest">{selectedProduct.category}</span>
                  <h2 className="text-3xl font-black text-secondary leading-tight mt-1 mb-2">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm font-bold text-secondary/60">
                    <span className="flex items-center gap-1.5"><Globe size={16} /> {selectedProduct.umkm}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {selectedProduct.location}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-secondary/50 uppercase tracking-widest mb-1">Harga Ekspor</p>
                      <p className="text-3xl font-black text-secondary">{formatUSD(selectedProduct.priceUSD)}</p>
                      <p className="text-sm font-bold text-secondary/50 mt-1">{formatIDR(selectedProduct.priceIDR)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-secondary/50 uppercase tracking-widest mb-1">Minimum Order</p>
                      <p className="text-xl font-black text-secondary">{selectedProduct.moq}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-8 flex-1">
                  <div>
                    <h4 className="font-black text-secondary mb-2">Deskripsi Produk</h4>
                    <p className="text-secondary/70 text-sm leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3">
                      <Truck className="text-accent shrink-0" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Lead Waktu</p>
                        <p className="font-bold text-secondary text-sm">{selectedProduct.leadTime}</p>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3">
                      <Package className="text-accent shrink-0" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Packaging</p>
                        <p className="font-bold text-secondary text-sm">{selectedProduct.packaging}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={addToInquiry}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Tambah ke Inquiry List
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-secondary font-bold py-4 rounded-xl transition-colors">
                    <Mail size={18} />
                    Kirim Pesan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style CSS custom untuk scrollbar kecil di kategori */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
