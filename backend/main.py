from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Link
from schemas import LinkCreate, LinkResponse
from auth_dependency import get_current_user


# =====================================================
# CREATE DATABASE TABLES
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="URLify API",
    description="URL Shortener Backend",
    version="7.0"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():

    return {
        "message": "URLify API is running 🚀"
    }


# =====================================================
# CREATE SHORT LINK
# =====================================================

@app.post(
    "/api/links",
    response_model=LinkResponse
)
def create_link(
    link: LinkCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    # Get Firebase UID
    firebase_uid = current_user["uid"]

    # Check whether short code already exists
    existing_link = (
        db.query(Link)
        .filter(
            Link.short_code == link.short_code
        )
        .first()
    )

    if existing_link:

        raise HTTPException(
            status_code=409,
            detail="Short code already exists"
        )

    # Create database record
    new_link = Link(
        original_url=str(link.original_url),
        short_code=link.short_code,
        clicks=0,
        firebase_uid=firebase_uid
    )

    db.add(new_link)

    db.commit()

    db.refresh(new_link)

    return new_link


# =====================================================
# GET USER'S LINKS
# =====================================================

@app.get(
    "/api/links",
    response_model=list[LinkResponse]
)
def get_all_links(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    # Get Firebase UID
    firebase_uid = current_user["uid"]

    # Only return links belonging to this user
    links = (
        db.query(Link)
        .filter(
            Link.firebase_uid == firebase_uid
        )
        .order_by(
            Link.created_at.desc()
        )
        .all()
    )

    return links


# =====================================================
# GET ONE USER LINK
# =====================================================

@app.get(
    "/api/links/{short_code}",
    response_model=LinkResponse
)
def get_link(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    firebase_uid = current_user["uid"]

    link = (
        db.query(Link)
        .filter(
            Link.short_code == short_code,
            Link.firebase_uid == firebase_uid
        )
        .first()
    )

    if not link:

        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    return link


# =====================================================
# REDIRECT
# =====================================================

@app.get(
    "/r/{short_code}"
)
def redirect_link(
    short_code: str,
    db: Session = Depends(get_db)
):

    # IMPORTANT:
    # This endpoint stays PUBLIC.
    # Anyone with the short URL can use it.

    link = (
        db.query(Link)
        .filter(
            Link.short_code == short_code
        )
        .first()
    )

    if not link:

        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    # Increase click count
    link.clicks += 1

    db.commit()

    # Redirect to original URL
    return RedirectResponse(
        url=link.original_url,
        status_code=307
    )


# =====================================================
# DELETE USER'S LINK
# =====================================================

@app.delete(
    "/api/links/{short_code}"
)
def delete_link(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    firebase_uid = current_user["uid"]

    link = (
        db.query(Link)
        .filter(
            Link.short_code == short_code,
            Link.firebase_uid == firebase_uid
        )
        .first()
    )

    if not link:

        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    db.delete(link)

    db.commit()

    return {
        "message": "Link deleted successfully"
    }
# =====================================================
# ANALYTICS
# =====================================================

@app.get("/api/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    firebase_uid = current_user["uid"]

    # Get all links belonging to this user
    links = (
        db.query(Link)
        .filter(
            Link.firebase_uid == firebase_uid
        )
        .all()
    )

    # Total links
    total_links = len(links)

    # Total clicks
    total_clicks = sum(
        link.clicks for link in links
    )

    return {
        "total_links": total_links,
        "total_clicks": total_clicks
    }