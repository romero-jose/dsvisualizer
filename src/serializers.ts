export type Init = {
  operation: 'init';
  id: number;
  value: any;
  next: number | null;
};

export type SetValue = {
  operation: 'set_value';
  id: number;
  value: any;
};

export type GetValue = {
  operation: 'get_value';
  id: number;
};

export type SetNext = {
  operation: 'set_next';
  id: number;
  next: number | null;
};

export type GetNext = {
  operation: 'get_next';
  id: number;
};

export type LinkedListOperation =
  | Init
  | SetValue
  | GetValue
  | SetNext
  | GetNext;

export class SerializedLinkedListOperation {
  operation: 'init' | 'get_value' | 'set_value' | 'get_next' | 'set_next';
  id: number;
  value?: any;
  next?: number | null;
}

export function serialize_operation(
  op: LinkedListOperation
): SerializedLinkedListOperation {
  return <SerializedLinkedListOperation>op;
}

export function deserialize_operation(
  op: SerializedLinkedListOperation
): LinkedListOperation {
  switch (op.operation) {
    case 'init':
      return <Init>op;
    case 'set_value':
      return <SetValue>op;
    case 'get_value':
      return <GetValue>op;
    case 'set_next':
      return <SetNext>op;
    case 'get_next':
      return <GetNext>op;
  }
}

export function serialize_operations(
  ops: LinkedListOperation[]
): SerializedLinkedListOperation[] {
  return ops.map(serialize_operation);
}

export function deserialize_operations(
  ops: SerializedLinkedListOperation[]
): LinkedListOperation[] {
  return ops.map(deserialize_operation);
}

export const operation_serializers = {
  serialize: serialize_operations,
  deserialize: deserialize_operations,
};
