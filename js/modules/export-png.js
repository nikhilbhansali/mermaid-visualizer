// PNG Export module - handles PNG export with style inlining

export class PngExporter {
    constructor(renderer, aspectRatio) {
        this.renderer = renderer;
        this.aspectRatio = aspectRatio;
        this.scale = 2; // Default 2x scale
    }

    setScale(scale) {
        this.scale = scale;
    }

    async export(filename = 'diagram.png') {
        const svg = this.renderer.getSvg();
        if (!svg) {
            throw new Error('No diagram to export');
        }

        // Clone and prepare SVG
        const preparedSvg = this.prepareSvg(svg);

        // Convert SVG to data URL (avoids blob URL cross-origin tainting)
        const svgData = new XMLSerializer().serializeToString(preparedSvg);
        const svgUrl = this.svgToDataUrl(svgData);

        // Create image from SVG
        const img = await this.loadImage(svgUrl);

        // Calculate canvas dimensions
        const width = preparedSvg.getAttribute('width') || img.width;
        const height = preparedSvg.getAttribute('height') || img.height;
        const canvasWidth = parseInt(width) * this.scale;
        const canvasHeight = parseInt(height) * this.scale;

        // Create canvas and draw
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');

        // Fill background
        const bgColor = this.renderer.getCurrentTheme().background || '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw scaled image
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        // Convert to PNG and download
        const pngUrl = canvas.toDataURL('image/png');
        this.downloadFile(pngUrl, filename);

        return { success: true, width: canvasWidth, height: canvasHeight };
    }

    // Convert SVG string to data URL (avoids canvas tainting from blob URLs)
    svgToDataUrl(svgString) {
        // Encode for data URL - handle UTF-8 properly
        const encoded = encodeURIComponent(svgString)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
        return `data:image/svg+xml;charset=utf-8,${encoded}`;
    }

    prepareSvg(svg) {
        // Clone the SVG
        const clone = svg.cloneNode(true);

        // Ensure proper namespace
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // Get current dimensions
        const bbox = svg.getBBox();
        const ratio = this.aspectRatio.getCurrentRatio();

        let width, height;

        if (ratio) {
            // Apply aspect ratio
            const targetAspect = ratio.width / ratio.height;
            const originalAspect = bbox.width / bbox.height;

            if (originalAspect > targetAspect) {
                width = bbox.width;
                height = bbox.width / targetAspect;
            } else {
                height = bbox.height;
                width = bbox.height * targetAspect;
            }
        } else {
            // Use original dimensions with padding
            width = bbox.width + 40;
            height = bbox.height + 40;
        }

        // Add padding
        const padding = 20;
        width += padding * 2;
        height += padding * 2;

        // Calculate viewBox to center content
        const offsetX = (width - bbox.width - padding * 2) / 2;
        const offsetY = (height - bbox.height - padding * 2) / 2;

        clone.setAttribute('viewBox', `${bbox.x - padding - offsetX} ${bbox.y - padding - offsetY} ${width} ${height}`);
        clone.setAttribute('width', width);
        clone.setAttribute('height', height);

        // Inline all styles
        this.inlineStyles(clone);

        return clone;
    }

    // System-safe font stack that won't cause canvas tainting
    static SAFE_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    static SAFE_MONO_FONT = '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace';

    inlineStyles(element) {
        // Get all elements
        const elements = element.querySelectorAll('*');

        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const importantStyles = [
                'fill',
                'stroke',
                'stroke-width',
                'stroke-dasharray',
                'font-size',
                'font-weight',
                'text-anchor',
                'dominant-baseline',
                'opacity',
                'visibility'
            ];

            importantStyles.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== 'none' && value !== '') {
                    el.style[prop] = value;
                }
            });
        });

        // Handle specific Mermaid elements
        element.querySelectorAll('.node rect, .node polygon, .node circle, .node ellipse').forEach(el => {
            if (!el.style.fill || el.style.fill === 'none') {
                el.style.fill = '#ffffff';
            }
        });

        // Force system-safe fonts on ALL text elements to prevent canvas tainting
        element.querySelectorAll('text, tspan').forEach(el => {
            const computedFont = window.getComputedStyle(el).fontFamily;
            // Check if it's a monospace font
            if (computedFont.includes('mono') || computedFont.includes('Consolas') || computedFont.includes('Courier')) {
                el.style.fontFamily = PngExporter.SAFE_MONO_FONT;
            } else {
                el.style.fontFamily = PngExporter.SAFE_FONT_FAMILY;
            }
        });

        // Remove any style elements that might reference external fonts
        element.querySelectorAll('style').forEach(styleEl => {
            const css = styleEl.textContent;
            if (css.includes('@font-face') || css.includes('@import')) {
                styleEl.remove();
            }
        });
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // Data URLs don't need crossOrigin - they're always same-origin
            // This avoids canvas tainting issues entirely
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Failed to load image: ' + e.message));
            img.src = src;
        });
    }

    downloadFile(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Get PNG as blob for other uses (e.g., PDF export)
    async toBlob(options = {}) {
        const svg = this.renderer.getSvg();
        if (!svg) return null;

        const preparedSvg = this.prepareSvg(svg);
        const svgData = new XMLSerializer().serializeToString(preparedSvg);
        const svgUrl = this.svgToDataUrl(svgData);

        const img = await this.loadImage(svgUrl);

        const width = parseInt(preparedSvg.getAttribute('width')) || img.width;
        const height = parseInt(preparedSvg.getAttribute('height')) || img.height;
        const scale = options.scale || this.scale;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        const bgColor = this.renderer.getCurrentTheme().background || '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    // Get PNG as data URL for PDF
    async toDataUrl(options = {}) {
        const svg = this.renderer.getSvg();
        if (!svg) return null;

        const preparedSvg = this.prepareSvg(svg);
        const svgData = new XMLSerializer().serializeToString(preparedSvg);
        const svgUrl = this.svgToDataUrl(svgData);

        const img = await this.loadImage(svgUrl);

        const width = parseInt(preparedSvg.getAttribute('width')) || img.width;
        const height = parseInt(preparedSvg.getAttribute('height')) || img.height;
        const scale = options.scale || this.scale;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        const bgColor = this.renderer.getCurrentTheme().background || '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return {
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height
        };
    }

    // Get the prepared SVG element (for direct SVG export or svg2pdf)
    getPreparedSvg() {
        const svg = this.renderer.getSvg();
        if (!svg) return null;
        return this.prepareSvg(svg);
    }
}
