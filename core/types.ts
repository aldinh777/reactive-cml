import { State } from '@aldinh777/reactive';
import { FlatText, Properties } from '../common/types';
import { PropAlias } from './prop-util';
import { RCElement } from './element';

export type RCResult = string | FlatText | RCFlatElement;

export type RCFlatElement = [
    tag: string,
    props: Properties<string | FlatText>,
    events: Properties<string>,
    children: RCResult[]
];

export type RenderResult = RCComponent | RCElement | State<any> | string;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties<any>,
    component?: Component,
    dispatch?: EventDispatcher
) => RenderResult[] | void;

export interface RCComponent {
    items: RenderResult[];
    root?: RCElement;
    component?: Component;
}

export interface Component {
    params?: Properties<any>;
    extracts?: PropAlias[];
    children?: RCResult[];
    onMount?(): any;
    onDismount?(): any;
    slotname?: string;
    _super?: Component;
}
