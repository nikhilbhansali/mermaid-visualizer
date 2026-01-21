// File Manager module - handles save/load of .mermproj files

import { FILE_VERSION } from '../config.js';

export class FileManager {
    constructor() {
        this.currentFileName = null;
        this.supportsFileSystemAccess = 'showSaveFilePicker' in window;
    }

    // Create project data structure
    createProjectData(code, theme, aspectRatio, name = 'Untitled') {
        return {
            version: FILE_VERSION,
            name: name,
            code: code,
            theme: { variables: theme },
            aspectRatio: aspectRatio,
            savedAt: new Date().toISOString()
        };
    }

    // Save project to file
    async save(code, theme, aspectRatio, name = 'diagram') {
        const projectData = this.createProjectData(code, theme, aspectRatio, name);
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        if (this.supportsFileSystemAccess) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${name}.mermproj`,
                    types: [{
                        description: 'Mermaid Project',
                        accept: { 'application/json': ['.mermproj'] }
                    }]
                });

                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();

                this.currentFileName = handle.name;
                return { success: true, fileName: handle.name };
            } catch (err) {
                if (err.name === 'AbortError') {
                    return { success: false, cancelled: true };
                }
                throw err;
            }
        } else {
            // Fallback for browsers without File System Access API
            this.downloadFile(blob, `${name}.mermproj`);
            return { success: true, fileName: `${name}.mermproj` };
        }
    }

    // Load project from file
    async load(file = null) {
        if (this.supportsFileSystemAccess && !file) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Mermaid Project',
                        accept: { 'application/json': ['.mermproj'] }
                    }]
                });

                file = await handle.getFile();
                this.currentFileName = file.name;
            } catch (err) {
                if (err.name === 'AbortError') {
                    return { success: false, cancelled: true };
                }
                throw err;
            }
        }

        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            // Validate project data
            if (!this.validateProjectData(projectData)) {
                return { success: false, error: 'Invalid project file format' };
            }

            return {
                success: true,
                data: projectData,
                fileName: file.name
            };
        } catch (err) {
            return { success: false, error: `Failed to parse project file: ${err.message}` };
        }
    }

    // Load from file input element
    async loadFromInput(inputElement) {
        return new Promise((resolve) => {
            const handleChange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const result = await this.load(file);
                    resolve(result);
                } else {
                    resolve({ success: false, cancelled: true });
                }
                // Reset input
                inputElement.value = '';
                inputElement.removeEventListener('change', handleChange);
            };

            inputElement.addEventListener('change', handleChange);
            inputElement.click();
        });
    }

    // Validate project data structure
    validateProjectData(data) {
        if (!data || typeof data !== 'object') return false;
        if (typeof data.code !== 'string') return false;
        if (!data.theme || typeof data.theme !== 'object') return false;

        return true;
    }

    // Download file fallback
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Get current file name
    getCurrentFileName() {
        return this.currentFileName;
    }

    // Check if File System Access API is supported
    isFileSystemAccessSupported() {
        return this.supportsFileSystemAccess;
    }
}
