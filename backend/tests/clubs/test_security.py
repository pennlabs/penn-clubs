import ast
import inspect
from unittest.mock import Mock

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from django.test.client import RequestFactory
from rest_framework import permissions, viewsets

from clubs import permissions as club_permissions
from clubs import views


def is_action_detail_decorator(node, is_detail):
    """
    Check if a Python AST node is a @action(detail=<is_detail>) decorator.
    If is_detail is None, then return all of the action decorators.
    """
    if not isinstance(node, ast.Call):
        return False

    if not hasattr(node.func, "id"):
        return False

    if not node.func.id == "action":
        return False

    if is_detail is not None:
        has_detail = any(
            keyword.arg == "detail" and keyword.value.value for keyword in node.keywords
        )
        if not has_detail == is_detail:
            return False

    return True


def all_viewset_actions(is_detail=None):
    """
    Return a tuple of (viewset name, viewset object, function ast) for each action
    function for each ModelViewSet defined in the views.py file.
    """
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
                        is_action_detail_decorator(decorator, is_detail)
                        for decorator in node.decorator_list
                    ):
                        continue

                    yield (name, obj, node)


class SecurityTestCase(TestCase):
    """
    Tests to catch common security issues before they become a problem.
    """

    def test_check_permissions_update(self):
        """
        A check to ensure that update and delete operations for every permission should
        always require a logged in user. This check should almost never be bypassed or
        allowlisted.
        """
        factory = RequestFactory()
        request = factory.post("/test")
        request.data = {}
        request.user = AnonymousUser()

        for name, obj in inspect.getmembers(club_permissions, inspect.isclass):
            if not issubclass(obj, permissions.BasePermission):
                continue

            perm = obj()
            for action in {"create", "update", "partial_update", "destroy"}:
                view = Mock()
                view.action = action
                view.kwargs = {}
                self.assertFalse(
                    perm.has_permission(request, view),
                    f"The permission {name} ({obj}) allows edit and delete access for "
                    f"anonymous users, but it *really* should never let this happen. "
                    f"In particular, {action} is allowed. "
                    f"To fix this, ensure that all permission classes deny {action} "
                    "access for anonymous (not logged in) users.",
                )

    def test_check_permissions_set(self):
        """
        A check to ensure that permission_classes is set to something reasonable for
        each ModelViewSet in the views file.

        If the permission_classes field is not set, you must explicitly acknowledge
        what you're doing in the allowlist below.

        Does your object contain any kind of user information? If so, you shouldn't be
        putting it in the allowlist below.
        """
        allowlist = {"ExternalMemberListViewSet", "ClubBoothsViewSet"}

        for name, obj in inspect.getmembers(views, inspect.isclass):
            if issubclass(obj, viewsets.ModelViewSet):
                if (
                    permissions.AllowAny in obj.permission_classes
                    or not obj.permission_classes
                ):
                    if name in allowlist:
                        continue

                    self.fail(
                        f"Class {name} has the permission classes to allow anyone to "
                        "access this model view set. Are you sure you want to do this? "
                        f"If you are sure about this change, add {name} to the "
                        "allowlist in this test case."
                    )

    def test_check_detail_level_permissions(self):
        """
        A check to ensure that all @action(detail=True) methods call
        self.check_object_permissions somewhere in the method body.

        Django Rest Framework does NOT run the object level permissions checking for
        detail views. You must manually run them yourself with
        "self.check_object_permissions(request, object)".

        Not doing this will most likely result in a security issue.
        """

        # Don't put your function here unless it never returns any private information.
        allowlist = {
            ("QuestionAnswerViewSet", "like"),
            ("QuestionAnswerViewSet", "unlike"),
        }

        for name, obj, node in all_viewset_actions(is_detail=True):
            # check to ensure check_object_permissions called
            check_object_permissions = False
            get_object = False

            for child in ast.walk(node):
                if isinstance(child, ast.Call) and isinstance(
                    child.func, ast.Attribute
                ):
                    if not hasattr(child.func.value, "id"):
                        continue
                    if not child.func.value.id == "self":
                        continue
                    if child.func.attr == "check_object_permissions":
                        check_object_permissions = True
                    if child.func.attr == "get_object":
                        get_object = True

            if get_object and check_object_permissions:
                self.fail(
                    f"Function {node.name} in class {name} has a duplicate check for "
                    "object permissions. You do not need to call "
                    "self.check_object_permissions(request, object) if you call "
                    "self.get_object()."
                )

            if not (get_object or check_object_permissions):
                if (name, node.name) in allowlist:
                    continue

                self.fail(
                    f"Function {node.name} in class {name} has an @action(detail=True) "
                    "decorator but does not call self.check_object_permissions "
                    "or self.get_object anywhere in the method body.\n\n"
                    "*** This is most likely a security issue! ***\n"
                    "Do not allowlist this method or disable this test unless you know "
                    "exactly what you are trying to do."
                )
