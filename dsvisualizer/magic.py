from functools import wraps
import itertools
from inspect import FrameInfo, stack
import linecache
from types import FunctionType

from dsvisualizer.widget import OperationsWidget
from dsvisualizer.operations import Init, GetNext, GetValue, SetNext, SetValue
from dsvisualizer.logger import Logger, get_logger

counter = itertools.count()


class Uninitialized:
    def __repr__(self) -> str:
        return "uninitialized"


UNINITIALIZED = Uninitialized()


def fmt_stack_entry(frame: FrameInfo, lines_before=2, lines_after=2):
    filename = frame.filename
    lineno = frame.lineno

    lines = linecache.getlines(filename)
    start = max(0, lineno - lines_before)
    stop = min(len(lines), lineno + lines_after)

    digits = len(str(stop))

    formatted_lines = [
        f"{'> ' if n == lineno else '  '}{n:{digits}d} {l}"
        for l, n in zip(itertools.islice(lines, start, stop), range(start + 1, stop + 1))
    ]

    return formatted_lines


def get_code(depth=0):
    s = stack()
    callee = s[2 + depth]
    formatted = fmt_stack_entry(callee)
    if s[3 + depth].function == "wrapped":
        caller = s[4 + depth]
        return [caller.code_context[0]] + formatted
    else:
        return formatted


class LinkedListMixin:
    _value = UNINITIALIZED
    _next = UNINITIALIZED

    def __new__(cls, *args, **kwargs):
        obj = super(LinkedListMixin, cls).__new__(cls)
        obj._id = next(counter)
        # TODO: Replace with a more robust method for obtaining the args
        get_logger().log(
            Init(obj._id, args[0], args[1]._id if args[1] else None), get_code()
        )
        return obj

    def __repr__(self):
        return f"({self._get_class_name()} {self._value} {self._next})"

    def _get_class_name(self):
        return self.__class__.__name__

    def visualize(self):
        w = OperationsWidget()
        w.operations = get_logger().operations
        return w


class ValueField:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj: LinkedListMixin, objtype=None):
        get_logger().log(GetValue(obj._id), get_code())
        return obj._value

    def __set__(self, obj: LinkedListMixin, value):
        if obj._value != UNINITIALIZED:
            get_logger().log(SetValue(obj._id, value), get_code())
        obj._value = value


class NextField:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj: LinkedListMixin, objtype=None):
        get_logger().log(GetNext(obj._id), get_code())
        return obj._next

    def __set__(self, obj, next):
        if obj._next != UNINITIALIZED:
            get_logger().log(SetNext(obj._id, next._id if next else None), get_code())
        obj._next = next


def wrapper(method):
    @wraps(method)
    def wrapped(*args, **kwargs):
        with args[0]._logger:
            res = method(*args, **kwargs)
        return res

    return wrapped


class ContainerBase(type):
    """This metaclass wraps classes that contain linked list nodes. It
    makes sure that the methods of the class always use the logger
    associated to that class."""

    def __new__(mcs, name, bases, namespace):
        new_namespace = {
            name: wrapper(value)
            if isinstance(value, FunctionType) and name != "__init__"
            else value
            for name, value in namespace.items()
        }
        return super().__new__(mcs, name, bases, new_namespace)


class Container(metaclass=ContainerBase):
    def __init__(self):
        self._logger = Logger()

    def visualize(self):
        return self._logger.visualize()


def container():
    """
    This decorator declares the class as a linked list container so it can be visualized.

    Example:

    >>> @visualize()
        class List:
            def __init__(self):
                self.head = None
            def append(self, v):
                if self.head is None:
                    self.head = Node(v, None)
                    return
                n = self.head
                while n.next is not None:
                    n = n.next
                n.next = Node(v, None)
    """

    def decorator(cls):
        init = cls.__init__

        def __init__(self):
            self._logger = Logger()
            init(self)

        def visualize(self):
            return self._logger.visualize()

        for name in dir(cls):
            value = getattr(cls, name)
            if isinstance(value, FunctionType) and name != "__init__":
                setattr(cls, name, wrapper(value))

        setattr(cls, "__init__", __init__)
        setattr(cls, "visualize", visualize)
        return cls

    return decorator


def node(value_field: str = "value", next_field: str = "next"):
    """
    This decorator declares the class as a linked list node so it can be visualized.

    `value_field`: Name of the field that holds the value of the node.

    `next_field`: Name of the field that holds the next node in the linked list.

    Example:

    >>> @node('head', 'tail')
        class Node:
            def __init__(self, head, tail=None):
                self.head = head
                self.tail = tail
    """

    def decorator(cls):
        init = cls.__init__

        setattr(cls, value_field, ValueField())
        setattr(cls, next_field, NextField())

        def __init__(self, *args, **kwargs):
            self._next = UNINITIALIZED
            self._value = UNINITIALIZED
            self._id = next(counter)
            init(self, *args, **kwargs)

            if value_field in kwargs:
                value = kwargs[value_field]
                n = kwargs.get(next_field, None)._id
            else:
                value = args[0]
                n = args[1]._id if args[1] else None

            get_logger().log(Init(self._id, value, n), get_code())

        def __repr__(self):
            return f"({self._get_class_name()} {self._value} {self._next})"

        def _get_class_name(self):
            return self.__class__.__name__

        def visualize(self):
            w = OperationsWidget()
            w.operations = get_logger().operations
            return w

        setattr(cls, "__init__", __init__)
        setattr(cls, "__repr__", __repr__)
        setattr(cls, "_get_class_name", _get_class_name)
        setattr(cls, "visualize", visualize)

        return cls

    return decorator
