from dataclasses import dataclass, field
from typing import Any, Union, Tuple


@dataclass(frozen=True)
class Init:
    operation: str = field(init=False, repr=False, default="init")
    id: int
    value: Any
    next: Union[int, "Init", None]


@dataclass(frozen=True)
class SetValue:
    operation: str = field(init=False, repr=False, default="set_value")
    id: int
    value: Any


@dataclass(frozen=True)
class GetValue:
    operation: str = field(init=False, repr=False, default="get_value")
    id: int


@dataclass(frozen=True)
class SetNext:
    operation: str = field(init=False, repr=False, default="set_next")
    id: int
    next: Union[int, None]


@dataclass(frozen=True)
class GetNext:
    operation: str = field(init=False, repr=False, default="get_next")
    id: int


@dataclass(frozen=True)
class Metadata:
    animate: bool
    source: str


LinkedListOperation = Union[Init, SetValue, GetValue, SetNext, GetNext]


@dataclass(frozen=True)
class Operation:
    operation: LinkedListOperation
    metadata: Metadata


@dataclass(frozen=True)
class Operations:
    operations: list[Operation] = field(default_factory=list)
