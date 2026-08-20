"""
Community Forum API Routes — Categories, Posts, Comments, Reactions, Bookmarks.
All community endpoints are under /api/community prefix.
"""
import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from pydantic import BaseModel, Field

from app.config.db_config import execute_auth_query
from app.middleware import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Request/Response Models ---

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: Optional[str]
    slug: str

class PostCreateRequest(BaseModel):
    category_id: int
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10)
    tags: Optional[List[str]] = []

class CommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=2)
    parent_id: Optional[UUID] = None

class AuthorResponse(BaseModel):
    id: UUID
    full_name: str

class PostListResponse(BaseModel):
    id: UUID
    title: str
    content: str
    tags: List[str]
    views_count: int
    created_at: str
    updated_at: str
    author: AuthorResponse
    category: CategoryResponse
    upvotes_count: int
    comments_count: int
    has_upvoted: bool
    has_bookmarked: bool

class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    content: str
    created_at: str
    updated_at: str
    parent_id: Optional[UUID]
    author: AuthorResponse
    replies: Optional[List['CommentResponse']] = []

# Resolve self-reference for comments replies
CommentResponse.model_rebuild()


# --- Helper for Optional User Dependency ---
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import decode_token

security = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    request: Request = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    token = None
    if credentials:
        token = credentials.credentials
    if not token and request:
        token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = execute_auth_query(
            "SELECT id, full_name, email FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True
        )
        return dict(user) if user else None
    except Exception:
        return None


# --- Endpoints ---

DEFAULT_CATEGORIES = [
    {"id": 1, "name": "Logistik & Kontainer", "description": "Diskusi mengenai pengiriman barang, pemilihan kargo, LCL/FCL, dokumen kepabeanan, dan tips pengapalan.", "icon": "Truck", "slug": "logistik-dan-kontainer"},
    {"id": 2, "name": "Sertifikasi & Regulasi", "description": "Tanya jawab seputar sertifikasi Halal, HACCP, standar FDA, phytosanitary, dan bea cukai negara tujuan ekspor.", "icon": "FileCheck", "slug": "sertifikasi-dan-regulasi"},
    {"id": 3, "name": "Pembayaran & Keuangan", "description": "Membahas Letter of Credit (L/C), metode pembayaran ekspor yang aman, asuransi ekspor, dan pendanaan ekspor.", "icon": "DollarSign", "slug": "pembayaran-dan-keuangan"},
    {"id": 4, "name": "Pojok Curhat UMKM", "description": "Ruang santai sesama pelaku UMKM untuk berbagi perjuangan, hambatan, kegagalan, dan motivasi dalam perjalanan ekspor.", "icon": "HeartHandshake", "slug": "pojok-curhat-umkm"}
]

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Get all discussion categories."""
    try:
        categories = execute_auth_query(
            "SELECT id, name, description, icon, slug FROM community_categories ORDER BY id ASC",
            fetch=True
        )
        if not categories:
            categories = DEFAULT_CATEGORIES
            
        return [
            CategoryResponse(
                id=c["id"],
                name=c["name"],
                description=c["description"],
                icon=c["icon"],
                slug=c["slug"]
            )
            for c in categories
        ]
    except Exception as e:
        logger.error(f"Error fetching categories: {e}. Using fallback defaults.")
        return [CategoryResponse(**c) for c in DEFAULT_CATEGORIES]


@router.get("/posts", response_model=List[PostListResponse])
async def get_posts(
    category_slug: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("newest", pattern="^(newest|popular)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get paginated posts with filtering, search, and sorting.
    Returns status of upvote/bookmark relative to the authenticated user.
    """
    user_id = str(current_user["id"]) if current_user else None

    # Build dynamic SQL query
    base_query = """
        SELECT 
            p.id, p.title, p.content, p.tags, p.views_count, p.created_at, p.updated_at,
            p.user_id as author_id, u.full_name as author_name,
            c.id as cat_id, c.name as cat_name, c.description as cat_desc, c.icon as cat_icon, c.slug as cat_slug,
            (SELECT COUNT(*)::int FROM community_reactions r WHERE r.post_id = p.id AND r.reaction_type = 'upvote') as upvotes_count,
            (SELECT COUNT(*)::int FROM community_comments cm WHERE cm.post_id = p.id) as comments_count,
            CASE WHEN %s IS NOT NULL THEN EXISTS(SELECT 1 FROM community_reactions r WHERE r.post_id = p.id AND r.user_id = %s::uuid AND r.reaction_type = 'upvote') ELSE FALSE END as has_upvoted,
            CASE WHEN %s IS NOT NULL THEN EXISTS(SELECT 1 FROM community_bookmarks b WHERE b.post_id = p.id AND b.user_id = %s::uuid) ELSE FALSE END as has_bookmarked
        FROM community_posts p
        JOIN users u ON p.user_id = u.id
        JOIN community_categories c ON p.category_id = c.id
    """
    
    where_clauses = []
    params = [user_id, user_id, user_id, user_id]

    if category_slug:
        where_clauses.append("c.slug = %s")
        params.append(category_slug)

    if search:
        where_clauses.append("(p.title ILIKE %s OR p.content ILIKE %s)")
        search_param = f"%{search}%"
        params.extend([search_param, search_param])

    if where_clauses:
        base_query += " WHERE " + " AND ".join(where_clauses)

    if sort == "popular":
        base_query += " ORDER BY upvotes_count DESC, p.created_at DESC"
    else:
        base_query += " ORDER BY p.created_at DESC"

    base_query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    try:
        posts = execute_auth_query(base_query, tuple(params), fetch=True)
        
        result = []
        for p in posts:
            result.append(
                PostListResponse(
                    id=p["id"],
                    title=p["title"],
                    content=p["content"],
                    tags=p["tags"] or [],
                    views_count=p["views_count"],
                    created_at=str(p["created_at"]),
                    updated_at=str(p["updated_at"]),
                    author=AuthorResponse(
                        id=p["author_id"],
                        full_name=p["author_name"]
                    ),
                    category=CategoryResponse(
                        id=p["cat_id"],
                        name=p["cat_name"],
                        description=p["cat_desc"],
                        icon=p["cat_icon"],
                        slug=p["cat_slug"]
                    ),
                    upvotes_count=p["upvotes_count"],
                    comments_count=p["comments_count"],
                    has_upvoted=p["has_upvoted"],
                    has_bookmarked=p["has_bookmarked"]
                )
            )
        return result
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memuat diskusi komunitas"
        )


@router.post("/posts", response_model=PostListResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    req: PostCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new community thread."""
    # Verify category exists
    category = execute_auth_query(
        "SELECT id, name, description, icon, slug FROM community_categories WHERE id = %s",
        (req.category_id,),
        fetch_one=True
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kategori tidak ditemukan"
        )

    try:
        new_post = execute_auth_query(
            """
            INSERT INTO community_posts (user_id, category_id, title, content, tags)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, title, content, tags, views_count, created_at, updated_at
            """,
            (current_user["id"], req.category_id, req.title, req.content, req.tags),
            fetch_one=True
        )

        return PostListResponse(
            id=new_post["id"],
            title=new_post["title"],
            content=new_post["content"],
            tags=new_post["tags"] or [],
            views_count=new_post["views_count"],
            created_at=str(new_post["created_at"]),
            updated_at=str(new_post["updated_at"]),
            author=AuthorResponse(
                id=current_user["id"],
                full_name=current_user["full_name"]
            ),
            category=CategoryResponse(
                id=category["id"],
                name=category["name"],
                description=category["description"],
                icon=category["icon"],
                slug=category["slug"]
            ),
            upvotes_count=0,
            comments_count=0,
            has_upvoted=False,
            has_bookmarked=False
        )
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal membuat postingan diskusi"
        )


@router.get("/posts/{post_id}", response_model=PostListResponse)
async def get_post_detail(
    post_id: UUID,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get detailed post and increment its view count.
    """
    user_id = str(current_user["id"]) if current_user else None

    # Increment view count
    execute_auth_query(
        "UPDATE community_posts SET views_count = views_count + 1 WHERE id = %s",
        (str(post_id),)
    )

    query = """
        SELECT 
            p.id, p.title, p.content, p.tags, p.views_count, p.created_at, p.updated_at,
            p.user_id as author_id, u.full_name as author_name,
            c.id as cat_id, c.name as cat_name, c.description as cat_desc, c.icon as cat_icon, c.slug as cat_slug,
            (SELECT COUNT(*)::int FROM community_reactions r WHERE r.post_id = p.id AND r.reaction_type = 'upvote') as upvotes_count,
            (SELECT COUNT(*)::int FROM community_comments cm WHERE cm.post_id = p.id) as comments_count,
            CASE WHEN %s IS NOT NULL THEN EXISTS(SELECT 1 FROM community_reactions r WHERE r.post_id = p.id AND r.user_id = %s::uuid AND r.reaction_type = 'upvote') ELSE FALSE END as has_upvoted,
            CASE WHEN %s IS NOT NULL THEN EXISTS(SELECT 1 FROM community_bookmarks b WHERE b.post_id = p.id AND b.user_id = %s::uuid) ELSE FALSE END as has_bookmarked
        FROM community_posts p
        JOIN users u ON p.user_id = u.id
        JOIN community_categories c ON p.category_id = c.id
        WHERE p.id = %s
    """

    post = execute_auth_query(query, (user_id, user_id, user_id, user_id, str(post_id)), fetch_one=True)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diskusi tidak ditemukan"
        )

    return PostListResponse(
        id=post["id"],
        title=post["title"],
        content=post["content"],
        tags=post["tags"] or [],
        views_count=post["views_count"],
        created_at=str(post["created_at"]),
        updated_at=str(post["updated_at"]),
        author=AuthorResponse(
            id=post["author_id"],
            full_name=post["author_name"]
        ),
        category=CategoryResponse(
            id=post["cat_id"],
            name=post["cat_name"],
            description=post["cat_desc"],
            icon=post["cat_icon"],
            slug=post["cat_slug"]
        ),
        upvotes_count=post["upvotes_count"],
        comments_count=post["comments_count"],
        has_upvoted=post["has_upvoted"],
        has_bookmarked=post["has_bookmarked"]
    )


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: UUID):
    """
    Get all comments for a post, constructed in a tree structure (parent-child).
    """
    query = """
        SELECT 
            c.id, c.post_id, c.content, c.created_at, c.updated_at, c.parent_id,
            c.user_id as author_id, u.full_name as author_name
        FROM community_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = %s
        ORDER BY c.created_at ASC
    """
    try:
        comments_raw = execute_auth_query(query, (str(post_id),), fetch=True)
        
        # Build nested structure
        comment_dict = {}
        roots = []

        for c in comments_raw:
            cmt = CommentResponse(
                id=c["id"],
                post_id=c["post_id"],
                content=c["content"],
                created_at=str(c["created_at"]),
                updated_at=str(c["updated_at"]),
                parent_id=c["parent_id"],
                author=AuthorResponse(
                    id=c["author_id"],
                    full_name=c["author_name"]
                ),
                replies=[]
            )
            comment_dict[cmt.id] = cmt

        for cmt in comment_dict.values():
            if cmt.parent_id:
                parent = comment_dict.get(cmt.parent_id)
                if parent:
                    parent.replies.append(cmt)
            else:
                roots.append(cmt)

        return roots
    except Exception as e:
        logger.error(f"Error fetching comments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memuat komentar"
        )


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    req: CommentCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Post a comment or reply to an existing comment."""
    # Check post existence
    post_exists = execute_auth_query(
        "SELECT id FROM community_posts WHERE id = %s",
        (str(post_id),),
        fetch_one=True
    )
    if not post_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diskusi tidak ditemukan"
        )

    # Check parent comment existence if parent_id is supplied
    if req.parent_id:
        parent_exists = execute_auth_query(
            "SELECT id FROM community_comments WHERE id = %s AND post_id = %s",
            (str(req.parent_id), str(post_id)),
            fetch_one=True
        )
        if not parent_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Komentar induk tidak ditemukan"
            )

    try:
        new_comment = execute_auth_query(
            """
            INSERT INTO community_comments (post_id, user_id, parent_id, content)
            VALUES (%s, %s, %s, %s)
            RETURNING id, post_id, parent_id, content, created_at, updated_at
            """,
            (str(post_id), current_user["id"], str(req.parent_id) if req.parent_id else None, req.content),
            fetch_one=True
        )

        return CommentResponse(
            id=new_comment["id"],
            post_id=new_comment["post_id"],
            content=new_comment["content"],
            created_at=str(new_comment["created_at"]),
            updated_at=str(new_comment["updated_at"]),
            parent_id=new_comment["parent_id"],
            author=AuthorResponse(
                id=current_user["id"],
                full_name=current_user["full_name"]
            ),
            replies=[]
        )
    except Exception as e:
        logger.error(f"Error creating comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal mengirim komentar"
        )


@router.post("/posts/{post_id}/react")
async def toggle_upvote(
    post_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Toggle upvote for a post."""
    post_exists = execute_auth_query(
        "SELECT id FROM community_posts WHERE id = %s",
        (str(post_id),),
        fetch_one=True
    )
    if not post_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diskusi tidak ditemukan"
        )

    # Check if reaction exists
    reaction = execute_auth_query(
        "SELECT id FROM community_reactions WHERE post_id = %s AND user_id = %s AND reaction_type = 'upvote'",
        (str(post_id), current_user["id"]),
        fetch_one=True
    )

    try:
        if reaction:
            # Delete reaction (toggle off)
            execute_auth_query(
                "DELETE FROM community_reactions WHERE id = %s",
                (reaction["id"],)
            )
            action = "removed"
        else:
            # Insert reaction (toggle on)
            execute_auth_query(
                "INSERT INTO community_reactions (post_id, user_id, reaction_type) VALUES (%s, %s, 'upvote')",
                (str(post_id), current_user["id"])
            )
            action = "added"

        # Fetch new upvote count
        upvotes_count = execute_auth_query(
            "SELECT COUNT(*)::int FROM community_reactions WHERE post_id = %s AND reaction_type = 'upvote'",
            (str(post_id),),
            fetch_one=True
        )["count"]

        return {
            "status": "success",
            "action": action,
            "upvotes_count": upvotes_count,
            "has_upvoted": not bool(reaction)
        }
    except Exception as e:
        logger.error(f"Error toggling reaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memproses upvote"
        )


@router.post("/posts/{post_id}/bookmark")
async def toggle_bookmark(
    post_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Toggle bookmark for a post."""
    post_exists = execute_auth_query(
        "SELECT id FROM community_posts WHERE id = %s",
        (str(post_id),),
        fetch_one=True
    )
    if not post_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diskusi tidak ditemukan"
        )

    # Check if bookmark exists
    bookmark = execute_auth_query(
        "SELECT id FROM community_bookmarks WHERE post_id = %s AND user_id = %s",
        (str(post_id), current_user["id"]),
        fetch_one=True
    )

    try:
        if bookmark:
            # Delete bookmark
            execute_auth_query(
                "DELETE FROM community_bookmarks WHERE id = %s",
                (bookmark["id"],)
            )
            action = "removed"
        else:
            # Insert bookmark
            execute_auth_query(
                "INSERT INTO community_bookmarks (post_id, user_id) VALUES (%s, %s)",
                (str(post_id), current_user["id"])
            )
            action = "added"

        return {
            "status": "success",
            "action": action,
            "has_bookmarked": not bool(bookmark)
        }
    except Exception as e:
        logger.error(f"Error toggling bookmark: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memproses penyimpanan diskusi"
        )
