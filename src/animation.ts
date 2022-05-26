import * as d3 from 'd3';
import { Operations, Operation, Init } from './serializers';

const WIDTH = 1000;
const HEIGHT = 250;

const RECT_WIDTH = 100;
const RECT_HEIGHT = 50;
// const RECT_Y_OFFSET = 100;

const ITER_HEIGHT = 30;
// const ITER_PADDING = 5;

const OUTER_PADDING = 40;
const INNER_PADDING = 50;
const STEP = 100;

// const ITER_DURATION = 1000;
const FADE_IN = 1000;
const TRANSITION = 1000;

const ARROW_HEAD_LENGTH = 10;
const ARROW_HEAD_WIDTH = 8;
const ARROW_STROKE_WIDTH = 2;

function x_scale(i: number) {
  return OUTER_PADDING + (STEP + INNER_PADDING) * i;
}

function y_scale(i: number) {
  return OUTER_PADDING + 70 * i;
}

const layout = (i: number, j: number) =>
  `translate(${x_scale(i)}, ${y_scale(j)})`;

function fade(
  selection: d3.Selection<any, any, any, unknown>,
  initial_opacity = 0,
  final_opacity = 1,
  animate = true
) {
  if (animate) {
    return selection
      .attr('opacity', initial_opacity)
      .transition()
      .duration(FADE_IN)
      .attr('opacity', final_opacity)
      .end();
  } else {
    selection.attr('opacity', final_opacity);
    return Promise.resolve();
  }
}

function fade_in(
  selection: d3.Selection<any, any, any, unknown>,
  animate = true
): Promise<void> {
  return fade(selection, 0, 1, animate);
}

export function fade_out(
  selection: d3.Selection<any, any, any, unknown>,
  animate = true
): Promise<void> {
  return fade(selection, 1, 0, animate);
}

function transform(
  selection: d3.Selection<any, any, any, unknown>,
  transform: ((d: any) => string) | string,
  animate = true
): Promise<void> {
  if (animate) {
    return selection
      .transition()
      .duration(TRANSITION)
      .attr('transform', <any>transform)
      .end();
  } else {
    selection.attr('transform', transform);
    return Promise.resolve();
  }
}

export function append_arrow(
  svg: d3.Selection<any, any, any, unknown>,
  length: number
): d3.Selection<SVGGElement, any, any, unknown> {
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

interface BoxData {
  i: number;
  id: number;
  value: string;
  list_index: number;
  list_length: number;
}

// Assumes that there are no cycles pointing to the heads
function heads(nodes: Map<number, unknown>, edges: Map<number, number>) {
  const values = new Set(edges.values());
  return [...nodes.keys()].filter((n) => !values.has(n));
}

function* iterate(
  k: number,
  nodes: Map<number, VizNode>,
  edges: Map<number, number>
) {
  let next: number | undefined = k;
  while (next !== undefined) {
    yield { id: next, node: nodes.get(next) as VizNode };
    next = edges.get(next);
  }
}

class Viz {
  private _container: d3.Selection<any, unknown, any, any>;
  private _nodes: Map<number, VizNode>;
  private _edges: Map<number, number>;
  private _heads: number[];
  private _iterator: d3.Selection<SVGGElement, unknown, any, any>;
  private _data: BoxData[];

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

    const iterator = this._container.append('g').attr('class', 'iterator');
    append_arrow(iterator, ITER_HEIGHT).attr(
      'transform',
      `rotate(${90}) translate(${-ITER_HEIGHT}, ${-RECT_WIDTH / 2})`
    );

    this._iterator = iterator;
  }

  async iterate(id: number, animate: boolean) {
    console.log('iterate  id: ', id, 'animate: ', animate);
    if (!animate) {
      return;
    }
    const datum = this._data.find((d) => d.id === id);
    if (!datum) {
      console.error('No datum for element ', id);
      return;
    }
    const i = datum.i;
    const j = datum.list_index;
    transform(this._iterator, layout(i - 1, j), false);
    await fade_in(this._iterator);
    await transform(this._iterator, layout(i, j));
    fade_out(this._iterator);
    return;
  }

  init(op: Init) {
    this._nodes.set(op.id, { value: op.value });
    if (op.next !== null) {
      this._edges.set(op.id, op.next);
    }
  }

  set_next(i: number, j: number | null) {
    if (j !== null) {
      this._edges.set(i, j);
    } else {
      this._edges.delete(i);
    }
  }

  set_value(i: number, value: string) {
    const current_value = this._nodes.get(i);
    if (current_value !== undefined) {
      current_value.value = value;
      this._nodes.set(i, current_value);
    }
  }

  update_heads() {
    this._heads = heads(this._nodes, this._edges);
  }

  update_data() {
    // Define the data to map to the boxes. Uses the entry points or heads
    // to create a list of lists. Then flattens the list of lists into a
    // list with all the data for each node.
    const boxes_data: BoxData[] = this._heads
      .map((k) => [...iterate(k, this._nodes, this._edges)])
      .map((list, list_index) =>
        list.map((datum, i) => {
          return {
            i: i,
            id: datum.id,
            value: datum.node.value,
            list_index: list_index,
            list_length: list.length,
          };
        })
      )
      .reduce((prev, curr) => prev.concat(curr), []);
    this._data = boxes_data;
    console.log(boxes_data);
  }

  async display(animate = true) {
    this.update_heads();
    this.update_data();

    // Map the data to the boxes
    const boxes = this._container
      .selectAll('.box')
      .data(this._data, (d) => (d as BoxData).id);

    const enter = (
      selection: d3.Selection<d3.BaseType, BoxData, any, unknown>
    ) => {
      console.log('enter');
      const boxes_enter = selection
        .enter()
        .append('g')
        .classed('box', true)
        .attr('transform', (d) => layout(d.i, d.list_index));

      boxes_enter
        .append('rect')
        .attr('width', RECT_WIDTH)
        .attr('height', RECT_HEIGHT);

      boxes_enter
        .append('text')
        .text((d) => d.value)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('x', RECT_WIDTH / 2)
        .attr('y', RECT_HEIGHT / 2);

      append_arrow(boxes_enter, INNER_PADDING).attr(
        'transform',
        `translate(${RECT_WIDTH}, ${RECT_HEIGHT / 2})`
      );

      return fade_in(boxes_enter, animate);
    };

    const update = (
      selection: d3.Selection<d3.BaseType, BoxData, any, unknown>
    ) => {
      console.log('update');
      return transform(selection, (d) => layout(d.i, d.list_index), animate);
    };

    await enter(boxes);
    await update(boxes);
    return console.log('finish');
  }
}

async function update_viz(viz: Viz, operation: Operation) {
  const op = operation.operation;
  const animate = operation.metadata.animate;
  switch (op.operation) {
    case 'init':
      viz.init(op);
      break;
    case 'set_value':
      // await viz.iterate(op.id, animate);
      viz.set_value(op.id, op.value);
      break;
    case 'get_value':
      // await viz.iterate(op.id, animate);
      break;
    case 'set_next':
      // await viz.iterate(op.id, animate);
      viz.set_next(op.id, op.next);
      break;
    case 'get_next':
      await viz.iterate(op.id, animate);
      break;
  }
  await viz.display(animate);
}

export async function animate_operations(
  element: HTMLElement,
  ops: Operations
): Promise<void> {
  const code = d3.select(element).append('code').attr('class', 'source-code');
  const linked_list_viz = new Viz(element);

  for (const op of ops.operations) {
    code.text(op.metadata.source);
    await update_viz(linked_list_viz, op);
  }
  code.text('');
  return;
}
