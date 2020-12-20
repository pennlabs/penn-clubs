import ast

import yaml
from django.test import Client, TestCase
from django.urls import reverse

from pennclubs.doc_settings import CustomAutoSchema

from .test_security import all_viewset_actions


class DocumentationTestCase(TestCase):
    """
    Test cases related to ensuring that we have an appropriate amount of backend documentation.
    """

    def setUp(self):
        self.client = Client()

    def test_action_parameter_response(self):
        """
        Ensure that all actions on viewsets have proper parameters and responses.
        """
        # don't add your action to the whitelist unless it returns what the base ModelViewSet
        # returns and does not accept any additional parameters
        whitelist = set(
            [
                ("ClubViewSet", "constitutions"),
                ("ClubViewSet", "directory"),
                ("ClubViewSet", "notes_about"),
                ("ClubViewSet", "subscription"),
                ("EventViewSet", "owned"),
            ]
        )

        all_cases = set()
        failed_cases = []
        for name, obj, node in all_viewset_actions():
            docs = ast.get_docstring(node)
            desc, meta = CustomAutoSchema.parse_docstring(docs)
            all_cases.add((name, node.name))
            if not desc:
                failed_cases.append((name, node.name, "missing description"))
            elif not meta:
                failed_cases.append((name, node.name, "missing"))
            elif "requestBody" not in meta:
                # if not a GET request, the body should be specified
                if any(
                    kw.arg == "methods"
                    and "get" not in [elt.value.lower() for elt in kw.value.elts]
                    for n in node.decorator_list
                    for kw in n.keywords
                ):
                    failed_cases.append((name, node.name, "missing requestBody"))
            elif "responses" not in meta:
                failed_cases.append((name, node.name, "missing responses"))

        failed_cases = [c for c in failed_cases if (c[0], c[1]) not in whitelist]

        if failed_cases:
            failed_cases_str = "\n".join(
                f"\t- {cls_name} -> {name} ({status})" for cls_name, name, status in failed_cases
            )
            self.fail(
                "Found one or more action methods on viewsets that do not have YAML "
                "documentation specified in the docstring. \n"
                "It is very rare that the action will have the exact same parameters and "
                "return format as the base ModelViewSet. \n"
                "DRF cannot detect the parameters and response format for you in these cases, "
                "you must manually specify them."
                "\n\n"
                f"{failed_cases_str}"
                "\n\n"
                "To do this, add a YAML OpenAPI string to your docstring surrounded by two "
                "lines with '---' as their only contents. \n"
                "You can check out existing examples throughout the codebase "
                "or in the /api/openapi endpoint."
            )

        if whitelist - all_cases:
            missing_str = "\n".join(
                f"\t- {cls_name} -> {name}" for cls_name, name in whitelist - good_cases
            )
            self.fail(
                "Found one or more whitelist entries that do not exist in the views anymore. "
                "Remove these entries in order to keep the codebase clean."
                "\n\n"
                f"{missing_str}"
            )

    def test_openapi_docs(self):
        """
        Ensure that openapi schema can be generated correctly.
        """
        # test unauthenticated schema
        resp = self.client.get(reverse("openapi-schema"))
        self.assertIn(resp.status_code, [200], resp.content)

        # test normal user schema
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.get(reverse("openapi-schema"))
        self.assertIn(resp.status_code, [200], resp.content)

        # test superuser schema
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(reverse("openapi-schema"))
        self.assertIn(resp.status_code, [200], resp.content)

        # test to ensure schema is parsable
        docs = yaml.safe_load(resp.content)

        total_routes = 0
        missing_descriptions = []

        for path in docs["paths"]:
            for method in docs["paths"][path]:
                total_routes += 1
                description = docs["paths"][path][method]["description"]
                if not description:
                    missing_descriptions.append((path, method))

        # ensure that a certain percentage of the api is documented
        percent_missing = len(missing_descriptions) / total_routes
        required_percent = 0.75
        if (1 - percent_missing) < required_percent:
            formatted_missing = "\n".join("\t{1} {0}".format(*x) for x in missing_descriptions)
            self.fail(
                "Too many endpoints are missing API descriptions "
                f"({(1 - percent_missing):.2%} < minimum {required_percent:.2%}):\n\n"
                f"{formatted_missing}"
                f"\n\nThis is an automated test to ensure that at least {required_percent:.2%} of "
                "the Penn Clubs API is properly documented. \n"
                "If you are below this threshold, please add some descriptions to the new routes "
                "that you have added. \nYou can do this by adding a docstring to your ViewSet.",
            )
