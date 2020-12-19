import json
import re

from django.conf import settings
from rest_framework.renderers import JSONOpenAPIRenderer


API_DESCRIPTION = """
This is the documentation for the backend that powers the Penn Clubs and Hub@Penn websites.
The backend is written with [Django](https://www.djangoproject.com/) and the
[Django Rest Framework](https://www.django-rest-framework.org/).

This documentation is intended to help frontend developers and external
developers know which parameters they should be passing to various endpoints.
There are test cases that will fail if the documentation on the API
falls beneath a certain threshold.
"""


class CustomJSONOpenAPIRenderer(JSONOpenAPIRenderer):
    def render(self, *args, **kwargs):
        output = super().render(*args, **kwargs)
        data = json.loads(output)

        # add api level metadata
        info = data.get("info", {})
        info.update(
            {
                "x-logo": {
                    "url": "https://i.imgur.com/tVsRNxJ.pngg",
                    "altText": "Penn Labs Logo",
                    "href": "https://pennlabs.org/",
                },
                "contact": {
                    "name": f"{settings.BRANDING_SITE_NAME} Support",
                    "email": re.search(r"<(.*)>", settings.FROM_EMAIL).group(1),
                },
                "description": API_DESCRIPTION.strip(),
            }
        )
        data["info"] = info

        # categorize api endpoints
        categories = set()
        for path in data["paths"]:
            category = re.match(r"/api/(.*?)/", path).group(1).replace("_", " ").title()
            categories.add(category)

            for key in data["paths"][path]:
                oper_id = data["paths"][path][key]["operationId"]
                data["paths"][path][key]["operationId"] = re.sub(
                    r"([A-Z])", r" \1", oper_id
                ).title()
                data["paths"][path][key]["tags"] = [category]

        # order tag groups
        categories = list(sorted(categories))
        data["tags"] = [{"name": cat, "description": ""} for cat in categories]
        data["x-tagGroups"] = [{"name": settings.BRANDING_SITE_NAME, "tags": categories}]

        return json.dumps(data, indent=4 if settings.DEBUG else None).encode("utf-8")
