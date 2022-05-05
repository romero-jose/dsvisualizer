from dataclasses import dataclass
from typing import Any, Union


@dataclass(frozen=True)
class Init:
    id: int
    value: Any
    next: Union[int, 'Init', None]


@dataclass(frozen=True)
class SetValue:
    id: int
    value: Any


@dataclass(frozen=True)
class GetValue:
    id: int


@dataclass(frozen=True)
class SetNext:
    id: int
    next: Union[int, None]


@dataclass(frozen=True)
class GetNext:
    id: int


LinkedListOperation = Union[Init, SetValue, GetValue, SetNext, GetNext]
