import ComponentError from '../error/ComponentError';
import { DEFAULT_COMPONENT_SET } from '../parser/constants';
import { RCResult, Component } from '../src';
import { Properties, StaticProperties, TextProp } from '../util';
import { setAttr, _text, _elem, append } from './dom-util';
import { PropAlias, readAlias } from './prop-util';

type PropertyResult = [props: Properties, events: StaticProperties<Function>];
export type NodeComponent = Node | ControlComponent;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    context?: Context,
    dispatch?: EventDispatcher
) => NodeComponent[] | void;

export interface ControlComponent {
    elems: NodeComponent[];
}
export interface Context {
    params: Properties;
    extracts: PropAlias[];
    children: RCResult[];
    slotname?: string;
    _super?: Context;
}

function processComponentProperties(
    params: Properties,
    props: StaticProperties<string | TextProp>,
    events: StaticProperties<string>
): PropertyResult {
    const propsComp: Properties = {};
    const eventsComp: StaticProperties<Function> = {};
    for (const prop in props) {
        const value = props[prop];
        if (typeof value === 'string') {
            propsComp[prop] = value;
        } else {
            propsComp[prop] = params[value.name];
        }
    }
    for (const event in events) {
        eventsComp[event] = params[events[event]];
    }
    return [propsComp, eventsComp];
}

function has(obj: any, key: string) {
    return typeof obj === 'object' && Reflect.has(obj, key);
}

function isReactive(item: any) {
    return has(item, 'getValue') && has(item, 'onChange');
}

function processElementProperties(
    elem: HTMLElement,
    props: Properties,
    events: StaticProperties<Function>
): void {
    for (const prop in props) {
        const propvalue = props[prop];
        if (isReactive(propvalue)) {
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

function createDispatcher(events: StaticProperties<Function>): EventDispatcher {
    return (name: string, ...args: any[]) => {
        const event = events[name];
        if (typeof event === 'function') {
            return event(...args);
        }
    };
}

function crash(name: string, err: any): ComponentError {
    let reason: string;
    let trace = DEFAULT_COMPONENT_SET.has(name) ? [] : [name];
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

export function intoDom(tree: RCResult[], params: Properties, context?: Context): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(_text(item));
        } else if (Reflect.has(item, 'name')) {
            const param = params[(item as TextProp).name];
            const text = _text('');
            if (isReactive(param)) {
                text.textContent = param.getValue();
                param.onChange((next) => (text.textContent = next));
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
                    extracts: context?.extracts.concat(extracts) || [],
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
                append(elem, intoDom(children, params, context));
                result.push(elem);
            }
        }
    }
    return result;
}
