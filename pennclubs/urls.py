from django.contrib import admin
from django.urls import path, include

admin.site.site_header = "Clubs Backend Admin"

urlpatterns = [
    path('clubs/', include('clubs.urls')),
    path('admin/', admin.site.urls),
]
