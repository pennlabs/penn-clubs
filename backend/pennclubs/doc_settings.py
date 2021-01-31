import re

import jsonref
import yaml
from django.conf import settings
from rest_framework.renderers import JSONOpenAPIRenderer
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.utils.formatting import dedent


API_DESCRIPTION = """
This is the documentation for the backend that powers the Penn Clubs and Hub@Penn
websites. The backend is written with [Django](https://www.djangoproject.com/) and the
[Django Rest Framework](https://www.django-rest-framework.org/).

This documentation is intended to help frontend developers and external
developers know which parameters they should be passing to various endpoints.
There are test cases that will fail if the documentation on the API
falls beneath a certain threshold.
"""


def merge_metadata(original, changes):
    """
    Merge together two metadata dictionaries. By default, overwrite any existing values.
    If the object is a list, concatenate the original and new list instead.
    If the object is a dict with the $extend property set to true, merge the two
    dictionaries instead of overwriting. This only works if both parent paths exist up
    to that point.
    """
    if isinstance(changes, dict):
        if isinstance(original, dict):
            is_extend = changes.pop("$extend", False)
            output = original
            for k, v in changes.items():
                output[k] = merge_metadata(original.get(k), v)
            if not is_extend:
                for k in list(output.keys()):
                    if k not in changes:
                        del output[k]
            return output
        return {k: merge_metadata(None, v) for k, v in changes.items()}
    elif isinstance(changes, list):
        if isinstance(original, list):
            return original + changes
    return changes


class CustomAutoSchema(AutoSchema):
    """
    A custom schema to parse documentation from the docstrings of the view,
    if applicable.
    """

    META_REGEX = re.compile(r"^\s*---\s*$(.*?)^\s*---", re.MULTILINE | re.DOTALL)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @classmethod
    def parse_docstring(cls, docstring):
        docstring = dedent(docstring)
        match = cls.META_REGEX.search(docstring)
        if match is not None:
            meta = yaml.safe_load(match.group(1))
            docstring = cls.META_REGEX.sub("", docstring).strip()
        else:
            meta = None
        return docstring, meta

    def get_operation(self, path, method):
        output = super().get_operation(path, method)
        method_name = getattr(self.view, "action", method.lower())
        docstring = getattr(self.view, method_name, None).__doc__

        # operation id override
        if hasattr(self.view, "get_operation_id"):
            output["operationId"] = (
                self.view.get_operation_id(
                    action=method_name, method=method, operId=output["operationId"]
                )
                or output["operationId"]
            )

        # parse yaml metadata from docstring
        if docstring:
            docstring, meta = self.parse_docstring(docstring)
            if meta:
                # merge together metadata
                meta["$extend"] = True
                output = merge_metadata(output, meta)
            if docstring:
                output["description"] = docstring
        return output


class CustomJSONOpenAPIRenderer(JSONOpenAPIRenderer):
    """
    A custom renderer to add API level metadata to the documentation.
    """

    def render(self, *args, **kwargs):
        output = super().render(*args, **kwargs)
        data = jsonref.loads(output)

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
                    r"(?<=[a-z])([A-Z])", r" \1", oper_id
                ).title()
                data["paths"][path][key]["tags"] = [category]

        # order tag groups
        categories = list(sorted(categories))
        data["tags"] = [{"name": cat, "description": ""} for cat in categories]
        data["x-tagGroups"] = [
            {"name": settings.BRANDING_SITE_NAME, "tags": categories}
        ]

        return jsonref.dumps(data, indent=4 if settings.DEBUG else None).encode("utf-8")
