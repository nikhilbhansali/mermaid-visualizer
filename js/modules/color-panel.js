// Color Panel module - handles color picker UI

import { DIAGRAM_SPECIFIC_COLORS, DEFAULT_THEME } from '../config.js';

export class ColorPanel {
    constructor(themeBuilder) {
        this.themeBuilder = themeBuilder;
        this.colorInputs = {};
        this.presetButtons = document.querySelectorAll('.btn-preset');
        this.specificColorsSection = document.getElementById('diagram-specific-colors');
        this.specificColorsGrid = document.getElementById('specific-colors-grid');
        this.onColorChange = null;
        this.onPresetChange = null;

        this.init();
    }

    init() {
        // Initialize general and node color inputs
        this.initColorInputs();

        // Handle preset theme buttons
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const themeName = btn.dataset.theme;
                this.selectPreset(themeName);
            });
        });
    }

    initColorInputs() {
        // General colors
        const generalIds = ['background', 'primaryText', 'lineColor'];
        const nodeIds = ['primaryColor', 'primaryBorderColor', 'secondaryColor', 'tertiaryColor'];

        [...generalIds, ...nodeIds].forEach(id => {
            const input = document.getElementById(`color-${id}`);
            if (input) {
                this.colorInputs[id] = input;

                // Set initial value from theme
                const themeKey = id === 'primaryText' ? 'primaryTextColor' : id;
                input.value = this.themeBuilder.getColor(themeKey);

                input.addEventListener('input', (e) => {
                    const themeKey = id === 'primaryText' ? 'primaryTextColor' : id;
                    this.themeBuilder.setColor(themeKey, e.target.value);
                    this.clearPresetSelection();
                    if (this.onColorChange) {
                        this.onColorChange(this.themeBuilder.getTheme());
                    }
                });
            }
        });
    }

    updateDiagramSpecificColors(diagramType) {
        const specificColors = DIAGRAM_SPECIFIC_COLORS[diagramType];

        // Clear existing specific color inputs
        this.specificColorsGrid.innerHTML = '';

        if (!specificColors || Object.keys(specificColors).length === 0) {
            this.specificColorsSection.classList.add('hidden');
            return;
        }

        this.specificColorsSection.classList.remove('hidden');

        // Create color inputs for diagram-specific colors
        Object.entries(specificColors).forEach(([key, label]) => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';

            const labelEl = document.createElement('label');
            labelEl.textContent = label;

            const input = document.createElement('input');
            input.type = 'color';
            input.id = `color-specific-${key}`;
            input.value = this.themeBuilder.getColor(key);

            input.addEventListener('input', (e) => {
                this.themeBuilder.setColor(key, e.target.value);
                this.clearPresetSelection();
                if (this.onColorChange) {
                    this.onColorChange(this.themeBuilder.getTheme());
                }
            });

            colorItem.appendChild(labelEl);
            colorItem.appendChild(input);
            this.specificColorsGrid.appendChild(colorItem);

            // Store reference
            this.colorInputs[`specific-${key}`] = input;
        });
    }

    selectPreset(themeName) {
        // Update button states
        this.presetButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });

        // Apply preset to theme builder
        const theme = this.themeBuilder.applyPreset(themeName);
        if (theme) {
            this.updateInputsFromTheme(theme);
            if (this.onPresetChange) {
                this.onPresetChange(themeName, theme);
            }
        }
    }

    clearPresetSelection() {
        this.presetButtons.forEach(btn => {
            btn.classList.remove('active');
        });
    }

    updateInputsFromTheme(theme) {
        // Update general and node color inputs
        Object.entries(this.colorInputs).forEach(([id, input]) => {
            let themeKey;
            if (id === 'primaryText') {
                themeKey = 'primaryTextColor';
            } else if (id.startsWith('specific-')) {
                themeKey = id.replace('specific-', '');
            } else {
                themeKey = id;
            }

            if (theme[themeKey]) {
                input.value = theme[themeKey];
            }
        });
    }

    loadFromTheme(theme) {
        this.themeBuilder.loadTheme(theme);
        this.updateInputsFromTheme(theme);
        this.clearPresetSelection();
    }

    onChange(callback) {
        this.onColorChange = callback;
    }

    onPreset(callback) {
        this.onPresetChange = callback;
    }

    getTheme() {
        return this.themeBuilder.getTheme();
    }

    // Get the currently active preset name, or null if custom
    getCurrentPreset() {
        const activeBtn = document.querySelector('.btn-preset.active');
        return activeBtn ? activeBtn.dataset.theme : null;
    }

    // Apply a preset by name (for URL loading)
    applyPreset(presetName) {
        this.selectPreset(presetName);
    }
}
