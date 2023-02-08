import { State } from '@aldinh777/reactive';
import { FlatText, Properties } from '../common/types';
import { PropAlias } from './prop-util';

export type RenderedElementChildren = RenderedElement | State<any> | string;
export type FlatResult = string | FlatText | FlatElement;
export type FlatElement = [
    tag: string,
    props: Properties<string | FlatText>,
    events: Properties<string>,
    children: FlatResult[]
];
export type RenderedResult = RenderedComponent | RenderedElement | State<any> | string;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties<any>,
    component?: Component,
    dispatch?: EventDispatcher
) => RenderedResult[] | void;

export interface RenderedElement {
    tag: string;
    props: Properties<any>;
    events: Properties<Function>;
    children: RenderedElementChildren[];
}

export interface RenderedComponent {
    items: RenderedResult[];
    root?: RenderedElement;
    component?: Component;
}

export interface Component {
    params?: Properties<any>;
    extracts?: PropAlias[];
    children?: FlatResult[];
    onMount?(): any;
    onDismount?(): any;
    slotname?: string;
    _super?: Component;
}
