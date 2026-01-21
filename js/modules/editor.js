// Editor module - handles code input and template selection

import { TEMPLATES, DEBOUNCE_DELAY } from '../config.js';

export class Editor {
    constructor(textareaId, templateSelectId, errorDisplayId) {
        this.textarea = document.getElementById(textareaId);
        this.templateSelect = document.getElementById(templateSelectId);
        this.errorDisplay = document.getElementById(errorDisplayId);
        this.debounceTimer = null;
        this.onChangeCallback = null;

        this.init();
    }

    init() {
        // Handle textarea input
        this.textarea.addEventListener('input', () => {
            this.scheduleChange();
        });

        // Handle template selection
        this.templateSelect.addEventListener('change', (e) => {
            const template = e.target.value;
            if (template && TEMPLATES[template]) {
                this.setCode(TEMPLATES[template]);
            }
            // Reset select to placeholder
            e.target.value = '';
        });

        // Handle keyboard shortcuts
        this.textarea.addEventListener('keydown', (e) => {
            // Tab key for indentation
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertAtCursor('    ');
            }
        });
    }

    scheduleChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            if (this.onChangeCallback) {
                this.onChangeCallback(this.getCode());
            }
        }, DEBOUNCE_DELAY);
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    getCode() {
        return this.textarea.value;
    }

    setCode(code) {
        this.textarea.value = code;
        this.hideError();
        if (this.onChangeCallback) {
            this.onChangeCallback(code);
        }
    }

    insertAtCursor(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        this.textarea.value = value.substring(0, start) + text + value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
        this.textarea.focus();

        this.scheduleChange();
    }

    showError(message) {
        this.errorDisplay.textContent = message;
        this.errorDisplay.classList.remove('hidden');
    }

    hideError() {
        this.errorDisplay.textContent = '';
        this.errorDisplay.classList.add('hidden');
    }

    focus() {
        this.textarea.focus();
    }
}
