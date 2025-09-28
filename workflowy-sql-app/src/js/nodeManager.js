// nodeManager.js

const nodes = [];

function createNode(title, content, parentId = null) {
    const newNode = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        parentId: parentId,
        children: []
    };
    if (parentId) {
        const parentNode = findNodeById(parentId);
        if (parentNode) {
            parentNode.children.push(newNode);
        }
    } else {
        nodes.push(newNode);
    }
    return newNode;
}

function editNode(id, newTitle, newContent) {
    const node = findNodeById(id);
    if (node) {
        node.title = newTitle.trim();
        node.content = newContent.trim();
    }
}

function deleteNode(id) {
    const index = nodes.findIndex(node => node.id === id);
    if (index !== -1) {
        nodes.splice(index, 1);
    } else {
        nodes.forEach(node => {
            const childIndex = node.children.findIndex(child => child.id === id);
            if (childIndex !== -1) {
                node.children.splice(childIndex, 1);
            }
        });
    }
}

function getNodes() {
    return nodes;
}

function findNodeById(id) {
    return nodes.find(node => node.id === id) || nodes.flatMap(node => node.children).find(child => child.id === id);
}

export { createNode, editNode, deleteNode, getNodes };