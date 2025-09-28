const uiRenderer = (() => {
    const nodeContainer = document.getElementById('nodeContainer');

    const renderNodes = (nodes) => {
        nodeContainer.innerHTML = '';
        nodes.forEach(node => {
            const nodeElement = createNodeElement(node);
            nodeContainer.appendChild(nodeElement);
        });
    };

    const createNodeElement = (node) => {
        const div = document.createElement('div');
        div.classList.add('node');

        const title = document.createElement('input');
        title.type = 'text';
        title.value = node.title;
        title.classList.add('node-title');
        title.addEventListener('change', () => {
            node.title = title.value;
        });

        const contentArea = document.createElement('div');
        contentArea.classList.add('node-content');

        const textArea = document.createElement('textarea');
        textArea.value = node.content;
        textArea.classList.add('node-textarea');
        textArea.addEventListener('input', () => {
            node.content = textArea.value;
        });

        const codeBlock = document.createElement('pre');
        codeBlock.classList.add('language-sql');
        codeBlock.innerHTML = node.content;

        const toggleButton = document.createElement('button');
        toggleButton.innerText = 'Toggle Code/Text';
        toggleButton.addEventListener('click', () => {
            if (textArea.style.display === 'none') {
                textArea.style.display = 'block';
                codeBlock.style.display = 'none';
            } else {
                textArea.style.display = 'none';
                codeBlock.style.display = 'block';
                highlightSQL(node.content, codeBlock);
            }
        });

        const insertButton = document.createElement('button');
        insertButton.innerText = 'Insert';
        insertButton.addEventListener('click', () => {
            if (node.title.trim() === '' && node.content.trim() === '') {
                alert('Node cannot be empty');
                return;
            }
            // Insert logic here
        });

        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.addEventListener('click', () => {
            // Cancel logic here
        });

        contentArea.appendChild(textArea);
        contentArea.appendChild(codeBlock);
        contentArea.appendChild(toggleButton);
        contentArea.appendChild(insertButton);
        contentArea.appendChild(cancelButton);

        div.appendChild(title);
        div.appendChild(contentArea);

        return div;
    };

    const highlightSQL = (code, codeBlock) => {
        codeBlock.innerHTML = code; // Set the code to the block
        Prism.highlightElement(codeBlock); // Highlight the code
    };

    const updateNodeDisplay = (node) => {
        // Logic to update the display of a specific node
    };

    const toggleEditMode = (node) => {
        // Logic to toggle edit mode for a specific node
    };

    return {
        renderNodes,
        updateNodeDisplay,
        toggleEditMode
    };
})();