import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { PropAlias } from './prop-util';

// Rendered things
export type RenderedElementChildren = RenderedElement | [any];
export type FlatResult = string | FlatText | FlatElement;
export type FlatElement = [
    tag: string,
    props: Properties<string | FlatText>,
    events: Properties<string>,
    children: FlatResult[]
];
export type RenderedResult = RenderedComponent | RenderedElement | [any] | string;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    component?: Context,
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
    component?: Context;
}

export interface Context extends Properties {
    params?: Properties;
    extracts?: PropAlias[];
    children?: FlatResult[];
    slotname?: string;
    _super?: Context;
    preMount?(): ComponentEvent;
    onMount?(): ComponentEvent;
    onDismount?(): ComponentEvent;
}

export type ComponentEvent = () => void | Function | Promise<void | Function>;

// Preprocessors things
export interface Properties<T = unknown> {
    [key: string]: T;
}

export interface Preprocessor {
    buildScript(
        cmlRoot: CMLTree,
        identifiers: Identifiers,
        addImport: (item: ImportFormat) => any
    ): string;
    relativeBlacklist?: string[];
    preprocessors?: TreePreprocessor[];
}

export type FlatText = [name: string];
export type ImportFormat = [from: string, imports: string | string[], isComponent?: boolean];

export type Identifiers = [dependencies: string[], params: string[], blacklist?: Set<string>];
export type TreePreprocessor = (node: CMLObject, ids: Identifiers, isRoot: boolean) => CMLObject;
