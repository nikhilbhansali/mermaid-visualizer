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

    // Prepare SVG for PDF export - clone and inline styles
    prepareSvgForPdf(svg) {
        const clone = svg.cloneNode(true);

        // Ensure proper namespace
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // Inline styles using the PNG exporter's method
        if (this.pngExporter && this.pngExporter.inlineStyles) {
            this.pngExporter.inlineStyles(clone);
        }

        return clone;
    }

    async exportFitToPage(filename = 'diagram.pdf') {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }

        const svg = this.renderer.getSvg();
        if (!svg) {
            throw new Error('No diagram to export');
        }

        const svgDims = this.getSvgDimensions();
        const orientation = this.getEffectiveOrientation(svgDims);
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: this.pageSize
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (this.margin * 2);
        const contentHeight = pageHeight - (this.margin * 2);

        // Prepare SVG
        const preparedSvg = this.prepareSvgForPdf(svg);

        // Calculate dimensions to fit
        const scaleX = contentWidth / svgDims.width;
        const scaleY = contentHeight / svgDims.height;
        const scale = Math.min(scaleX, scaleY);

        const finalWidth = svgDims.width * scale;
        const finalHeight = svgDims.height * scale;

        // Center on page
        const x = this.margin + (contentWidth - finalWidth) / 2;
        const y = this.margin + (contentHeight - finalHeight) / 2;

        // Set viewBox to match original SVG dimensions
        preparedSvg.setAttribute('viewBox', `${svgDims.x} ${svgDims.y} ${svgDims.width} ${svgDims.height}`);
        preparedSvg.setAttribute('width', finalWidth);
        preparedSvg.setAttribute('height', finalHeight);

        // Use svg2pdf.js for direct rendering
        try {
            await pdf.svg(preparedSvg, { x, y, width: finalWidth, height: finalHeight });
        } catch (e) {
            // Fallback to PNG method if svg2pdf fails
            console.warn('svg2pdf failed, falling back to PNG method:', e);
            return this.exportFitToPagePng(filename);
        }

        pdf.save(filename);
        return { success: true, pages: 1 };
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
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }

        const svg = this.renderer.getSvg();
        if (!svg) {
            throw new Error('No diagram to export');
        }

        const svgDims = this.getSvgDimensions();
        const exportInfo = this.calculateExportInfo();
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: exportInfo.orientation,
            unit: 'mm',
            format: this.pageSize
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (this.margin * 2);
        const contentHeight = pageHeight - (this.margin * 2) - 8; // Footer space

        const totalPages = exportInfo.pages;
        const isHorizontal = exportInfo.direction === 'horizontal';

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) {
                pdf.addPage();
            }

            // Calculate the slice of SVG to show on this page
            const preparedSvg = this.prepareSvgForPdf(svg);

            let viewBoxX, viewBoxY, viewBoxW, viewBoxH;
            let renderWidth, renderHeight;

            if (isHorizontal) {
                // Horizontal slicing (left to right for wide diagrams)
                const scale = contentHeight / svgDims.height;
                const scaledWidth = svgDims.width * scale;
                const effectiveWidth = contentWidth - this.overlap;

                viewBoxH = svgDims.height;
                viewBoxW = (contentWidth / scale);
                viewBoxY = svgDims.y;
                viewBoxX = svgDims.x + (page * (effectiveWidth / scale));

                // Adjust last page
                if (page === totalPages - 1) {
                    viewBoxW = svgDims.width - (viewBoxX - svgDims.x);
                }

                renderWidth = Math.min(viewBoxW * scale, contentWidth);
                renderHeight = contentHeight;
            } else {
                // Vertical slicing (top to bottom for tall diagrams)
                const scale = contentWidth / svgDims.width;
                const scaledHeight = svgDims.height * scale;
                const effectiveHeight = contentHeight - this.overlap;

                viewBoxW = svgDims.width;
                viewBoxH = (contentHeight / scale);
                viewBoxX = svgDims.x;
                viewBoxY = svgDims.y + (page * (effectiveHeight / scale));

                // Adjust last page
                if (page === totalPages - 1) {
                    viewBoxH = svgDims.height - (viewBoxY - svgDims.y);
                }

                renderWidth = contentWidth;
                renderHeight = Math.min(viewBoxH * scale, contentHeight);
            }

            preparedSvg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`);
            preparedSvg.setAttribute('width', renderWidth);
            preparedSvg.setAttribute('height', renderHeight);

            // Center the slice on the page
            const x = this.margin + (contentWidth - renderWidth) / 2;
            const y = this.margin;

            try {
                await pdf.svg(preparedSvg, { x, y, width: renderWidth, height: renderHeight });
            } catch (e) {
                console.warn('svg2pdf failed on page ' + (page + 1) + ', falling back to PNG');
                return this.exportMultiPagePng(filename);
            }

            // Add page footer
            pdf.setFontSize(9);
            pdf.setTextColor(128, 128, 128);
            pdf.text(
                `Page ${page + 1} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 5,
                { align: 'center' }
            );
        }

        pdf.save(filename);
        return { success: true, pages: totalPages };
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
