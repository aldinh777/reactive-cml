import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';
import { propAlias, readAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        let slotname: string = '_children';
        if (props.name) {
            slotname = props.name;
        }
        const { slots, params, _super } = context._super;
        const tree = slots[slotname]?.elems || [];
        const extract = slots[slotname]?.extract || [];
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, context.params);
        const childrenParams = propAlias(params, extract, localParams);
        return intoDom(tree, childrenParams, _super);
    }
}
