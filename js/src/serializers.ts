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

export type Metadata = {
  animate: boolean;
  source: string[];
};

export type Operation = {
  operation: LinkedListOperation;
  metadata: Metadata;
};

export type Operations = {
  operations: Operation[];
};

function serialize_operations(ops: Operations): Operations {
  return JSON.parse(JSON.stringify(ops));
}

function deserialize_operations(obj: unknown): Operations {
  return <Operations>obj;
}

export const operation_serializers = {
  serialize: serialize_operations,
  deserialize: deserialize_operations,
};
