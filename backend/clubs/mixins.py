from collections import OrderedDict

import dateutil.parser
from django.core.exceptions import (
    FieldDoesNotExist,
    MultipleObjectsReturned,
    ObjectDoesNotExist,
)
from django.db.models import BooleanField, DateTimeField, ManyToManyField
from django.db.models.fields.reverse_related import ManyToOneRel
from django.utils import timezone
from rest_framework import serializers
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.utils.serializer_helpers import ReturnDict, ReturnList


class ManyToManySaveMixin(object):
    """
    Mixin for serializers that saves ManyToMany fields by looking up related models.

    Create a new attribute called "save_related_fields" in the Meta class that
    represents the ManyToMany fields that should have save behavior.

    You can also specify a dictionary instead of a string, with the following fields:
        - field (string, required): The field to implement saving behavior on.
        - mode (bool):
            - If set to create, create the related model if it does not exist.
            - Otherwise, raise an exception if the user links to a nonexistent object.
    """

    def _lookup_item(self, model, field_name, item, mode=None):
        if item is None:
            return

        if mode == "create":
            obj, _ = model.objects.get_or_create(**item)
            return obj
        else:
            try:
                return model.objects.get(**item)
            except ObjectDoesNotExist:
                raise serializers.ValidationError(
                    {
                        field_name: [
                            "The object with these values does not exist: {}".format(
                                item
                            )
                        ]
                    },
                    code="invalid",
                )
            except MultipleObjectsReturned:
                raise serializers.ValidationError(
                    {
                        field_name: [
                            "Multiple objects exist with these values: {}".format(item)
                        ]
                    }
                )

    def save(self):
        m2m_to_save = getattr(self.Meta, "save_related_fields", [])

        # turn all entries into dict configs
        for i, m2m in enumerate(m2m_to_save):
            if not isinstance(m2m, dict):
                m2m_to_save[i] = {"field": m2m, "mode": None}

        # ignore fields that aren't specified
        ignore_fields = set()

        # remove m2m from validated data and save
        m2m_lists = {}
        for m2m in m2m_to_save:
            mode = m2m.get("mode", None)
            field_name = m2m["field"]

            field = self.fields[field_name]
            if isinstance(field, serializers.ListSerializer):
                m2m["many"] = True
                model = field.child.Meta.model
                m2m_lists[field_name] = []
                items = self.validated_data.pop(field_name, None)
                if items is None:
                    ignore_fields.add(field_name)
                    continue
                for item in items:
                    # skip none items
                    if item is None:
                        continue
                    result = self._lookup_item(model, field_name, item, mode)
                    if result is not None:
                        m2m_lists[field_name].append(result)
            else:
                m2m["many"] = False
                if hasattr(field, "Meta"):
                    model = field.Meta.model
                    item = self.validated_data.pop(field_name, None)

                    # raise validation error if field is required and item is none
                    if item is None and getattr(field, "required", True):
                        raise serializers.ValidationError(
                            {field_name: "This field is required."}
                        )

                    if item is not None:
                        result = self._lookup_item(model, field_name, item, mode)
                        if result is not None:
                            m2m_lists[field_name] = result
                        else:
                            ignore_fields.add(field_name)
                    else:
                        ignore_fields.add(field_name)
                else:
                    ignore_fields.add(field_name)

        obj = super(ManyToManySaveMixin, self).save()

        # link models to this model
        updates = []
        for m2m in m2m_to_save:
            field = m2m["field"]
            if field in ignore_fields:
                continue
            value = m2m_lists[field]
            if m2m["many"]:
                getattr(obj, field).set(value)
            else:
                setattr(obj, field, value)
                updates.append(field)

        if updates:
            obj.save(update_fields=updates)

        return obj


class XLSXFormatterMixin(object):
    """
    Mixin for views that formats xlsx output to a more readable format.
    Will only apply to views that implement a get_serializer_class method.

    You can insert "format_{field}_for_spreadsheet" methods in your serializer class
    that accept a single argument (the cell value) and returns the formatted value.

    Changes the default filename to include the date and time of creation.
    Changes the default column header to be bolded.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._column_cache = {}

    def get_xlsx_column_name(self, key):
        """
        Format the text displayed in the column header.
        Cache the column name if obtained from the serializer,
        as this method is called once for every cell.
        """
        if key in self._column_cache:
            return self._column_cache[key]
        serializer_class = self.get_serializer_class()
        val = None
        if hasattr(serializer_class, "get_xlsx_column_name"):
            val = serializer_class.get_xlsx_column_name(key)
        if val is None:
            val = key
        self._column_cache[key] = val
        return val

    def _many_to_many_individual_formatter(self, value):
        """
        Take in an individual object generated by a ManyToMany serializer and format it.
        If there is a single field in the dictionary, return that. Otherwise, return the
        first field that is not the id field.
        """
        if isinstance(value, dict):
            if len(value) == 1:
                return self._many_to_many_individual_formatter(next(value.values()))
            elif len(value) > 1:
                return self._many_to_many_individual_formatter(
                    next(v for k, v in value.items() if not k == "id")
                )
        return str(value)

    def _many_to_many_formatter(self, value):
        """
        Take in output generated by a ManyToMany serializer and format it.
        """
        if isinstance(value, list):
            return ", ".join(self._many_to_many_individual_formatter(v) for v in value)
        return value

    def _lookup_field_formatter(self, field):
        """
        Return a method that can format the field given the name of the field.
        Since the formatting of each cell in a column should be uniform, we can
        reuse the function for every cell in a column. Therefore, this function
        returns a function that can be cached for use with other cells.
        """
        # if there is no model serializer, don't format
        try:
            serializer = self.get_serializer_class()
        except AttributeError:
            return lambda x: x

        if not isinstance(serializer, serializers.SerializerMetaclass):
            return lambda x: x

        # allow serializer to override field formatting
        key = "format_{}_for_spreadsheet".format(field)
        if hasattr(serializer, key):
            return lambda x: getattr(serializer, key)(serializer, x)

        # lookup column type from serializer
        if field in serializer._declared_fields:
            serializer_field_object = serializer._declared_fields[field]
            if isinstance(serializer_field_object, serializers.SerializerMethodField):
                return lambda x: x

            # handle edge case with source
            if serializer_field_object not in (None, "*", ""):
                source_lookup = serializer_field_object.source
            else:
                source_lookup = None
        else:
            serializer_field_object = None
            source_lookup = None

        # lookup column type from model
        model = serializer.Meta.model
        if source_lookup is None:
            try:
                field_object = model._meta.get_field(field)
            except FieldDoesNotExist:
                # if model field lookup fails, rely on serializer field
                if serializer_field_object is not None and isinstance(
                    serializer_field_object, serializers.BooleanField
                ):
                    return lambda x: str(bool(x))
                return lambda x: x
        else:
            # we need to do a recursive lookup for source fields
            source_lookup = source_lookup.strip().split(".")
            for lookup in source_lookup[:-1]:
                field_object = model._meta.get_field(lookup)
                model = field_object.related_model

            # handle edge case where the _set suffix may not be included
            try:
                field_object = model._meta.get_field(source_lookup[-1])
            except FieldDoesNotExist as e:
                if source_lookup[-1].endswith("_set"):
                    field_object = model._meta.get_field(source_lookup[-1][:-4])
                else:
                    raise e
        # format based on field type
        if isinstance(field_object, (ManyToManyField, ManyToOneRel)):
            return self._many_to_many_formatter
        elif isinstance(field_object, BooleanField):
            return lambda x: str(bool(x))
        elif isinstance(field_object, DateTimeField):
            return (
                lambda x: dateutil.parser.parse(x).strftime("%m/%d/%Y %H:%M:%S %p")
                if x is not None
                else None
            )
        elif hasattr(field_object, "choices") and field_object.choices is not None:
            choices = dict(field_object.choices)
            return lambda x: choices.get(x, "Unknown")
        else:
            return lambda x: x

    def _format_cell(self, key, value):
        """
        Format a cell in the exported Excel spreadsheet given (column name, cell value).
        Returns (new column name, new cell value). Looks up formatting information using
        the modal obtained from the serializer.
        """
        new_key = self.get_xlsx_column_name(key)
        # cache column formatter by column name
        if key not in self._field_dict:
            self._field_dict[key] = self._lookup_field_formatter(key)
        return (new_key, self._field_dict[key](value))

    def get_filename(self):
        """
        Returns a custom filename for the spreadsheet.
        """
        return "report-{}.xlsx".format(timezone.now().strftime("%Y%m%d-%H%M"))

    def get_column_header(self):
        """
        Return the style of the column header for an Excel export.
        By default, bold the column header.
        """
        return {"style": {"font": {"bold": True}}}

    def finalize_response(self, request, response, *args, **kwargs):
        """
        If the requested format is a spreadsheet, format the cell values before
        rendering the spreadsheet. Also perform the functionality of XLSXFileMixin.
        """
        response = super(XLSXFormatterMixin, self).finalize_response(
            request, response, *args, **kwargs
        )
        # If this is a spreadsheet response, intercept and format.
        if (
            isinstance(response, Response)
            and response.accepted_renderer.format == "xlsx"
        ):
            self._field_dict = {}
            if isinstance(response.data, ReturnList):
                new_data = [
                    OrderedDict([self._format_cell(k, v) for k, v in row.items()])
                    for row in response.data
                ]
                response.data = ReturnList(
                    new_data, serializer=response.data.serializer
                )
            elif isinstance(response.data, ReturnDict):
                new_data = OrderedDict(
                    [self._format_cell(k, v) for k, v in response.data.items()]
                )
                response.data = ReturnDict(
                    new_data, serializer=response.data.serializer
                )
            elif isinstance(response.data, dict):
                # If this is not a proper spreadsheet response
                # (ex: object does not exist),
                # then return the response in JSON format.
                response = Response(response.data)
                response.accepted_renderer = JSONRenderer()
                response.accepted_media_type = "application/json"
                response.renderer_context = {}
                return response

            response["Content-Disposition"] = "attachment; filename={}".format(
                self.get_filename()
            )
        return response
