#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jose Romero.
# Distributed under the terms of the Modified BSD License.

import pytest
from dsvisualizer.magic import container, node

# from dsvisualizer.operations import Operation, Operations


def test_node():
    @node('head', 'tail')
    class Node:
        def __init__(self, head, tail):
            self.head = head
            self.tail = tail

    n = Node(1, None)

    @node(value_field='hd', next_field='tl')
    class N:
        def __init__(self, hd, tl) -> None:
            self.hd = hd
            self.tl = tl

    n1 = N(2, None)

    assert n1.hd == 2
    assert n1.tl is None

def test_container():
    @node('value', 'next')
    class Node:
        def __init__(self, value, next):
            self.value = value
            self.next = next

    @container()
    class List:
        def __init__(self):
            self.head = None

        def push(self, v):
            self.head = Node(v, self.head)

        def append(self, v):
            head = self.head
            if head is None:
                self.head = Node(v, None)
                return
            
            node = self.head
            while True:
                next = node.next
                if next is None:
                    break
                node = next
            node.next = Node(v, None)
    
    l = List()
    l.append(1)
    l.append(2)
    l.append(3)

    assert l.head.value == 1
    assert l.head.next.value == 2
