function searchNodes(query, nodes) {
    const results = [];
    const lowerCaseQuery = query.toLowerCase();

    nodes.forEach(node => {
        const titleMatch = node.title.toLowerCase().includes(lowerCaseQuery);
        const contentMatch = node.content && node.content.toLowerCase().includes(lowerCaseQuery);

        if (titleMatch || contentMatch) {
            results.push(node);
        }

        // Recursively search in child nodes if they exist
        if (node.children && node.children.length > 0) {
            const childResults = searchNodes(query, node.children);
            if (childResults.length > 0) {
                results.push({ ...node, children: childResults });
            }
        }
    });

    return results;
}

export { searchNodes };