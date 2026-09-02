"""Main API v1 router — aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, properties, search, favorites, contacts, payments, notifications, reports, admin, saved_searches, images

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
api_router.include_router(images.router, prefix="/images", tags=["Images"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(saved_searches.router, prefix="/saved-searches", tags=["Saved Searches"])
