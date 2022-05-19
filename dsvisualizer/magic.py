from functools import wraps
import itertools
from inspect import stack
from types import FunctionType

from dsvisualizer.operations import *
from dsvisualizer.widget import OperationsWidget

counter = itertools.count()

_logger = None


def get_logger():
    global _logger
    return _logger


def set_logger(logger: "Logger"):
    global _logger
    _logger = logger


class Logger:
    def __init__(self, logger: "Logger" = None):
        self.visualized_upto = 0
        if logger:
            self.operations = logger.operations
        else:
            self.operations = Operations()

    def log(self, op: LinkedListOperation, source: str):
        self.operations.operations.append(
            Operation(operation=op, metadata=Metadata(animate=True, source=source))
        )

    def visualize(self):
        # Only animate operations that haven't been animated yet
        operations = Operations(
            operations=[
                Operation(
                    operation=o.operation,
                    metadata=Metadata(
                        animate=i >= self.visualized_upto, source=o.metadata.source
                    ),
                )
                for i, o in enumerate(self.operations.operations)
            ]
        )
        w = OperationsWidget()
        w.operations = operations
        self.visualized_upto = len(self.operations.operations)
        return w

    def copy(self):
        return Logger(self)

    def __enter__(self):
        self._saved_logger = get_logger()
        set_logger(self)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        set_logger(self._saved_logger)


def reset_logger():
    set_logger(Logger())


_logger = Logger()


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
