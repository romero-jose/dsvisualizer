import * as d3 from 'd3';

const WIDTH = 1000;
const HEIGHT = 500;

const RECT_WIDTH = 100;
const RECT_HEIGHT = 50;
const RECT_Y_OFFSET = 100;

const ITER_HEIGHT = 30;
const ITER_PADDING = 5;

const OUTER_PADDING = 20;
const INNER_PADDING = 50;
const STEP = 100;

const ITER_DURATION = 1000;
const FADE_IN = 1000;
const TRANSITION = 1000;

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

function fade_out(svg: d3.Selection<any, unknown, any, any>) {
  return svg.transition().duration(FADE_IN).attr('opacity', 0).end();
}

function append_arrow(
  svg: d3.Selection<any, unknown, any, any>,
  length: number
) {
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

interface Data {
  value: string;
}

class Viz {
  private _container: d3.Selection<any, unknown, any, any>;
  private _iterator: d3.Selection<SVGGElement, unknown, any, any>;
  private _data: Data[];

  constructor(selection: string, data: Data[] = []) {
    // Container
    this._container = d3.select(selection);

    // Iterator
    this._iterator = this._container
      .append('g')
      .attr('class', 'iterator')
      .attr('transform', `translate(${x_scale(0)}, ${RECT_Y_OFFSET})`)
      .attr('opacity', 0);

    append_arrow(this._iterator, ITER_HEIGHT).attr(
      'transform',
      `rotate(90) translate(${-ITER_HEIGHT - ITER_PADDING}, ${-RECT_WIDTH / 2})`
    );

    // Data
    this._data = data;

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
  }

  static enter(selection: d3.Selection<d3.BaseType, Data, any, unknown>) {
    console.log('enter');
    const boxes = selection;

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

    append_arrow(
      boxes_enter as d3.Selection<any, unknown, any, any>,
      INNER_PADDING
    ).attr('transform', `translate(${RECT_WIDTH}, ${RECT_HEIGHT / 2})`);

    boxes_enter
      .append('text')
      .text((d) => d.value)
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
  }

  static exit(selection: d3.Selection<d3.BaseType, Data, any, unknown>) {
    console.log('exit');
    const boxes = selection;
    const boxes_exit = boxes.exit();
    const transition = boxes_exit
      .attr('opacity', 1)
      .transition()
      .duration(TRANSITION)
      .attr('opacity', 0);
    transition.remove();
    return transition.end();
  }

  static update(selection: d3.Selection<d3.BaseType, Data, any, unknown>) {
    console.log('update');
    const boxes = selection;
    const boxes_update = boxes
      .transition()
      .duration(TRANSITION)
      .attr(
        'transform',
        (d, i) => `translate(${x_scale(i)}, ${RECT_Y_OFFSET})`
      );
    return boxes_update.end();
  }

  async display() {
    const boxes = this._container.selectAll('.box').data(this._data);

    await Viz.exit(boxes);
    await Viz.update(boxes);
    return await Viz.enter(boxes);
  }

  iterate(k: number) {
    if (k === 0) {
      return Promise.resolve();
    }
    // Fade in
    let transition = this._iterator
      .attr('transform', `translate(${x_scale(0)}, ${RECT_Y_OFFSET})`)
      .attr('opacity', 0)
      .transition()
      .duration(FADE_IN)
      .attr('opacity', 1);

    // Iterate
    for (let i = 0; i < k; ++i) {
      transition = transition
        .transition()
        .duration(ITER_DURATION)
        .attr('transform', `translate(${x_scale(i)}, ${RECT_Y_OFFSET})`);
    }

    return transition.end();
  }

  async append(el: Data) {
    return await this.insert(this._data.length, el);
  }

  async pop(i = this._data.length) {
    await this.iterate(i);
    this._data.splice(i - 1, 1);
    this.display();
    return fade_out(this._iterator);
  }

  async insert(i: number, el: Data) {
    await this.iterate(i);
    this._data.splice(i, 0, el);
    await this.display();
    return fade_out(this._iterator);
  }
}

export async function test(): Promise<void> {
  // SVG
  d3.select('.operations-view')
    .append('svg')
    .attr('viewBox', [0, 0, WIDTH, HEIGHT])
    .classed('viz', true);

  const linked_list_viz = new Viz('.viz');

  await linked_list_viz.append({ value: '1' });
  await linked_list_viz.append({ value: '2' });
  await linked_list_viz.append({ value: '3' });
  await linked_list_viz.append({ value: '4' });
  await linked_list_viz.append({ value: '5' });

  await linked_list_viz.pop();
  await linked_list_viz.pop();
  await linked_list_viz.pop();

  await linked_list_viz.insert(1, { value: '1.5' });
  await linked_list_viz.insert(1, { value: '1.2' });
  await linked_list_viz.insert(1, { value: '1.1' });

  await linked_list_viz.insert(0, { value: '0.1' });
  await linked_list_viz.insert(0, { value: '0.2' });
  await linked_list_viz.insert(0, { value: '0.3' });
}
