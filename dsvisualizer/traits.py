from traitlets import TraitType
from typing import Any
from dsvisualizer.operations import Init, GetValue, SetValue, GetNext, SetNext, LinkedListOperation
from functools import reduce
from operator import iconcat


def serialize_operation(op: LinkedListOperation) -> list[dict[str, Any]]:
    if isinstance(op, Init):
        if op.next is None or isinstance(op.next, int):
            return [
                {
                    "operation": "init",
                    "id": op.id,
                    "value": op.value,
                    "next": op.next,
                }
            ]
        else:
            # Separate into parts
            first = serialize_operation(op.next)
            second = {
                "operation": "init",
                "id": op.id,
                "value": op.value,
                "next": first[-1]["id"],
            }
            return first + [second]
    elif isinstance(op, SetValue):
        return [
            {
                "operation": "set_value",
                "id": op.id,
                "value": op.value,
            }
        ]
    elif isinstance(op, GetValue):
        return [
            {
                "operation": "get_value",
                "id": op.id,
            }
        ]
    elif isinstance(op, SetNext):
        return [
            {
                "operation": "set_next",
                "id": op.id,
                "next": op.next,
            }
        ]
    elif isinstance(op, GetNext):
        return [
            {
                "operation": "get_next",
                "id": op.id,
            }
        ]


def deserialize_operation(obj: dict[str, Any]) -> LinkedListOperation:
    operation = obj["operation"]
    if operation == "init":
        return Init(id=obj["id"], value=obj["value"], next=obj["next"])
    elif operation == "get_value":
        return GetValue(id=obj["id"])
    elif operation == "set_value":
        return SetValue(id=obj["id"], value=obj["value"])
    elif operation == "get_next":
        return GetNext(id=obj["id"])
    elif operation == "set_next":
        return SetNext(id=obj["id"], next=obj["next"])


class OperationTrait(TraitType):
    klass = list
    default_value = []


def serialize_operations(ops):
    op_lists = (serialize_operation(op) for op in ops)
    return reduce(iconcat, op_lists, [])


def deserialize_operations(obj):
    return [deserialize_operations(o) for o in obj]


operation_serialization = {
    "from_json": lambda obj, _: deserialize_operations(obj),
    "to_json": lambda op, _: serialize_operations(op),
}
