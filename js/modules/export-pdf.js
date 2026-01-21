// PDF Export module - uses svg2pdf.js for direct SVG→PDF conversion
// This bypasses canvas entirely, avoiding tainted canvas security issues

export class PdfExporter {
    constructor(pngExporter, renderer) {
        this.pngExporter = pngExporter;
        this.renderer = renderer;
        this.pageSize = 'a4';
        this.orientation = 'auto'; // 'auto', 'landscape', 'portrait'
        this.margin = 10; // Default margin in mm
        this.mode = 'fit'; // 'fit', 'multi-auto', 'multi-vertical', 'multi-horizontal'
        this.minReadableScale = 0.3; // 30% minimum scale threshold
        this.overlap = 10; // mm overlap for multi-page continuity
    }

    setPageSize(size) {
        this.pageSize = size;
    }

    setOrientation(orientation) {
        this.orientation = orientation;
    }

    setMargin(margin) {
        this.margin = Math.max(5, Math.min(30, margin));
    }

    setMode(mode) {
        const validModes = ['fit', 'multi-auto', 'multi-vertical', 'multi-horizontal'];
        this.mode = validModes.includes(mode) ? mode : 'fit';
    }

    // Get SVG dimensions from the renderer
    getSvgDimensions() {
        const svg = this.renderer.getSvg();
        if (!svg) return null;

        const bbox = svg.getBBox();
        return {
            width: bbox.width,
            height: bbox.height,
            x: bbox.x,
            y: bbox.y,
            aspect: bbox.width / bbox.height
        };
    }

    // Determine best orientation based on diagram shape
    getEffectiveOrientation(svgDims) {
        if (this.orientation !== 'auto') {
            return this.orientation;
        }
        // Auto: use landscape for wide diagrams, portrait for tall
        return svgDims.aspect > 1 ? 'landscape' : 'portrait';
    }

    // Calculate export info (pages, orientation, scale)
    calculateExportInfo() {
        const svgDims = this.getSvgDimensions();
        if (!svgDims) {
            return { pages: 0, orientation: this.orientation, scale: 1, readable: true };
        }

        const orientation = this.getEffectiveOrientation(svgDims);
        const pageInfo = this.getPageDimensions(orientation);
        const contentWidth = pageInfo.width - (this.margin * 2);
        const contentHeight = pageInfo.height - (this.margin * 2) - 8; // 8mm for footer

        if (this.mode === 'fit') {
            // Calculate scale to fit on one page
            const scaleX = contentWidth / svgDims.width;
            const scaleY = contentHeight / svgDims.height;
            const scale = Math.min(scaleX, scaleY);

            return {
                pages: 1,
                orientation,
                scale,
                readable: scale >= this.minReadableScale,
                direction: null
            };
        }

        // Multi-page mode
        let direction = this.mode === 'multi-auto'
            ? (svgDims.aspect > (contentWidth / contentHeight) ? 'horizontal' : 'vertical')
            : (this.mode === 'multi-horizontal' ? 'horizontal' : 'vertical');

        let pages;
        if (direction === 'vertical') {
            // Scale to fit width, slice vertically
            const scale = contentWidth / svgDims.width;
            const scaledHeight = svgDims.height * scale;
            const effectiveHeight = contentHeight - this.overlap;
            pages = Math.ceil((scaledHeight - this.overlap) / effectiveHeight);
        } else {
            // Scale to fit height, slice horizontally
            const scale = contentHeight / svgDims.height;
            const scaledWidth = svgDims.width * scale;
            const effectiveWidth = contentWidth - this.overlap;
            pages = Math.ceil((scaledWidth - this.overlap) / effectiveWidth);
        }

        return {
            pages: Math.max(1, pages),
            orientation,
            scale: 1, // Multi-page maintains original scale
            readable: true,
            direction
        };
    }

    // Get page dimensions in mm for the current page size
    getPageDimensions(orientation) {
        const sizes = {
            'a4': { width: 210, height: 297 },
            'a3': { width: 297, height: 420 },
            'letter': { width: 215.9, height: 279.4 },
            'legal': { width: 215.9, height: 355.6 }
        };

        const size = sizes[this.pageSize] || sizes.a4;

        if (orientation === 'landscape') {
            return { width: size.height, height: size.width };
        }
        return size;
    }

    async export(filename = 'diagram.pdf') {
        if (this.mode === 'fit') {
            return this.exportFitToPage(filename);
        }
        return this.exportMultiPage(filename);
    }

    // Prepare SVG for PDF export - clone and inline styles as attributes
    prepareSvgForPdf(svg) {
        const clone = svg.cloneNode(true);

        // Ensure proper namespace
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // svg2pdf.js needs attributes, not just CSS styles
        // Inline all computed styles as SVG attributes
        const elements = clone.querySelectorAll('*');
        elements.forEach(el => {
            const computed = window.getComputedStyle(el);

            // Get fill color
            const fill = computed.getPropertyValue('fill');
            if (fill && fill !== 'none' && fill !== '') {
                el.setAttribute('fill', fill);
            }

            // Get stroke color
            const stroke = computed.getPropertyValue('stroke');
            if (stroke && stroke !== 'none' && stroke !== '') {
                el.setAttribute('stroke', stroke);
            }

            // Get stroke width
            const strokeWidth = computed.getPropertyValue('stroke-width');
            if (strokeWidth && strokeWidth !== '0' && strokeWidth !== '0px') {
                el.setAttribute('stroke-width', strokeWidth);
            }

            // Get opacity
            const opacity = computed.getPropertyValue('opacity');
            if (opacity && opacity !== '1') {
                el.setAttribute('opacity', opacity);
            }
        });

        // Handle text elements specifically - svg2pdf needs fill for text color
        clone.querySelectorAll('text, tspan').forEach(el => {
            const computed = window.getComputedStyle(el);

            // Text color in SVG is controlled by 'fill', not 'color'
            let textColor = computed.getPropertyValue('fill');
            if (!textColor || textColor === 'none' || textColor === '') {
                textColor = computed.getPropertyValue('color');
            }
            if (textColor && textColor !== 'none') {
                el.setAttribute('fill', textColor);
            }

            // Font properties
            const fontSize = computed.getPropertyValue('font-size');
            if (fontSize) {
                el.setAttribute('font-size', fontSize);
            }

            const fontWeight = computed.getPropertyValue('font-weight');
            if (fontWeight && fontWeight !== 'normal' && fontWeight !== '400') {
                el.setAttribute('font-weight', fontWeight);
            }

            // Use system fonts for PDF compatibility
            el.setAttribute('font-family', 'Helvetica, Arial, sans-serif');
        });

        // Ensure shapes have proper fill colors
        clone.querySelectorAll('rect, polygon, circle, ellipse, path').forEach(el => {
            const computed = window.getComputedStyle(el);
            const fill = computed.getPropertyValue('fill');

            // If fill is not set or is 'none', check for background-color
            if (!el.getAttribute('fill') || el.getAttribute('fill') === 'none') {
                if (fill && fill !== 'none') {
                    el.setAttribute('fill', fill);
                }
            }
        });

        // Remove style elements that might conflict
        clone.querySelectorAll('style').forEach(styleEl => {
            styleEl.remove();
        });

        return clone;
    }

    async exportFitToPage(filename = 'diagram.pdf') {
        // Use PNG-based export for reliable rendering
        // svg2pdf.js has issues with Mermaid's CSS-based styling
        return this.exportFitToPagePng(filename);
    }

    // Fallback PNG-based export
    async exportFitToPagePng(filename = 'diagram.pdf') {
        const { jsPDF } = window.jspdf;
        const imageData = await this.pngExporter.toDataUrl({ scale: 3 });

        if (!imageData) {
            throw new Error('No diagram to export');
        }

        const svgDims = this.getSvgDimensions();
        const orientation = this.getEffectiveOrientation(svgDims);

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: this.pageSize
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (this.margin * 2);
        const contentHeight = pageHeight - (this.margin * 2);

        const imgAspect = imageData.width / imageData.height;
        const pageAspect = contentWidth / contentHeight;

        let imgWidth, imgHeight;
        if (imgAspect > pageAspect) {
            imgWidth = contentWidth;
            imgHeight = contentWidth / imgAspect;
        } else {
            imgHeight = contentHeight;
            imgWidth = contentHeight * imgAspect;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imageData.dataUrl, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(filename);

        return { success: true, pages: 1 };
    }

    async exportMultiPage(filename = 'diagram.pdf') {
        // Use PNG-based export for reliable rendering
        // svg2pdf.js has issues with Mermaid's CSS-based styling
        return this.exportMultiPagePng(filename);
    }

    // Fallback PNG-based multi-page export
    async exportMultiPagePng(filename = 'diagram.pdf') {
        const { jsPDF } = window.jspdf;
        const imageData = await this.pngExporter.toDataUrl({ scale: 3 });

        if (!imageData) {
            throw new Error('No diagram to export');
        }

        const svgDims = this.getSvgDimensions();
        const exportInfo = this.calculateExportInfo();

        const pdf = new jsPDF({
            orientation: exportInfo.orientation,
            unit: 'mm',
            format: this.pageSize
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (this.margin * 2);
        const contentHeight = pageHeight - (this.margin * 2) - 8;

        // Load image
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageData.dataUrl;
        });

        const isHorizontal = exportInfo.direction === 'horizontal';
        const totalPages = exportInfo.pages;

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) {
                pdf.addPage();
            }

            // Create canvas for this slice
            const sliceCanvas = document.createElement('canvas');
            const ctx = sliceCanvas.getContext('2d');

            let srcX, srcY, srcW, srcH, dstW, dstH;

            if (isHorizontal) {
                const scale = contentHeight / (imageData.height / 3);
                const effectiveWidth = (contentWidth - this.overlap) / scale;

                srcY = 0;
                srcH = imageData.height;
                srcX = page * effectiveWidth * 3;
                srcW = Math.min((contentWidth / scale) * 3, imageData.width - srcX);

                sliceCanvas.width = srcW;
                sliceCanvas.height = srcH;
                dstW = srcW * scale / 3;
                dstH = contentHeight;
            } else {
                const scale = contentWidth / (imageData.width / 3);
                const effectiveHeight = (contentHeight - this.overlap) / scale;

                srcX = 0;
                srcW = imageData.width;
                srcY = page * effectiveHeight * 3;
                srcH = Math.min((contentHeight / scale) * 3, imageData.height - srcY);

                sliceCanvas.width = srcW;
                sliceCanvas.height = srcH;
                dstW = contentWidth;
                dstH = srcH * scale / 3;
            }

            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

            const x = this.margin + (contentWidth - dstW) / 2;
            const y = this.margin;

            pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', x, y, dstW, dstH);

            // Footer
            pdf.setFontSize(9);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Page ${page + 1} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }

        pdf.save(filename);
        return { success: true, pages: totalPages };
    }

    // Static helper methods
    static getPageSizes() {
        return [
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'Letter' },
            { value: 'a3', label: 'A3' },
            { value: 'legal', label: 'Legal' }
        ];
    }

    static getOrientations() {
        return [
            { value: 'auto', label: 'Auto' },
            { value: 'landscape', label: 'Landscape' },
            { value: 'portrait', label: 'Portrait' }
        ];
    }

    static getModes() {
        return [
            { value: 'fit', label: 'Fit to Single Page' },
            { value: 'multi-auto', label: 'Multi-Page (Auto)' },
            { value: 'multi-vertical', label: 'Multi-Page (Vertical)' },
            { value: 'multi-horizontal', label: 'Multi-Page (Horizontal)' }
        ];
    }
}
