import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ThumbsUp, MessageCircle, Eye, 
  Bookmark, Loader, Send, CornerDownRight, AlertCircle, Truck, FileCheck, DollarSign, HeartHandshake, MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './community.css';

export default function PostDetailPage() {
  const { postId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // State
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Forms State
  const [newComment, setNewComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null); // id of comment currently being replied to
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitLoading, setReplySubmitLoading] = useState(false);

  // Fetch Post and Comments
  const fetchPostData = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/api/community/posts/${postId}`),
        api.get(`/api/community/posts/${postId}/comments`)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      console.error('Error fetching post detail:', err);
      setError('Diskusi tidak ditemukan atau terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostData();
  }, [postId]);

  // Handle Post Upvote
  const handleUpvote = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/komunitas/diskusi/${postId}` } });
      return;
    }

    try {
      const res = await api.post(`/api/community/posts/${postId}/react`);
      setPost(prev => ({
        ...prev,
        has_upvoted: res.data.has_upvoted,
        upvotes_count: res.data.upvotes_count
      }));
    } catch (err) {
      console.error('Error upvoting:', err);
    }
  };

  // Handle Post Bookmark
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/komunitas/diskusi/${postId}` } });
      return;
    }

    try {
      const res = await api.post(`/api/community/posts/${postId}/bookmark`);
      setPost(prev => ({
        ...prev,
        has_bookmarked: res.data.has_bookmarked
      }));
    } catch (err) {
      console.error('Error bookmarking:', err);
    }
  };

  // Submit Main Comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/komunitas/diskusi/${postId}` } });
      return;
    }
    if (newComment.trim().length < 2) return;

    setSubmitLoading(true);
    try {
      const res = await api.post(`/api/community/posts/${postId}/comments`, {
        content: newComment.trim()
      });
      // Append comment to list locally
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      // Update comments count on post
      setPost(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit Reply to Comment
  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/komunitas/diskusi/${postId}` } });
      return;
    }
    if (replyContent.trim().length < 2) return;

    setReplySubmitLoading(true);
    try {
      const res = await api.post(`/api/community/posts/${postId}/comments`, {
        content: replyContent.trim(),
        parent_id: parentId
      });

      // Inject reply to comment tree recursively
      const addReplyToTree = (list) => {
        return list.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), res.data]
            };
          } else if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: addReplyToTree(c.replies)
            };
          }
          return c;
        });
      };

      setComments(prev => addReplyToTree(prev));
      setReplyContent('');
      setActiveReplyId(null);
      // Update comments count on post
      setPost(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setReplySubmitLoading(false);
    }
  };

  // Helper category icon
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Truck': return <Truck size={16} />;
      case 'FileCheck': return <FileCheck size={16} />;
      case 'DollarSign': return <DollarSign size={16} />;
      case 'HeartHandshake': return <HeartHandshake size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  // Recursive Comment Node Component
  const CommentNode = ({ comment, depth = 0 }) => {
    return (
      <div className={`comment-card ${depth > 0 ? 'ml-6 border-l-2 border-slate-200 pl-4 mt-3 bg-slate-50/50 p-3 rounded-2xl' : 'bg-white p-5 border border-slate-100 rounded-3xl'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-accent-light text-accent rounded-full flex items-center justify-center text-xs font-black">
            {comment.author.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-xs font-black text-secondary">{comment.author.full_name}</span>
            <span className="text-[10px] text-secondary/40 font-bold ml-2">
              {new Date(comment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-secondary/80 whitespace-pre-line">
          {comment.content}
        </p>

        {/* Action Button: Reply */}
        {isAuthenticated && depth < 2 && (
          <div className="mt-3">
            {activeReplyId === comment.id ? (
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-3 space-y-3">
                <textarea
                  rows={2}
                  placeholder={`Balas ${comment.author.full_name}...`}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-secondary outline-none focus:border-accent resize-none"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                ></textarea>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveReplyId(null); setReplyContent(''); }}
                    className="px-3 py-1.5 text-xs font-bold text-secondary/60 hover:text-secondary rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={replySubmitLoading}
                    className="px-4 py-1.5 bg-accent text-white text-xs font-black rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-1.5"
                  >
                    {replySubmitLoading ? <Loader className="animate-spin" size={12} /> : <CornerDownRight size={12} />}
                    Kirim Balasan
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => { setActiveReplyId(comment.id); setReplyContent(''); }}
                className="text-xs font-black text-accent hover:text-accent-dark flex items-center gap-1"
              >
                <CornerDownRight size={12} /> Balas
              </button>
            )}
          </div>
        )}

        {/* Recursive Children Replies */}
        {comment.replies && comment.replies.map(reply => (
          <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-soft">
        <Loader className="animate-spin text-accent mb-4" size={40} />
        <span className="text-secondary/50 font-bold">Memuat detail diskusi...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-soft p-6">
        <div className="max-w-md text-center glass-panel p-8 rounded-3xl">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-black text-secondary mb-2">Halaman Bermasalah</h2>
          <p className="text-secondary/50 font-medium mb-6">{error || 'Gagal memuat diskusi'}</p>
          <Link to="/komunitas" className="btn-primary">
            <ArrowLeft size={16} /> Kembali ke Forum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-soft pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        
        {/* Back Link */}
        <Link to="/komunitas" className="inline-flex items-center gap-2 text-sm font-black text-secondary/60 hover:text-accent transition-colors">
          <ArrowLeft size={16} /> Kembali ke Forum Komunitas
        </Link>

        {/* Main Post Card */}
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-light text-accent rounded-full flex items-center justify-center text-sm font-black">
                {post.author.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-secondary text-base">{post.author.full_name}</span>
                  {post.views_count > 10 && (
                    <span className="verified-badge">Eksportir Ready</span>
                  )}
                </div>
                <span className="text-xs text-secondary/40 font-bold">
                  Diterbitkan pada {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <span className="px-3.5 py-1.5 bg-slate-soft text-secondary/60 text-xs font-black rounded-xl border border-slate-100 flex items-center gap-1.5">
              {getCategoryIcon(post.category.icon)}
              {post.category.name}
            </span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-secondary mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-secondary/80 text-base font-medium whitespace-pre-line leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag) => (
                <span key={tag} className="tag-badge">#{tag}</span>
              ))}
            </div>
          )}

          {/* Post Metrics and Actions */}
          <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
            <button
              onClick={handleUpvote}
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
              onClick={handleBookmark}
              className={`ml-auto p-2.5 rounded-full transition-colors ${post.has_bookmarked ? 'text-accent bg-accent-light' : 'text-secondary/40 hover:bg-slate-100'}`}
              aria-label="Simpan diskusi"
            >
              <Bookmark size={18} className={post.has_bookmarked ? 'fill-accent' : ''} />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-display font-black text-secondary flex items-center gap-2">
            Balasan Diskusi ({comments.length})
          </h2>

          {/* Comment Submission Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-[10px] font-black">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-xs font-black text-secondary">Berikan tanggapan sebagai {user?.full_name}</span>
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Tulis balasan Anda secara terperinci untuk membantu..."
                  className="w-full px-5 py-4 bg-slate-soft border border-slate-200 rounded-2xl font-bold text-secondary outline-none focus:border-accent resize-none pr-14"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <button
                  type="submit"
                  disabled={submitLoading || newComment.trim().length < 2}
                  className="absolute right-4 bottom-4 p-3 bg-accent text-white rounded-2xl hover:bg-accent-dark transition-colors disabled:bg-secondary/10 disabled:text-secondary/30"
                  aria-label="Kirim komentar"
                >
                  {submitLoading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
            </form>
          ) : (
            <div className="glass-panel p-6 rounded-3xl text-center">
              <p className="text-sm font-medium text-secondary/60 mb-3">Harap masuk untuk berkontribusi memberikan balasan pada diskusi ini.</p>
              <Link to="/login" state={{ from: `/komunitas/diskusi/${postId}` }} className="btn-primary text-xs py-2">
                Masuk Sekarang
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl text-center">
              <p className="text-secondary/50 font-bold">Belum ada tanggapan. Jadilah yang pertama memberikan balasan!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentNode key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
