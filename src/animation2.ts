import * as d3 from 'd3';
import { LinkedListOperation, Init } from './serializers';

const WIDTH = 1000;
const HEIGHT = 250;

const RECT_WIDTH = 100;
const RECT_HEIGHT = 50;
const RECT_Y_OFFSET = 100;

// const ITER_HEIGHT = 30;
// const ITER_PADDING = 5;

const OUTER_PADDING = 20;
const INNER_PADDING = 50;
const STEP = 100;

// const ITER_DURATION = 1000;
const FADE_IN = 1000;
// const TRANSITION = 1000;

const ARROW_HEAD_LENGTH = 10;
const ARROW_HEAD_WIDTH = 8;
const ARROW_STROKE_WIDTH = 2;

function x_scale(i: number) {
  return OUTER_PADDING + (STEP + INNER_PADDING) * i;
}

export function fade_in(
  svg: d3.Selection<any, unknown, any, any>
): Promise<void> {
  return svg.transition().duration(FADE_IN).attr('opacity', 1).end();
}

export function fade_out(
  svg: d3.Selection<any, unknown, any, any>
): Promise<void> {
  return svg.transition().duration(FADE_IN).attr('opacity', 0).end();
}

export function append_arrow(
  svg: d3.Selection<any, unknown, any, any>,
  length: number
): d3.Selection<SVGGElement, unknown, any, any> {
  const arrow = svg.append('g').attr('class', 'arrow');

  // Stem
  arrow
    .append('line')
    .attr('x2', length - ARROW_HEAD_LENGTH)
    .attr('stroke', '#000000')
    .attr('stroke-width', ARROW_STROKE_WIDTH)
    .attr('fill', 'none');

  // Head
  arrow
    .append('g')
    .attr('transform', `translate(${length - ARROW_HEAD_LENGTH}, 0)`)
    .append('polygon')
    .attr(
      'points',
      `0,${ARROW_HEAD_WIDTH / 2} ${ARROW_HEAD_LENGTH},0 0,${
        -ARROW_HEAD_WIDTH / 2
      }`
    );

  return arrow;
}

interface VizNode {
  value: string;
}

class Viz {
  private _container: d3.Selection<any, unknown, any, any>;
  private _nodes: Map<number, VizNode>;
  private _edges: Map<number, number>;

  constructor(element: HTMLElement) {
    // Container
    const svg = d3
      .select(element)
      .append('svg')
      .attr('viewBox', [0, 0, WIDTH, HEIGHT])
      .classed('viz', true);

    this._container = svg;

    // Zoom
    const zoomBehaviour = d3
      .zoom<any, unknown>()
      .extent([
        [0, 0],
        [WIDTH, HEIGHT],
      ])
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => event.transform);

    this._container.call(zoomBehaviour);

    this._nodes = new Map<number, VizNode>();
    this._edges = new Map<number, number>();
  }

  init(op: Init) {
    this._nodes.set(op.id, { value: op.value });
    if (op.next !== null) {
      this._edges.set(op.id, op.next);
    }
  }

  set_next(i: number, j: number) {
    this._edges.set(i, j);
  }

  set_value(i: number, value: string) {
    const current_value = this._nodes.get(i);
    if (current_value !== undefined) {
      current_value.value = value;
      this._nodes.set(i, current_value);
    }
  }

  async display() {
    const boxes = this._container
      .selectAll('.box')
      .data(this._nodes);

    const enter = (
      selection: d3.Selection<d3.BaseType, [number, VizNode], any, unknown>
    ) => {
      // Enter
      const boxes_enter = boxes
        .enter()
        .append('g')
        .classed('box', true)
        .attr(
          'transform',
          (d, i) => `translate(${x_scale(i)}, ${RECT_Y_OFFSET})`
        );

      boxes_enter
        .append('rect')
        .attr('width', RECT_WIDTH)
        .attr('height', RECT_HEIGHT);

      boxes_enter
        .append('text')
        .text((d) => d[1].value)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('x', RECT_WIDTH / 2)
        .attr('y', RECT_HEIGHT / 2);

      const transition = boxes_enter
        .attr('opacity', 0)
        .transition()
        .duration(FADE_IN)
        .attr('opacity', 1);

      return transition.end();
    };

    const promise = enter(boxes);
    return await promise;
  }
}

export async function test(element: HTMLElement): Promise<void> {
  // SVG
  const linked_list_viz = new Viz(element);
  await linked_list_viz.display();
  linked_list_viz.init({
    operation: 'init',
    id: 0,
    value: 'first',
    next: null,
  });
  await linked_list_viz.display();
  linked_list_viz.init({
    operation: 'init',
    id: 1,
    value: 'second',
    next: 0,
  });
  await linked_list_viz.display();
}

function pretty_print(op: LinkedListOperation): string {
  let msg: string;
  switch (op.operation) {
    case 'init':
      msg = `${op.value}, ${op.next}`;
      break;
    case 'set_value':
      msg = `${op.value}`;
      break;
    case 'get_value':
      msg = '';
      break;
    case 'set_next':
      msg = `${op.next}`;
      break;
    case 'get_next':
      msg = '';
      break;
  }
  return `${op.operation}(${msg})`;
}

export async function display(
  element: HTMLElement,
  ops: LinkedListOperation[]
): Promise<void> {
  const text = ops.map(pretty_print).join('\n');
  element.innerText = text;
}
