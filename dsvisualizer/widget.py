#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jose Romero.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode, List

from dsvisualizer.traits import (
    LinkedListOperation,
    OperationTrait,
    operation_serialization,
)
from ._frontend import module_name, module_version


class OperationWidget(DOMWidget):
    _model_name = Unicode("OperationModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("OperationView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    operations = OperationTrait().tag(sync=True, **operation_serialization)
