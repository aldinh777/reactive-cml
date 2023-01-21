export function generateRandomId(length: number): string {
    const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }
    return id;
}

export function getElementsBetween(startNode: Node, endNode: Node): Node[] {
    const elements: Node[] = [];
    let currentNode = startNode;
    while (currentNode.nextSibling !== endNode) {
        currentNode = currentNode.nextSibling;
        elements.push(currentNode);
    }
    return elements;
}
