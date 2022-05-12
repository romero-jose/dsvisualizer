#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jose Romero.
# Distributed under the terms of the Modified BSD License.

import pytest

from dsvisualizer.operations import Operation, Operations

from dsvisualizer.traits import (
    GetValue,
    Init,
    SetValue,
    GetNext,
    SetNext,
    deserialize_operations,
    serialize_operations,
    Metadata,
)


def test_serialization_and_deserialization():
    operations = Operations(
        operations=[
            Operation(Init(0, 10, None), Metadata(animate=False, source="n1 = Node(10)")),
            Operation(Init(1, 11, 0), Metadata(animate=False, source="n2 = Node(11, n1)")),
            Operation(Init(2, 12, 1), Metadata(animate=False, source="n3 = Node(12, n2)")),
            Operation(GetValue(2), Metadata(animate=True, source="v = n3.value")),
            Operation(SetValue(2, 13), Metadata(animate=True, source="n3.value = 13")),
            Operation(GetNext(2), Metadata(animate=True, source="next = n3.next")),
            Operation(SetNext(2, 1), Metadata(animate=False, source="n3.next = n2")),
        ]
    )
    serialized = serialize_operations(operations)
    deserialized = deserialize_operations(serialized)
    assert operations == deserialized
    assert serialized == serialize_operations(deserialized)
