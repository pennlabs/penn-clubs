from django.contrib import admin
from django.urls import path, include

admin.site.site_header = "Clubs Backend Admin"

urlpatterns = [
    path('', include('clubs.urls')),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls', namespace='accounts')),
]
