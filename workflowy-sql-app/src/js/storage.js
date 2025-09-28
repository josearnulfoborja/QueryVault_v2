// storage.js

export function saveNode(node) {
    const nodes = loadNodes();
    nodes.push(node);
    localStorage.setItem('workflowyNodes', JSON.stringify(nodes));
}

export function loadNodes() {
    const nodes = localStorage.getItem('workflowyNodes');
    return nodes ? JSON.parse(nodes) : [];
}

export function clearStorage() {
    localStorage.removeItem('workflowyNodes');
}