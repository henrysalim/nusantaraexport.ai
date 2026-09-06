import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MessageSquare, Plus, X, ThumbsUp, 
  MessageCircle, Bookmark, Loader, Truck, 
  FileCheck, DollarSign, HeartHandshake, Eye, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import './community.css';

export default function CommunityPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null means "Semua Diskusi"
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest'); // "newest" or "popular"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Post Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState({ category_id: '', title: '', content: '', tags: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Refs for GSAP
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/community/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Posts
  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        sort,
        limit: 30,
      };
      if (selectedCategory) {
        params.category_slug = selectedCategory;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await api.get('/api/community/posts', { params });
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Gagal memuat diskusi komunitas. Coba muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  // Open Drawer
  const handleOpenDrawer = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/komunitas' } });
      return;
    }
    
    // Set default category in form if one is currently selected
    if (selectedCategory && categories.length > 0) {
      const cat = categories.find(c => c.slug === selectedCategory);
      if (cat) {
        setForm(prev => ({ ...prev, category_id: cat.id }));
      }
    } else if (categories.length > 0) {
      setForm(prev => ({ ...prev, category_id: categories[0].id }));
    }
    
    setIsDrawerOpen(true);
  };

  // Animate drawer open when state is set to true
  useEffect(() => {
    if (isDrawerOpen && drawerRef.current && overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(drawerRef.current, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power2.out' });
    }
  }, [isDrawerOpen]);

  // Close Drawer
  const handleCloseDrawer = () => {
    if (drawerRef.current && overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
      gsap.to(drawerRef.current, { 
        x: '100%', 
        duration: 0.3, 
        ease: 'power2.in',
        onComplete: () => {
          setIsDrawerOpen(false);
          setForm({ category_id: '', title: '', content: '', tags: '' });
          setFormError('');
        }
      });
    } else {
      setIsDrawerOpen(false);
    }
  };

  // Submit New Post
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!form.category_id) {
      setFormError('Harap pilih kategori diskusi.');
      setFormLoading(false);
      return;
    }
    if (form.title.trim().length < 5) {
      setFormError('Judul minimal 5 karakter.');
      setFormLoading(false);
      return;
    }
    if (form.content.trim().length < 10) {
      setFormError('Isi diskusi minimal 10 karakter.');
      setFormLoading(false);
      return;
    }

    try {
      const tagsArray = form.tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      await api.post('/api/community/posts', {
        category_id: parseInt(form.category_id),
        title: form.title.trim(),
        content: form.content.trim(),
        tags: tagsArray
      });

      // Reload posts and close drawer
      fetchPosts();
      handleCloseDrawer();
    } catch (err) {
      console.error('Error creating post:', err);
      setFormError(err.response?.data?.detail || 'Gagal mengirim diskusi.');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Upvote on Card
  const handleUpvote = async (e, postId, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/komunitas' } });
      return;
    }

    try {
      const res = await api.post(`/api/community/posts/${postId}/react`);
      // Update local state
      const updatedPosts = [...posts];
      updatedPosts[index] = {
        ...updatedPosts[index],
        has_upvoted: res.data.has_upvoted,
        upvotes_count: res.data.upvotes_count
      };
      setPosts(updatedPosts);
    } catch (err) {
      console.error('Error upvoting:', err);
    }
  };

  // Toggle Bookmark on Card
  const handleBookmark = async (e, postId, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/komunitas' } });
      return;
    }

    try {
      const res = await api.post(`/api/community/posts/${postId}/bookmark`);
      const updatedPosts = [...posts];
      updatedPosts[index] = {
        ...updatedPosts[index],
        has_bookmarked: res.data.has_bookmarked
      };
      setPosts(updatedPosts);
    } catch (err) {
      console.error('Error bookmarking:', err);
    }
  };

  // Helper function to return Category Icon
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Truck': return <Truck size={18} />;
      case 'FileCheck': return <FileCheck size={18} />;
      case 'DollarSign': return <DollarSign size={18} />;
      case 'HeartHandshake': return <HeartHandshake size={18} />;
      default: return <MessageSquare size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-soft pt-24 pb-16">
      <div className="community-container">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-display font-black text-secondary mb-2">Forum Komunitas UMKM</h1>
            <p className="text-secondary/50 font-medium max-w-xl">
              Hubungkan bisnis Anda dengan sesama eksportir. Bagikan tantangan, bertukar tips logistik, regulasi, dan dukung kemajuan ekspor nusantara.
            </p>
          </div>
          <button 
            onClick={handleOpenDrawer}
            className="btn-primary self-start md:self-center"
          >
            <Plus size={18} /> Tulis Diskusi Baru
          </button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Categories Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-sm font-black text-secondary/40 uppercase tracking-widest mb-4">Kategori Diskusi</h2>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                >
                  <MessageSquare size={18} />
                  <span>Semua Diskusi</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`category-item ${selectedCategory === cat.slug ? 'active' : ''}`}
                  >
                    {getCategoryIcon(cat.icon)}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Search, Sort & Post List */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search & Sort Panel */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Cari topik diskusi..."
                  className="w-full pl-12 pr-5 py-3 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40">
                  <Search size={18} />
                </button>
              </form>

              {/* Sorting Tab */}
              <div className="flex gap-2 bg-slate-soft p-1.5 rounded-2xl w-full md:w-auto">
                <button
                  onClick={() => setSort('newest')}
                  className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl transition-all ${sort === 'newest' ? 'bg-white text-secondary shadow-sm' : 'text-secondary/50'}`}
                >
                  Terbaru
                </button>
                <button
                  onClick={() => setSort('popular')}
                  className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-xl transition-all ${sort === 'popular' ? 'bg-white text-secondary shadow-sm' : 'text-secondary/50'}`}
                >
                  Terpopuler
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-600 font-bold flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="animate-spin text-accent mb-4" size={40} />
                <span className="text-secondary/50 font-bold">Memuat postingan forum...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl text-center">
                <MessageSquare className="mx-auto text-secondary/20 mb-4" size={48} />
                <h3 className="text-lg font-black text-secondary mb-1">Belum ada diskusi</h3>
                <p className="text-secondary/50 font-medium mb-6">Jadilah yang pertama untuk memulai percakapan di kategori ini.</p>
                <button onClick={handleOpenDrawer} className="btn-primary">
                  <Plus size={16} /> Mulai Diskusi
                </button>
              </div>
            ) : (
              /* Posts Cards list */
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <Link 
                    key={post.id} 
                    to={`/komunitas/diskusi/${post.id}`}
                    className="block glass-panel p-6 rounded-3xl hover:border-accent/40 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {/* Author Avatar Initial */}
                      <div className="w-8 h-8 bg-accent-light text-accent rounded-full flex items-center justify-center text-xs font-black">
                        {post.author.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-secondary">{post.author.full_name}</span>
                          {/* Mock verified badge for exporter active community contributors */}
                          {post.views_count > 10 && (
                            <span className="verified-badge">Eksportir Ready</span>
                          )}
                        </div>
                        <span className="text-[10px] text-secondary/40 font-bold">
                          {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {/* Category Label */}
                      <span className="ml-auto px-3 py-1 bg-slate-soft text-secondary/60 text-[10px] font-black rounded-lg border border-slate-100 flex items-center gap-1.5">
                        {getCategoryIcon(post.category.icon)}
                        {post.category.name}
                      </span>
                    </div>

                    <h3 className="text-lg font-display font-black text-secondary mb-2 hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-secondary/60 text-sm font-medium line-clamp-2 mb-4">
                      {post.content}
                    </p>

                    {/* Tags List */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mb-4">
                        {post.tags.map((tag) => (
                          <span key={tag} className="tag-badge">#{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-2">
                      <button
                        onClick={(e) => handleUpvote(e, post.id, index)}
                        className={`action-btn-upvote ${post.has_upvoted ? 'active' : 'bg-slate-soft text-secondary/60'}`}
                      >
                        <ThumbsUp size={14} className={post.has_upvoted ? 'fill-accent' : ''} />
                        <span>{post.upvotes_count} Dukungan</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-secondary/50 text-xs font-bold bg-slate-soft px-3.5 py-2 rounded-full">
                        <MessageCircle size={14} />
                        <span>{post.comments_count} Balasan</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-secondary/50 text-xs font-bold bg-slate-soft px-3.5 py-2 rounded-full">
                        <Eye size={14} />
                        <span>{post.views_count} Dilihat</span>
                      </div>

                      <button
                        onClick={(e) => handleBookmark(e, post.id, index)}
                        className={`ml-auto p-2 rounded-full transition-colors ${post.has_bookmarked ? 'text-accent bg-accent-light' : 'text-secondary/40 hover:bg-slate-100'}`}
                        aria-label="Simpan diskusi"
                      >
                        <Bookmark size={16} className={post.has_bookmarked ? 'fill-accent' : ''} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Drawer: New Post Form */}
      {isDrawerOpen && (
        <>
          <div ref={overlayRef} className="drawer-overlay" onClick={handleCloseDrawer}></div>
          <div ref={drawerRef} className="drawer-content p-5 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-display font-black text-secondary">Tulis Diskusi Baru</h2>
              <button 
                onClick={handleCloseDrawer}
                className="p-2 text-secondary/50 hover:text-secondary rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-5">
                {/* Category Select */}
                <div>
                  <label htmlFor="category" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Pilih Kategori</label>
                  <select
                    id="category"
                    className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Judul Diskusi</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Contoh: Hambatan ekspor kopi robusta ke Shanghai"
                    className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Isi Diskusi / Pertanyaan</label>
                  <textarea
                    id="content"
                    rows={6}
                    placeholder="Tuliskan keluh kesah, pertanyaan, atau informasi berharga yang ingin Anda bagikan kepada eksportir lainnya..."
                    className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent resize-none"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  ></textarea>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2 block">Tags (Pisahkan dengan koma)</label>
                  <input
                    id="tags"
                    type="text"
                    placeholder="kopi, shanghai, bea-cukai, logistik"
                    className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="flex-1 py-4 text-sm font-black text-secondary border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-4 bg-accent text-white text-sm font-black rounded-2xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader className="animate-spin" size={16} /> : 'Kirim Diskusi'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
