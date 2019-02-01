from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from clubs.models import Club
from clubs.serializers import ClubSerializer

@csrf_exempt
def club_list(request):
    """
    List all code clubs, or create a new club.
    """
    if request.method == 'GET':
        clubs = Club.objects.all()
        serializer = ClubSerializer(clubs, many=True)
        return JsonResponse(serializer.data, safe=False)

    elif request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = ClubSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)


@csrf_exempt
def club_detail(request, pk):
    """
    Retrieve, update or delete a club.
    """
    try:
        club = Club.objects.get(pk=pk)
    except Club.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = ClubSerializer(club)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = ClubSerializer(club, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        club.delete()
        return HttpResponse(status=204)