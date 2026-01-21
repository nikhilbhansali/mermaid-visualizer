// Renderer module - handles Mermaid diagram rendering

import { DIAGRAM_TYPES, DEFAULT_THEME } from '../config.js';

export class Renderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentCode = '';
        this.currentTheme = { ...DEFAULT_THEME };
        this.diagramId = 0;
        this.onDiagramTypeChange = null;
        this.currentDiagramType = DIAGRAM_TYPES.UNKNOWN;

        this.initMermaid();
    }

    initMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: this.currentTheme,
            securityLevel: 'strict', // Prevents external resource loading
            flowchart: {
                useMaxWidth: true,
                htmlLabels: false // Use SVG labels to avoid font loading issues
            },
            sequence: {
                useMaxWidth: true
            },
            gantt: {
                useMaxWidth: true
            }
        });
    }

    async render(code) {
        if (!code || !code.trim()) {
            this.container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Enter Mermaid code to see your diagram</div></div>';
            return { success: true, diagramType: DIAGRAM_TYPES.UNKNOWN };
        }

        this.currentCode = code;
        const diagramType = this.detectDiagramType(code);

        // Notify if diagram type changed
        if (diagramType !== this.currentDiagramType) {
            this.currentDiagramType = diagramType;
            if (this.onDiagramTypeChange) {
                this.onDiagramTypeChange(diagramType);
            }
        }

        try {
            // Generate unique ID for this render
            this.diagramId++;
            const id = `mermaid-diagram-${this.diagramId}`;

            // Render the diagram
            const { svg } = await mermaid.render(id, code);
            this.container.innerHTML = svg;

            return { success: true, diagramType };
        } catch (error) {
            console.error('Mermaid render error:', error);
            return {
                success: false,
                error: this.formatError(error),
                diagramType
            };
        }
    }

    async updateTheme(themeVariables) {
        this.currentTheme = { ...this.currentTheme, ...themeVariables };

        // Reinitialize mermaid with new theme
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: this.currentTheme,
            securityLevel: 'strict',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: false
            }
        });

        // Re-render current diagram
        if (this.currentCode) {
            return await this.render(this.currentCode);
        }
        return { success: true };
    }

    setTheme(fullTheme) {
        this.currentTheme = { ...fullTheme };
    }

    getCurrentTheme() {
        return { ...this.currentTheme };
    }

    detectDiagramType(code) {
        const trimmed = code.trim().toLowerCase();

        if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) {
            return DIAGRAM_TYPES.FLOWCHART;
        }
        if (trimmed.startsWith('sequencediagram')) {
            return DIAGRAM_TYPES.SEQUENCE;
        }
        if (trimmed.startsWith('gantt')) {
            return DIAGRAM_TYPES.GANTT;
        }
        if (trimmed.startsWith('pie')) {
            return DIAGRAM_TYPES.PIE;
        }
        if (trimmed.startsWith('classdiagram') || trimmed.startsWith('classDiagram')) {
            return DIAGRAM_TYPES.CLASS;
        }
        if (trimmed.startsWith('statediagram')) {
            return DIAGRAM_TYPES.STATE;
        }
        if (trimmed.startsWith('erdiagram')) {
            return DIAGRAM_TYPES.ER;
        }
        if (trimmed.startsWith('mindmap')) {
            return DIAGRAM_TYPES.MINDMAP;
        }

        return DIAGRAM_TYPES.UNKNOWN;
    }

    formatError(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error.message) {
            // Extract line number if available
            const lineMatch = error.message.match(/line\s*(\d+)/i);
            if (lineMatch) {
                return `Error on line ${lineMatch[1]}: ${error.message}`;
            }
            return error.message;
        }
        return 'An error occurred while rendering the diagram';
    }

    getSvg() {
        return this.container.querySelector('svg');
    }

    getSvgString() {
        const svg = this.getSvg();
        if (!svg) return null;

        // Clone the SVG to avoid modifying the original
        const clone = svg.cloneNode(true);

        // Ensure proper namespace
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        return new XMLSerializer().serializeToString(clone);
    }

    getCurrentCode() {
        return this.currentCode;
    }

    getCurrentDiagramType() {
        return this.currentDiagramType;
    }

    onTypeChange(callback) {
        this.onDiagramTypeChange = callback;
    }
}
