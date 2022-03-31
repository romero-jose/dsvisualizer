#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jose Romero.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..widget import OperationWidget


def test_operation_creation_blank():
    w = OperationWidget()
    assert w.operations == None
