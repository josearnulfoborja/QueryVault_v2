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
        toggleButton.classList.add('secondary-btn');
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

        const copyButton = document.createElement('button');
        copyButton.innerHTML = '📋 Copy SQL';
        copyButton.classList.add('copy-btn');
        copyButton.title = 'Copy SQL code to clipboard';
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(node.content);
                showCopySuccess(copyButton);
            } catch (err) {
                console.warn('Clipboard API not available, using fallback method:', err.message);
                // Fallback for older browsers
                fallbackCopyToClipboard(node.content);
                showCopySuccess(copyButton);
            }
        });

        const insertButton = document.createElement('button');
        insertButton.innerText = 'Insert';
        insertButton.classList.add('primary-btn');
        insertButton.addEventListener('click', () => {
            if (node.title.trim() === '' && node.content.trim() === '') {
                alert('Node cannot be empty');
            }
            // Insert logic here
        });

        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.classList.add('secondary-btn');
        cancelButton.addEventListener('click', () => {
            // Cancel logic here
        });

        contentArea.appendChild(textArea);
        contentArea.appendChild(codeBlock);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('node-actions');
        buttonContainer.appendChild(toggleButton);
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(insertButton);
        buttonContainer.appendChild(cancelButton);
        
        contentArea.appendChild(buttonContainer);

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

    // Helper functions for copy functionality
    const showCopySuccess = (button) => {
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        button.style.backgroundColor = 'var(--success-color)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
        }, 2000);
    };

    const fallbackCopyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };

    return {
        renderNodes,
        updateNodeDisplay,
        toggleEditMode
    };
})();