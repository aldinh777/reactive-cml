import { State } from '@aldinh777/reactive';
import ComponentError from '../error/ComponentError';
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
interface Slot {
    elems: RCResult[];
    extract: PropAlias[];
}
interface SlotMap extends StaticProperties<Slot> {
    _children: Slot;
}
export interface Context {
    slots: SlotMap;
    params: Properties;
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
        if (propvalue instanceof State) {
            setAttr(elem, prop, propvalue.getValue());
            propvalue.onChange((next) => setAttr(elem, prop, next));
        } else {
            setAttr(elem, prop, propvalue);
        }
    }
    for (const event in events) {
        const listener = events[event] as EventListener;
        elem.addEventListener(event, listener);
    }
}

function processElementSlots(children: RCResult[], extract: string | TextProp): SlotMap {
    const ext: PropAlias[] = typeof extract === 'string' ? readAlias(extract) : [];
    const slots: SlotMap = { _children: { elems: [], extract: ext } };
    for (const item of children) {
        if (item instanceof Array) {
            const [tag, props, , children] = item;
            if (tag === 'slot') {
                const extract = props.extract;
                const slotext: PropAlias[] = typeof extract === 'string' ? readAlias(extract) : [];
                if (props.for && typeof props.for === 'string') {
                    slots[props.for] = { elems: children, extract: slotext };
                }
                continue;
            }
        }
        slots._children.elems.push(item);
    }
    return slots;
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
        } else if (Reflect.has(item, 'name')) {
            const param = params[(item as TextProp).name];
            const text = _text('');
            if (param instanceof State) {
                text.textContent = param.getValue();
                param.onChange((next) => (text.textContent = next));
            } else {
                text.textContent = param;
            }
            result.push(text);
        } else {
            const [tag, props, events, children] = item as Component;
            const [compProps, compEvents] = processComponentProperties(params, props, events);
            const slots = processElementSlots(children, props.extract);
            if (tag[0].match(/[A-Z]/)) {
                const compContext: Context = {
                    slots: slots,
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
                    throw ComponentError.componentCrash(tag, err);
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
