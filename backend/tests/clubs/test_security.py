import ast
import inspect
from unittest.mock import Mock

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from django.test.client import RequestFactory
from rest_framework import permissions, viewsets

from clubs import permissions as club_permissions
from clubs import views


class SecurityTestCase(TestCase):
    """
    Tests to catch common security issues before they become a problem.
    """

    def test_check_permissions_update(self):
        """
        A check to ensure that update and delete operations for every permission should always
        require a logged in user. This check should almost never be bypassed or whitelisted.
        """
        factory = RequestFactory()
        request = factory.post("/test")
        request.user = AnonymousUser()

        for name, obj in inspect.getmembers(club_permissions, inspect.isclass):
            if not issubclass(obj, permissions.BasePermission):
                continue

            perm = obj()
            for action in {"update", "partial_update", "destroy"}:
                view = Mock()
                view.action = action
                view.kwargs = {}
                self.assertFalse(
                    perm.has_permission(request, view),
                    f"The permission {name} ({obj}) allows edit and delete access for anonymous "
                    f"users, but it really should not do this. In particular, {action} is allowed.",
                )

    def test_check_permissions_set(self):
        """
        A check to ensure that permission_classes is set to something reasonable for each
        ModelViewSet in the views file.

        If the permission_classes field is not set, you must explicitly acknowledge what you're
        doing in the whitelist below.

        Does your object contain any kind of user information? If so, you shouldn't be putting it
        in the whitelist below.
        """
        whitelist = set()

        for name, obj in inspect.getmembers(views, inspect.isclass):
            if issubclass(obj, viewsets.ModelViewSet):
                if permissions.AllowAny in obj.permission_classes or not obj.permission_classes:
                    if name in whitelist:
                        continue

                    self.fail(
                        f"Class {name} has the permission classes to allow anyone to access this "
                        "model view set. Are you sure you want to do this? If you are sure about "
                        f"this change, add {name} to the whitelist in this test case."
                    )

    def test_check_detail_level_permissions(self):
        """
        A check to ensure that all @action(detail=True) methods call self.check_object_permissions
        somewhere in the method body.

        Django Rest Framework does NOT run the object level permissions checking for detail views.
        You must manually run them yourself with "self.check_object_permissions(request, object)".

        Not doing this will most likely result in a security issue.
        """

        def is_action_detail_decorator(node):
            """
            Check if a Python AST node is a @action(detail=True) decorator.
            """
            if not isinstance(node, ast.Call):
                return False

            if not hasattr(node.func, "id"):
                return False

            if not node.func.id == "action":
                return False

            if not any(
                keyword.arg == "detail" and keyword.value.value for keyword in node.keywords
            ):
                return False

            return True

        # Don't put your function here unless it never returns any private information.
        whitelist = {("ClubViewSet", "qr")}

        for name, obj in inspect.getmembers(views, inspect.isclass):
            # loop through all model view set classes
            if issubclass(obj, viewsets.ModelViewSet):
                source = inspect.getsource(obj)
                tree = ast.parse(source)
                cls = next(ast.iter_child_nodes(tree))
                # loop through all methods in class
                for node in ast.iter_child_nodes(cls):
                    # if class is function that uses @action
                    if isinstance(node, ast.FunctionDef):
                        if not node.decorator_list:
                            continue

                        if not any(
                            is_action_detail_decorator(decorator)
                            for decorator in node.decorator_list
                        ):
                            continue

                        # check to ensure check_object_permissions called
                        for child in ast.walk(node):
                            if isinstance(child, ast.Call) and isinstance(
                                child.func, ast.Attribute
                            ):
                                if not hasattr(child.func.value, "id"):
                                    continue
                                if not child.func.value.id == "self":
                                    continue
                                if not child.func.attr == "check_object_permissions":
                                    continue
                                break
                        else:
                            if (name, node.name) in whitelist:
                                continue

                            self.fail(
                                f"Function {node.name} in class {name} has an @action(detail=True) "
                                "decorator but does not call self.check_object_permissions "
                                "anywhere in the method body.\n\n"
                                "*** This is most likely a security issue! ***\n"
                                "Do not whitelist this method or disable this test unless you know "
                                "exactly what you are trying to do."
                            )
