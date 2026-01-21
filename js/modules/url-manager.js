// URL Manager module - handles sharing diagrams via URL

export class UrlManager {
    constructor() {
        this.presetThemes = ['default', 'dark', 'forest', 'neutral'];
        this.maxUrlLength = 2000; // Safe limit for most browsers
    }

    // Generate shareable URL
    generateShareUrl(code, theme, aspectRatio) {
        const params = new URLSearchParams();

        // Compress and encode the code
        const compressedCode = LZString.compressToEncodedURIComponent(code);
        params.set('code', compressedCode);

        // Theme: use preset name if possible, otherwise compress full theme
        if (theme.preset && this.presetThemes.includes(theme.preset)) {
            params.set('theme', theme.preset);
        } else if (theme.variables) {
            const compressedTheme = LZString.compressToEncodedURIComponent(
                JSON.stringify(theme.variables)
            );
            params.set('theme', compressedTheme);
        }

        // Aspect ratio (simple string, skip if auto)
        if (aspectRatio && aspectRatio !== 'auto') {
            params.set('ratio', aspectRatio);
        }

        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

        return {
            url,
            length: url.length,
            isLong: url.length > this.maxUrlLength
        };
    }

    // Parse URL and return data
    parseUrl() {
        const params = new URLSearchParams(window.location.search);
        const result = { hasData: false };

        const codeParam = params.get('code');
        if (codeParam) {
            try {
                result.code = LZString.decompressFromEncodedURIComponent(codeParam);
                if (result.code) {
                    result.hasData = true;
                }
            } catch (e) {
                console.warn('Failed to decompress code from URL:', e);
            }
        }

        const themeParam = params.get('theme');
        if (themeParam) {
            if (this.presetThemes.includes(themeParam)) {
                result.themePreset = themeParam;
                result.hasData = true;
            } else {
                try {
                    const decompressed = LZString.decompressFromEncodedURIComponent(themeParam);
                    if (decompressed) {
                        result.themeVariables = JSON.parse(decompressed);
                        result.hasData = true;
                    }
                } catch (e) {
                    console.warn('Failed to parse theme from URL:', e);
                }
            }
        }

        const ratioParam = params.get('ratio');
        if (ratioParam) {
            result.aspectRatio = ratioParam;
            result.hasData = true;
        }

        return result;
    }

    // Check if current URL has share data
    hasShareData() {
        const params = new URLSearchParams(window.location.search);
        return params.has('code');
    }

    // Clear URL params without page reload
    clearUrlParams() {
        window.history.replaceState({}, '', window.location.pathname);
    }
}
