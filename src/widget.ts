// Copyright (c) Jose Romero
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

// Import the CSS
import '../css/widget.css';
import { operation_serializers, LinkedListOperation } from './serializers';

import { test } from './animation';

export class OperationsModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: 'OperationsModel',
      _view_name: 'OperationsView',
      operations: <LinkedListOperation[]>[],
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    operations: operation_serializers,
  };
}

export class OperationsView extends DOMWidgetView {
  private p: HTMLParagraphElement;

  render(): void {
    this.p = document.createElement('p');
    this.el.appendChild(this.p);
    this.p.className = 'operations-view';

    this.value_changed();
    this.model.on('change:operations', this.value_changed);

    test();
  }

  value_changed(): void {
    this.p.innerText = JSON.stringify(this.operations, null, '\t');
  }

  get operations(): LinkedListOperation {
    return this.model.get('operations');
  }

  set operations(list: LinkedListOperation) {
    this.model.set('operations', list);
  }
}
