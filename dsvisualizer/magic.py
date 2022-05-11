import itertools
from inspect import stack

from .operations import *
from .widget import OperationsWidget

counter = itertools.count()

_logger = None


def get_logger():
    global _logger
    return _logger


def set_logger(logger: "Logger"):
    global _logger
    _logger = logger


class Logger:
    def __init__(self):
        self.operations = []
        self.sources = []

    def log(self, op: LinkedListOperation, src: str):
        self.operations.append(op)
        self.sources.append(src)

    def visualize(self):
        w = OperationsWidget()
        w.operations = self.operations
        return w

    def __enter__(self):
        self._saved_logger = get_logger()
        set_logger(self)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        set_logger(self._saved_logger)


_logger = Logger()


def reset_logger():
    set_logger(Logger())


class Uninitialized:
    def __repr__(self) -> str:
        return "uninitialized"


UNINITIALIZED = Uninitialized()


def get_code(depth=0):
    return stack()[2 + depth].code_context[0]


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
