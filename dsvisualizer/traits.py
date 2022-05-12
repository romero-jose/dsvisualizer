from traitlets import TraitType
from typing import Any
from dataclasses import asdict
from dsvisualizer.operations import (
    Init,
    GetValue,
    Metadata,
    Operation,
    Operations,
    SetValue,
    GetNext,
    SetNext,
    LinkedListOperation,
)


def serialize_op(obj: dict[str, Any]) -> LinkedListOperation:
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


def deserialize_operation(obj: dict[str, Any]) -> Operation:
    return Operation(
        operation=serialize_op(obj["operation"]), metadata=Metadata(**obj["metadata"])
    )


class OperationTrait(TraitType):
    klass = list
    default_value = Operations()


def serialize_operations(ops: Operations) -> dict[str, Any]:
    return asdict(ops)


def deserialize_operations(obj: dict[str, Any]) -> Operations:
    return Operations(operations=[deserialize_operation(op) for op in obj["operations"]])


operation_serialization = {
    "from_json": lambda obj, _: deserialize_operations(obj),
    "to_json": lambda op, _: serialize_operations(op),
}
