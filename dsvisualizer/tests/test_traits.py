#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jose Romero.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..traits import (
    GetValue,
    Init,
    SetValue,
    GetNext,
    SetNext,
    serialize_operation,
    deserialize_operation,
    LinkedListOperation,
)


def test_serialization_and_deserialization():
    ops = [
        Init(0, 10, None),
        Init(1, 11, 0),
        Init(2, 12, 1),
        GetValue(2),
        SetValue(2, 13),
        GetNext(2),
        SetNext(2, 1),
    ]
    serialized = [serialize_operation(op) for op in ops]
    deserialized = [deserialize_operation(op) for op in serialized]
    assert ops == deserialized
