import { isState } from '@aldinh777/reactive-utils/validator';
import { DEFAULT_COMPONENT_SET } from './constants';
import ComponentError from '../error/ComponentError';
import { RCResult, Component } from '../src';
import { Properties, TextProp } from '../util-type';
import { setAttr, _text, _elem, append } from './dom-util';
import { PropAlias, readAlias } from './prop-util';

type PropertyResult = [props: Properties<any>, events: Properties<Function>];
export type NodeComponent = Node | ControlComponent;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties<any>,
    component?: Context,
    dispatch?: EventDispatcher
) => NodeComponent[] | void;

export interface ControlComponent {
    items: NodeComponent[];
    root?: Node;
    mount?(): void;
    dismount?(): void;
}

export interface Context {
    params?: Properties<any>;
    extracts?: PropAlias[];
    children?: RCResult[];
    onMount?(): void;
    onDismount?(): void;
    slotname?: string;
    _super?: Context;
}

function processComponentProperties(
    params: Properties<any>,
    props: Properties<string | TextProp>,
    events: Properties<string>
): PropertyResult {
    const propsComp: Properties<any> = {};
    const eventsComp: Properties<Function> = {};
    for (const prop in props) {
        const value = props[prop];
        if (typeof value === 'string') {
            propsComp[prop] = value;
        } else {
            const [propname] = value;
            propsComp[prop] = params[propname];
        }
    }
    for (const event in events) {
        eventsComp[event] = params[events[event]];
    }
    return [propsComp, eventsComp];
}

function processElementProperties(
    elem: HTMLElement,
    props: Properties<any>,
    events: Properties<Function>
): void {
    for (const prop in props) {
        const propvalue = props[prop];
        if (isState(propvalue)) {
            setAttr(elem, prop, propvalue.getValue());
            propvalue.onChange((next: any) => setAttr(elem, prop, next));
        } else {
            setAttr(elem, prop, propvalue);
        }
    }
    for (const event in events) {
        const listener = events[event] as EventListener;
        elem.addEventListener(event, listener);
    }
}

function createDispatcher(events: Properties<Function>): EventDispatcher {
    return (name: string, ...args: any[]) => {
        const event = events[name];
        if (typeof event === 'function') {
            return event(...args);
        }
    };
}

function crash(name: string, err: any): ComponentError {
    let reason: string;
    let trace = DEFAULT_COMPONENT_SET.includes(name) ? [] : [name];
    if (err instanceof Error) {
        if (err.name === 'ComponentError') {
            trace = trace.concat((err as ComponentError).componentTraces);
            reason = (err as ComponentError).reason;
        } else {
            reason = err.stack;
        }
    } else {
        reason = err || '?';
    }
    return new ComponentError(`Crash at component '${name}'.`, trace, reason);
}

export function intoDom(
    tree: RCResult[],
    params: Properties<any>,
    context?: Context,
    isRoot: boolean = false
): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(_text(item));
        } else if (item.length === 1) {
            const [propname] = item;
            const param = params[propname];
            const text = _text('');
            if (isState(param)) {
                text.textContent = param.getValue();
                param.onChange((next: string) => (text.textContent = next));
            } else {
                text.textContent = param;
            }
            result.push(text);
        } else {
            const [tag, props, events, children] = item as Component;
            const [compProps, compEvents] = processComponentProperties(params, props, events);
            const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
            if (tag[0].match(/[A-Z]/)) {
                const compContext: Context = {
                    children: children,
                    extracts: context?.extracts?.concat(extracts) || [],
                    params: params,
                    _super: context
                };
                const component: ReactiveComponent = params[tag];
                try {
                    const res = component(compProps, compContext, createDispatcher(compEvents));
                    if (res) {
                        result.push(...res);
                    }
                } catch (err) {
                    throw crash(tag, err);
                }
            } else {
                const elem = _elem(tag);
                processElementProperties(elem, compProps, compEvents);
                const componentResult = intoDom(children, params, context);
                const everyoneIsNode = componentResult.every((item) => item instanceof Node);
                append(elem, componentResult);
                result.push(everyoneIsNode ? elem : { root: elem, items: componentResult });
            }
        }
    }
    return isRoot
        ? [{ items: result, mount: context?.onMount, dismount: context?.onDismount }]
        : result;
}
