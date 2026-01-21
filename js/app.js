// Main Application Entry Point

import { Editor } from './modules/editor.js';
import { Renderer } from './modules/renderer.js';
import { ThemeBuilder } from './modules/theme-builder.js';
import { ColorPanel } from './modules/color-panel.js';
import { AspectRatio } from './modules/aspect-ratio.js';
import { PngExporter } from './modules/export-png.js';
import { PdfExporter } from './modules/export-pdf.js';
import { FileManager } from './modules/file-manager.js';
import { UrlManager } from './modules/url-manager.js';
import { TEMPLATES } from './config.js';

class MermaidVisualizer {
    constructor() {
        this.editor = null;
        this.renderer = null;
        this.themeBuilder = null;
        this.colorPanel = null;
        this.aspectRatio = null;
        this.pngExporter = null;
        this.pdfExporter = null;
        this.fileManager = null;
        this.urlManager = null;

        this.scale = 2; // Default export scale

        this.init();
    }

    async init() {
        // Wait for Mermaid to be ready
        await this.waitForMermaid();

        // Initialize modules
        this.themeBuilder = new ThemeBuilder();
        this.renderer = new Renderer('mermaid-preview');
        this.editor = new Editor('mermaid-input', 'template-select', 'error-display');
        this.colorPanel = new ColorPanel(this.themeBuilder);
        this.aspectRatio = new AspectRatio();
        this.pngExporter = new PngExporter(this.renderer, this.aspectRatio);
        this.pdfExporter = new PdfExporter(this.pngExporter, this.renderer);
        this.fileManager = new FileManager();
        this.urlManager = new UrlManager();

        // Wire up event handlers
        this.setupEventHandlers();

        // Show toast container
        this.createToastContainer();

        // Check if loading from shared URL, otherwise load default template
        const loadedFromUrl = await this.loadFromUrl();
        if (!loadedFromUrl) {
            this.editor.setCode(TEMPLATES.flowchart);
        }

        console.log('Mermaid Visualizer initialized');
    }

    waitForMermaid() {
        return new Promise((resolve) => {
            if (typeof mermaid !== 'undefined') {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (typeof mermaid !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    setupEventHandlers() {
        // Editor changes -> render diagram
        this.editor.onChange(async (code) => {
            const result = await this.renderer.render(code);
            if (!result.success) {
                this.editor.showError(result.error);
            } else {
                this.editor.hideError();
                // Update PDF warning after successful render
                this.updatePdfWarning();
            }
        });

        // Color changes -> update theme and re-render
        this.colorPanel.onChange(async (theme) => {
            await this.renderer.updateTheme(theme);
        });

        // Preset theme changes -> update and re-render
        this.colorPanel.onPreset(async (presetName, theme) => {
            await this.renderer.updateTheme(theme);
        });

        // Diagram type changes -> update color panel
        this.renderer.onTypeChange((diagramType) => {
            this.colorPanel.updateDiagramSpecificColors(diagramType);
        });

        // Aspect ratio changes -> currently just for export
        this.aspectRatio.onRatioChange((ratio) => {
            // Ratio is applied during export
        });

        // Scale buttons
        document.querySelectorAll('.btn-scale').forEach(btn => {
            btn.addEventListener('click', () => {
                const scale = parseInt(btn.dataset.scale);
                this.setScale(scale);

                // Update button states
                document.querySelectorAll('.btn-scale').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // PDF options
        document.getElementById('pdf-mode').addEventListener('change', (e) => {
            this.pdfExporter.setMode(e.target.value);
            this.updatePdfWarning();
        });

        document.getElementById('pdf-margin').addEventListener('input', (e) => {
            const margin = parseInt(e.target.value);
            document.getElementById('margin-value').textContent = `${margin}mm`;
            this.pdfExporter.setMargin(margin);
            this.updatePdfWarning();
        });

        document.getElementById('pdf-size').addEventListener('change', (e) => {
            this.pdfExporter.setPageSize(e.target.value);
            this.updatePdfWarning();
        });

        document.getElementById('pdf-orientation').addEventListener('change', (e) => {
            this.pdfExporter.setOrientation(e.target.value);
            this.updatePdfWarning();
        });

        // Export buttons
        document.getElementById('btn-export-png').addEventListener('click', () => {
            this.exportPng();
        });

        document.getElementById('btn-export-pdf').addEventListener('click', () => {
            this.exportPdf();
        });

        // Save/Load/Share buttons
        document.getElementById('btn-share').addEventListener('click', () => {
            this.shareUrl();
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('btn-load').addEventListener('click', () => {
            this.loadProject();
        });
    }

    setScale(scale) {
        this.scale = scale;
        this.pngExporter.setScale(scale);
    }

    async exportPng() {
        try {
            const filename = this.generateFilename('png');
            await this.pngExporter.export(filename);
            this.showToast('PNG exported successfully', 'success');
        } catch (error) {
            console.error('PNG export error:', error);
            this.showToast(`Export failed: ${error.message}`, 'error');
        }
    }

    async exportPdf() {
        try {
            const filename = this.generateFilename('pdf');
            const result = await this.pdfExporter.export(filename);
            if (result.pages && result.pages > 1) {
                this.showToast(`PDF exported (${result.pages} pages)`, 'success');
            } else {
                this.showToast('PDF exported successfully', 'success');
            }
        } catch (error) {
            console.error('PDF export error:', error);
            this.showToast(`Export failed: ${error.message}`, 'error');
        }
    }

    async saveProject() {
        try {
            const code = this.editor.getCode();
            const theme = this.colorPanel.getTheme();
            const aspectRatio = this.aspectRatio.getRatioString();

            const result = await this.fileManager.save(code, theme, aspectRatio);

            if (result.success) {
                this.showToast(`Project saved: ${result.fileName}`, 'success');
            } else if (!result.cancelled) {
                this.showToast('Failed to save project', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showToast(`Save failed: ${error.message}`, 'error');
        }
    }

    async loadProject() {
        try {
            const fileInput = document.getElementById('file-input');
            const result = await this.fileManager.loadFromInput(fileInput);

            if (result.success) {
                const { data } = result;

                // Load code
                this.editor.setCode(data.code);

                // Load theme
                if (data.theme && data.theme.variables) {
                    this.colorPanel.loadFromTheme(data.theme.variables);
                    await this.renderer.updateTheme(data.theme.variables);
                }

                // Load aspect ratio
                if (data.aspectRatio) {
                    this.aspectRatio.loadRatio(data.aspectRatio);
                }

                this.showToast(`Project loaded: ${result.fileName}`, 'success');
            } else if (result.error) {
                this.showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Load error:', error);
            this.showToast(`Load failed: ${error.message}`, 'error');
        }
    }

    async loadFromUrl() {
        const urlData = this.urlManager.parseUrl();

        if (!urlData.hasData) {
            return false;
        }

        try {
            // Load code (or default template if no code provided)
            if (urlData.code) {
                this.editor.setCode(urlData.code);
            } else {
                // No code in URL, load default template
                this.editor.setCode(TEMPLATES.flowchart);
            }

            // Load theme
            if (urlData.themePreset) {
                this.colorPanel.applyPreset(urlData.themePreset);
                await this.renderer.updateTheme(this.colorPanel.getTheme());
            } else if (urlData.themeVariables) {
                this.colorPanel.loadFromTheme(urlData.themeVariables);
                await this.renderer.updateTheme(urlData.themeVariables);
            }

            // Load aspect ratio
            if (urlData.aspectRatio) {
                this.aspectRatio.loadRatio(urlData.aspectRatio);
            }

            // Clear URL params to keep it clean
            this.urlManager.clearUrlParams();

            this.showToast('Diagram loaded from shared URL', 'success');
            return true;
        } catch (error) {
            console.error('Error loading from URL:', error);
            return false;
        }
    }

    shareUrl() {
        const code = this.editor.getCode();
        const theme = {
            preset: this.colorPanel.getCurrentPreset(),
            variables: this.colorPanel.getTheme()
        };
        const ratio = this.aspectRatio.getRatioString();

        const result = this.urlManager.generateShareUrl(code, theme, ratio);

        // Warn if URL is very long
        if (result.isLong) {
            this.showToast(`URL is ${result.length} chars (may be too long for some browsers)`, 'warning');
        }

        // Copy to clipboard
        navigator.clipboard.writeText(result.url).then(() => {
            this.showToast('Share URL copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback: show URL in prompt
            prompt('Copy this URL to share:', result.url);
        });
    }

    generateFilename(extension) {
        const date = new Date();
        const timestamp = date.toISOString().slice(0, 10);
        return `mermaid-diagram-${timestamp}.${extension}`;
    }

    createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    updatePdfWarning() {
        const warningEl = document.getElementById('pdf-warning');
        const scaleEl = document.getElementById('scale-percent');
        const previewEl = document.getElementById('export-preview');
        const modeEl = document.getElementById('pdf-mode');

        try {
            const exportInfo = this.pdfExporter.calculateExportInfo();

            // Update export preview
            if (previewEl && exportInfo.pages > 0) {
                const orientationText = exportInfo.orientation.charAt(0).toUpperCase() + exportInfo.orientation.slice(1);
                const sizeText = this.pdfExporter.pageSize.toUpperCase();

                if (exportInfo.pages === 1) {
                    previewEl.textContent = `Will export as 1 page (${sizeText} ${orientationText})`;
                } else {
                    const dirText = exportInfo.direction === 'horizontal' ? 'left to right' : 'top to bottom';
                    previewEl.textContent = `Will export as ${exportInfo.pages} pages (${sizeText} ${orientationText}, ${dirText})`;
                }
            } else if (previewEl) {
                previewEl.textContent = '';
            }

            // Only show warning in fit mode when scale is too small
            if (modeEl.value === 'fit' && !exportInfo.readable) {
                const scalePercent = Math.round(exportInfo.scale * 100);
                scaleEl.textContent = scalePercent;
                warningEl.classList.remove('hidden');
            } else {
                warningEl.classList.add('hidden');
            }
        } catch (error) {
            // Hide warning and clear preview if there's an error
            warningEl.classList.add('hidden');
            if (previewEl) previewEl.textContent = '';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MermaidVisualizer();
});
