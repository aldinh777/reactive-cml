import { RCResult, Component } from '../src';
import { Properties, StaticProperties, TextProp } from '../util';
import { isReactive, has, crash } from './additional-util';
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
    items: NodeComponent[];
    onMount?(): void;
    onDismount?(): void;
}

export interface Context {
    params?: Properties;
    extracts?: PropAlias[];
    children?: RCResult[];
    onMount?(): void;
    onDismount?(): void;
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

export function intoDom(tree: RCResult[], params: Properties, context?: Context): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(_text(item));
        } else if (has(item, 'name')) {
            const param = params[(item as TextProp).name];
            const text = _text('');
            if (isReactive(param)) {
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
                const temp = { mount: context?.onMount, dismount: context?.onDismount };
                delete context?.onMount;
                delete context?.onDismount;
                processElementProperties(elem, compProps, compEvents);
                append(elem, intoDom(children, params, context));
                if (context) {
                    context.onMount = temp.mount;
                    context.onDismount = temp.dismount;
                }
                result.push(elem);
            }
        }
    }
    return context?.onMount || context?.onDismount
        ? [{ items: result, onMount: context?.onMount, onDismount: context?.onDismount }]
        : result;
}
