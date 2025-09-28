# Workflowy SQL App

## Overview
The Workflowy SQL App is a web application that combines a hierarchical structure similar to Workflowy with enriched message visualization for SQL code snippets. The application allows users to create, edit, and manage nodes in a tree format, providing a seamless experience for handling SQL code.

## Features
- Create hierarchical nodes with indentation.
- Each node can contain:
  - An editable title.
  - Plain text or SQL code snippets.
- SQL snippets are displayed in blocks with syntax highlighting using Prism.js.
- Toggle between text mode and code mode for each node.
- Insert button to add node content with validation to prevent empty nodes.
- Local storage persistence to automatically save each node.
- Quick search functionality for titles or SQL content with highlighted matches.
- Clear and minimalistic user interface with:
  - Title input field.
  - Text area with line numbering.
  - "Wrap text" button.
  - "Cancel" and "Insert" buttons.

## Project Structure
```
workflowy-sql-app
├── src
│   ├── index.html          # Main HTML structure of the application
│   ├── styles
│   │   └── main.css       # CSS styles for the application
│   ├── js
│   │   ├── nodeManager.js  # Module for node management
│   │   ├── syntaxHighlighter.js # Module for SQL syntax highlighting
│   │   ├── storage.js      # Module for local storage operations
│   │   ├── search.js       # Module for search functionality
│   │   └── uiRenderer.js   # Module for UI rendering
│   └── assets
│       └── prism.js        # Prism.js library for syntax highlighting
├── package.json            # npm configuration file
└── README.md               # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd workflowy-sql-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
- Open `src/index.html` in a web browser to start using the application.
- Use the interface to create and manage nodes, insert SQL code, and utilize the search functionality.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.