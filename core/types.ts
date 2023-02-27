import { State } from '@aldinh777/reactive';
import { FlatText, Properties } from '../common/types';
import { PropAlias } from '../common/prop-util';

export type RenderedElementChildren = RenderedElement | State | string;
export type FlatResult = string | FlatText | FlatElement;
export type FlatElement = [
    tag: string,
    props: Properties<string | FlatText>,
    events: Properties<string>,
    children: FlatResult[]
];
export type RenderedResult = RenderedComponent | RenderedElement | State | string;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    component?: Component,
    dispatch?: EventDispatcher
) => Promise<RenderedResult[] | void>;

export interface RenderedElement {
    tag: string;
    props: Properties;
    events: Properties<Function>;
    children: RenderedElementChildren[];
}

export interface RenderedComponent {
    items: RenderedResult[];
    root?: RenderedElement;
    component?: Component;
}

export interface Component {
    params?: Properties;
    extracts?: PropAlias[];
    children?: FlatResult[];
    onMount?(): any;
    slotname?: string;
    _super?: Component;
}
