export const _doc = document;
export const _text = (text: any) => _doc.createTextNode(text);
export const _elem = (tag: string) => _doc.createElement(tag);

export const append = (parent: Node, nodes: Node[], before?: Node): void => {
    for (const node of nodes) {
        if (before) {
            parent.insertBefore(node, before);
        } else {
            parent.appendChild(node);
        }
    }
};

export const remove = (parent: Node, nodes: Node[]): void => {
    for (const node of nodes) {
        parent.removeChild(node);
    }
};

export const setAttr = (element: Element, attribute: string, value: any): void => {
    if (Reflect.has(element, attribute)) {
        element[attribute] = value;
    } else {
        element.setAttribute(attribute, value);
    }
};
