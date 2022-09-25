import { StateMap } from '@aldinh777/reactive/collection/StateMap';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { propAlias, PropAlias, readAlias } from '../prop-util';
import { insertBefore, remove } from '../dom-util';
import ComponentError from '../../error/ComponentError';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.obj !== 'string' || typeof props.as !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.as);
    if (obj instanceof StateMap) {
        const marker = document.createTextNode('');
        const destructParams = propAlias(params, propnames, obj.raw);
        const component: ControlComponent = {
            elems: intoDom(tree, destructParams, _super)
        };
        obj.onUpdate(() => {
            const { parentNode } = marker;
            if (parentNode) {
                const destructParams = propAlias(params, propnames, obj.raw);
                const newElems = intoDom(tree, destructParams, _super);
                remove(parentNode, component.elems);
                insertBefore(parentNode, newElems, marker);
                component.elems = newElems;
            }
        });
        return [component, marker];
    } else {
        throw ComponentError.invalidCollect('DestructCollect', 'destruct', 'obj', props.obj);
    }
}
