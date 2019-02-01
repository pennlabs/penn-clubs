from django.urls import path
from clubs import views

urlpatterns = [
    path('clubs/', views.club_list),
    path('clubs/<int:pk>/', views.club_detail),
]