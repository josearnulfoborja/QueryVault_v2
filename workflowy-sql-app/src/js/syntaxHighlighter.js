function highlightSQL(code) {
    // Create a temporary element to hold the code
    const tempElement = document.createElement('div');
    tempElement.innerHTML = `<pre><code class="language-sql">${code}</code></pre>`;

    // Use Prism.js to highlight the code
    Prism.highlightElement(tempElement.querySelector('code'));

    // Return the highlighted code as HTML
    return tempElement.innerHTML;
}

export { highlightSQL };