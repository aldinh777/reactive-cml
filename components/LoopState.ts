import { isState } from '@aldinh777/reactive-utils/validator';
import { Context, NodeComponent, intoDom, ControlComponent } from '../dom';
import { _text, remove, append } from '../dom/dom-util';
import { PropAlias, propAlias, readAlias } from '../dom/prop-util';
import ComponentError from '../error/ComponentError';
import { Properties } from '../util';

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

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const list = component.params[props.list];
    const alias = props.as;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isState(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid State in 'state:list' property of 'foreach' element`
        );
    }
    const marker = _text('');
    const result: ControlComponent = {
        items: createFlatListElement(alias, extracts, list.getValue(), component)
    };
    list.onChange((items) => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        const newElems: NodeComponent[] = createFlatListElement(alias, extracts, items, component);
        remove(parentNode, result.items);
        append(parentNode, newElems, marker);
        result.items = newElems;
    });
    return [result, marker];
}
