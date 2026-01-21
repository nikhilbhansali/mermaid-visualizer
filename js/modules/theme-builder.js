// Theme Builder module - converts color selections to Mermaid themeVariables

import { DEFAULT_THEME, PRESET_THEMES } from '../config.js';

export class ThemeBuilder {
    constructor() {
        this.currentTheme = { ...DEFAULT_THEME };
    }

    // Get the full theme object
    getTheme() {
        return { ...this.currentTheme };
    }

    // Set a single color variable
    setColor(variable, color) {
        this.currentTheme[variable] = color;
        return this.currentTheme;
    }

    // Set multiple colors at once
    setColors(colors) {
        this.currentTheme = { ...this.currentTheme, ...colors };
        return this.currentTheme;
    }

    // Apply a preset theme
    applyPreset(presetName) {
        if (PRESET_THEMES[presetName]) {
            this.currentTheme = { ...PRESET_THEMES[presetName] };
            return this.currentTheme;
        }
        return null;
    }

    // Reset to default theme
    reset() {
        this.currentTheme = { ...DEFAULT_THEME };
        return this.currentTheme;
    }

    // Load theme from saved state
    loadTheme(theme) {
        this.currentTheme = { ...DEFAULT_THEME, ...theme };
        return this.currentTheme;
    }

    // Get color value for a specific variable
    getColor(variable) {
        return this.currentTheme[variable] || DEFAULT_THEME[variable] || '#000000';
    }

    // Generate derived colors (e.g., darken/lighten variants)
    static adjustColor(hex, amount) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Adjust
        const newR = Math.max(0, Math.min(255, r + amount));
        const newG = Math.max(0, Math.min(255, g + amount));
        const newB = Math.max(0, Math.min(255, b + amount));

        // Convert back to hex
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }

    // Check if a color is dark (for contrast calculations)
    static isColorDark(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Using relative luminance formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
    }

    // Get contrasting text color (black or white)
    static getContrastColor(hex) {
        return ThemeBuilder.isColorDark(hex) ? '#ffffff' : '#333333';
    }
}
