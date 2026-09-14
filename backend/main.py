import os
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Link
from schemas import LinkCreate, LinkResponse
from auth_dependency import get_current_user


# --------------------------------------------------
# Create database tables
# --------------------------------------------------

Base.metadata.create_all(bind=engine)


# ==================================================
# ADMIN AUTHENTICATION
# ==================================================

def get_admin_user(
    current_user: dict = Depends(get_current_user)
):
    admin_uid = os.getenv("ADMIN_UID")

    if not admin_uid:
        raise HTTPException(
            status_code=500,
            detail="Admin configuration is missing"
        )

    if current_user.get("uid") != admin_uid:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="URLify API",
    description="URL Shortener Backend",
    version="7.1"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():
    return {
        "message": "URLify API is running 🚀"
    }


# ==================================================
# CREATE SHORT LINK
# ==================================================

@app.post(
    "/api/links",
    response_model=LinkResponse
)
def create_link(
    link: LinkCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    firebase_uid = current_user["uid"]

    existing_link = (
        db.query(Link)
        .filter(Link.short_code == link.short_code)
        .first()
    )

    if existing_link:
        raise HTTPException(
            status_code=409,
            detail="Short code already exists"
        )

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


# ==================================================
# GET CURRENT USER'S LINKS
# ==================================================

@app.get(
    "/api/links",
    response_model=list[LinkResponse]
)
def get_all_links(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    firebase_uid = current_user["uid"]

    links = (
        db.query(Link)
        .filter(Link.firebase_uid == firebase_uid)
        .order_by(Link.created_at.desc())
        .all()
    )

    return links


# ==================================================
# GET ONE CURRENT USER'S LINK
# ==================================================

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


# ==================================================
# PUBLIC REDIRECT
# ==================================================

@app.get("/r/{short_code}")
def redirect_link(
    short_code: str,
    db: Session = Depends(get_db)
):
    link = (
        db.query(Link)
        .filter(Link.short_code == short_code)
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    link.clicks += 1
    db.commit()

    return RedirectResponse(
        url=link.original_url,
        status_code=307
    )


# ==================================================
# DELETE CURRENT USER'S LINK
# ==================================================

@app.delete("/api/links/{short_code}")
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


# ==================================================
# CURRENT USER'S ANALYTICS
# ==================================================

@app.get("/api/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    firebase_uid = current_user["uid"]

    links = (
        db.query(Link)
        .filter(Link.firebase_uid == firebase_uid)
        .all()
    )

    total_links = len(links)

    total_clicks = sum(
        link.clicks for link in links
    )

    return {
        "total_links": total_links,
        "total_clicks": total_clicks
    }


# ==================================================
# ADMIN ENDPOINTS
# ==================================================


# ==================================================
# ADMIN OVERVIEW
# ==================================================

@app.get("/api/admin/overview")
def admin_overview(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user)
):
    total_links = db.query(Link).count()

    click_rows = (
        db.query(Link)
        .with_entities(Link.clicks)
        .all()
    )

    total_clicks_count = sum(
        clicks[0] for clicks in click_rows
    )

    unique_users = (
        db.query(Link.firebase_uid)
        .filter(Link.firebase_uid.isnot(None))
        .distinct()
        .count()
    )

    return {
        "total_links": total_links,
        "total_clicks": total_clicks_count,
        "total_users_with_links": unique_users
    }


# ==================================================
# ADMIN — GET ALL LINKS
# ==================================================

@app.get("/api/admin/links")
def admin_get_all_links(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user)
):
    links = (
        db.query(Link)
        .order_by(Link.created_at.desc())
        .all()
    )

    return [
        {
            "id": link.id,
            "original_url": link.original_url,
            "short_code": link.short_code,
            "clicks": link.clicks,
            "created_at": link.created_at,
            "firebase_uid": link.firebase_uid
        }
        for link in links
    ]


# ==================================================
# ADMIN — LINKS CREATED TODAY
# ==================================================

@app.get("/api/admin/links/today")
def admin_links_today(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user)
):
    now = datetime.utcnow()

    start_of_today = datetime(
        now.year,
        now.month,
        now.day
    )

    start_of_tomorrow = (
        start_of_today + timedelta(days=1)
    )

    links = (
        db.query(Link)
        .filter(
            Link.created_at >= start_of_today,
            Link.created_at < start_of_tomorrow
        )
        .order_by(Link.created_at.desc())
        .all()
    )

    return {
        "count": len(links),
        "links": [
            {
                "id": link.id,
                "original_url": link.original_url,
                "short_code": link.short_code,
                "clicks": link.clicks,
                "created_at": link.created_at,
                "firebase_uid": link.firebase_uid
            }
            for link in links
        ]
    }


# ==================================================
# ADMIN — MOST CLICKED LINKS
# ==================================================

@app.get("/api/admin/links/top")
def admin_top_links(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user)
):
    links = (
        db.query(Link)
        .order_by(Link.clicks.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": link.id,
            "original_url": link.original_url,
            "short_code": link.short_code,
            "clicks": link.clicks,
            "created_at": link.created_at,
            "firebase_uid": link.firebase_uid
        }
        for link in links
    ]


# ==================================================
# ADMIN — USERS WHO CREATED LINKS
# ==================================================

@app.get("/api/admin/users")
def admin_get_users(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user)
):
    user_rows = (
        db.query(Link.firebase_uid)
        .filter(Link.firebase_uid.isnot(None))
        .distinct()
        .all()
    )

    users = []

    for row in user_rows:
        firebase_uid = row[0]

        user_links = (
            db.query(Link)
            .filter(Link.firebase_uid == firebase_uid)
            .all()
        )

        total_links = len(user_links)

        total_clicks = sum(
            link.clicks for link in user_links
        )

        users.append({
            "firebase_uid": firebase_uid,
            "total_links": total_links,
            "total_clicks": total_clicks
        })

    return {
        "count": len(users),
        "users": users
    }


# ==================================================
# ADMIN — DELETE ANY LINK
# ==================================================

@app.delete("/api/admin/links/{short_code}")
def admin_delete_link(
    short_code: str,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(get_admin_user)
):
    link = (
        db.query(Link)
        .filter(Link.short_code == short_code)
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
        "message": "Link deleted successfully by admin"
    }