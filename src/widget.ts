// Copyright (c) Jose Romero
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';
import { operation_serializers, LinkedListOperation } from './serializers';

export class LinkedListModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: LinkedListModel.model_name,
      _model_module: LinkedListModel.model_module,
      _model_module_version: LinkedListModel.model_module_version,
      _view_name: LinkedListModel.view_name,
      _view_module: LinkedListModel.view_module,
      _view_module_version: LinkedListModel.view_module_version,
      email: 'john@example.com',
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'ExampleModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'ExampleView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class EmailView extends DOMWidgetView {
  private _emailInput: HTMLInputElement;

  render() {
    this._emailInput = document.createElement('input');
    this._emailInput.type = 'email';
    this._emailInput.value = 'john@example.com';
    this._emailInput.disabled = true;
    this.el.appendChild(this._emailInput);

    this.el.classList.add('custom-widget');

    this.value_changed();
    this.model.on('change:value', this.value_changed, this);
  }

  value_changed() {
    this.el.textContent = this.model.get('value');
  }
}

export class OperationModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: 'OperationModel',
      _view_name: 'OperationView',
      operation: <LinkedListOperation>{
        operation: 'init',
        value: 0,
        id: 0,
        next: null,
      },
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    operation: operation_serializers,
  };
}

export class OperationView extends DOMWidgetView {
  private p: HTMLParagraphElement;

  render(): void {
    this.p = document.createElement('p');
    this.el.appendChild(this.p);

    this.value_changed();
    this.model.on('change:operation', this.value_changed, this);
  }

  value_changed(): void {
    this.p.innerText = JSON.stringify(this.operation, null, '\t');
  }

  get operation(): LinkedListOperation {
    return this.model.get('operation');
  }
}
