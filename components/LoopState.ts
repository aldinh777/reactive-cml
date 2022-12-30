import { State } from '@aldinh777/reactive';
import { Context, NodeComponent, intoDom, ControlComponent } from '../dom';
import ComponentError from '../error/ComponentError';
import { Properties } from '../util';
import { remove, insertBefore, _text } from '../dom/dom-util';
import { PropAlias, propAlias, readAlias } from '../dom/prop-util';

function createFlatListElement(
    alias: string,
    extract: PropAlias[],
    items: any[],
    context?: Context
): NodeComponent[] {
    const components: NodeComponent[] = [];
    const { children, params, _super } = context;
    for (const item of items) {
        const localParams = propAlias(params, extract, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        components.push(...intoDom(children, localParams, _super));
    }
    return components;
}

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.list !== 'string') {
        return;
    }
    const list = context.params[props.list];
    const alias = props.as;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!(list instanceof State)) {
        throw new ComponentError(
            `'${props.list}' are not a valid State in 'state:list' property of 'foreach' element`
        );
    }
    const marker = _text('');
    const component: ControlComponent = {
        items: createFlatListElement(alias, extracts, list.getValue(), context)
    };
    list.onChange((items) => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        const newElems: NodeComponent[] = createFlatListElement(alias, extracts, items, context);
        remove(parentNode, component.items);
        insertBefore(parentNode, newElems, marker);
        component.items = newElems;
    });
    return [component, marker];
}
