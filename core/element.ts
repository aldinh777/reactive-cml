import { State } from '@aldinh777/reactive';
import { Properties } from '../common/types';

export type RCElementChildren = RCElement | State<any> | string;

export class RCElement {
    tag: string;
    props: Properties<any>;
    events: Properties<Function>;
    children: RCElementChildren[] = [];

    constructor(tag: string, props: Properties<any> = {}, events: Properties<Function> = {}) {
        this.tag = tag;
        this.props = props;
        this.events = events;
    }
}
