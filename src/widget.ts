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

import { display } from './animation';
import { animate_operations } from './animation2';

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
  private container: HTMLDivElement;
  private p: HTMLParagraphElement;

  render(): void {
    this.container = document.createElement('div');
    this.container.className = 'operations-view';
    this.el.appendChild(this.container);

    this.p = document.createElement('p');
    this.container.appendChild(this.p);

    this.value_changed();
    this.model.on('change:operations', this.value_changed);

    animate_operations(this.container, this.operations);
  }

  value_changed(): void {
    console.log('value changed:');
    console.log(this.operations);
    display(this.p, this.operations);
  }

  get operations(): LinkedListOperation[] {
    return this.model.get('operations');
  }

  set operations(list: LinkedListOperation[]) {
    this.model.set('operations', list);
  }
}
