import itertools
from inspect import stack

from .operations import *
from .widget import OperationsWidget

counter = itertools.count()


class Logger:
    def __init__(self):
        self.operations = []
        self.sources = []

    def log(self, op: LinkedListOperation, src: str):
        self.operations.append(op)
        self.sources.append(src)


default_logger = Logger()


class Uninitialized:
    def __repr__(self) -> str:
        return "uninitialized"


UNINITIALIZED = Uninitialized()


def get_code(depth=0):
    return stack()[2 + depth].code_context[0]


class LinkedListMixin:
    _value = UNINITIALIZED
    _next = UNINITIALIZED
    _logger = default_logger

    def __new__(cls, *args, **kwargs):
        obj = super(LinkedListMixin, cls).__new__(cls)
        obj._id = next(counter)
        # TODO: Replace with a more robust method for obtaining the args
        obj._logger.log(
            Init(obj._id, args[0], args[1]._id if args[1] else None), get_code()
        )
        return obj

    def __repr__(self):
        return f"({self._get_class_name()} {self._value} {self._next})"

    def _get_class_name(self):
        return self.__class__.__name__

    def visualize(self):
        w = OperationsWidget()
        w.operations = self._logger.operations
        return w


class ValueField:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj: LinkedListMixin, objtype=None):
        obj._logger.log(GetValue(obj._id), get_code())
        return obj._value

    def __set__(self, obj: LinkedListMixin, value):
        if obj._value != UNINITIALIZED:
            obj._logger.log(SetValue(obj._id, value), get_code())
        obj._value = value


class NextField:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj: LinkedListMixin, objtype=None):
        obj._logger.log(GetNext(obj._id), get_code())
        return obj._next

    def __set__(self, obj, next):
        if obj._next != UNINITIALIZED:
            obj._logger.log(SetNext(obj._id, next._id if next else None), get_code())
        obj._next = next
