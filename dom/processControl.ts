import { ComponentChildren, NodeComponent } from '.';
import { Component } from '../src';
import ConditionComponent from './components/ConditionComponent';
import DestructComponent from './components/DestructComponent';
import LoopComponent from './components/LoopComponent';

export default function (
    result: NodeComponent[],
    item: Component,
    chomp: ComponentChildren,
    nonControlHandler: () => any
) {
    const { tag, props } = item;
    switch (tag) {
        case 'if':
        case 'unless':
            result.push(...ConditionComponent(props, chomp));
            break;
        case 'foreach':
            result.push(...LoopComponent(props, chomp));
            break;
        case 'destruct':
            result.push(...DestructComponent(props, chomp));
            break;
        default:
            nonControlHandler();
            break;
    }
}
