import random
from collections import OrderedDict
from urllib.parse import quote

from rest_framework import filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


DEFAULT_PAGE_SIZE = 15
DEFAULT_SEED = 1234


class OptionalPageNumberPagination(PageNumberPagination):
    """
    Optional pagination that does not paginate the response
    if the user does not specify it.
    """

    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = "page_size"

    def paginate_queryset(self, queryset, request, view=None):
        if self.page_query_param not in request.query_params:
            return None

        return super().paginate_queryset(queryset, request, view)


class RandomPageNumberPagination(OptionalPageNumberPagination):
    """
    Custom pagination that supports randomly sorting objects with pagination.
    Must be used with the associated ordering filter.
    """

    def paginate_queryset(self, queryset, request, view=None):
        if "random" in request.query_params.get("ordering", "").split(","):
            rng = random.Random(request.GET.get("seed", DEFAULT_SEED))
            results = list(queryset)
            rng.shuffle(results)

            self._random_count = getattr(request, "_original_item_count", None)
            if self._random_count is None:
                self._random_count = queryset.model.objects.count()
            else:
                del request._original_item_count

            page = int(request.GET.get("page", 1))
            page_size = int(request.GET.get("page_size", DEFAULT_PAGE_SIZE))

            if (page - 1) * page_size >= self._random_count:
                self._random_next_page = None
            else:
                new_params = request.GET.dict()
                new_params["page"] = str(page + 1)
                self._random_next_page = "{}?{}".format(
                    request.build_absolute_uri(request.path),
                    "&".join(
                        ["{}={}".format(k, quote(v)) for k, v in new_params.items()]
                    ),
                )
            return results

        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        if hasattr(self, "_random_next_page"):
            return Response(
                OrderedDict(
                    [
                        ("count", self._random_count),
                        ("next", self._random_next_page),
                        ("results", data),
                    ]
                )
            )

        return super().get_paginated_response(data)


class RandomOrderingFilter(filters.OrderingFilter):
    """
    Custom ordering filter that supports random pagination.
    Must be used with the associated pagination class.
    """

    def filter_queryset(self, request, queryset, view):
        new_queryset = super().filter_queryset(request, queryset, view)
        ordering = request.GET.get("ordering", "").split(",")

        # handle random ordering
        if "random" in ordering:
            page = int(request.GET.get("page", 1)) - 1
            page_size = int(request.GET.get("page_size", DEFAULT_PAGE_SIZE))
            rng = random.Random(request.GET.get("seed", DEFAULT_SEED))

            all_ids = list(new_queryset.order_by("id").values_list("id", flat=True))
            rng.shuffle(all_ids)

            start_index = page * page_size
            end_index = (page + 1) * page_size
            page_ids = all_ids[start_index:end_index]

            request._original_item_count = new_queryset.count()

            return new_queryset.filter(id__in=page_ids)

        return new_queryset
