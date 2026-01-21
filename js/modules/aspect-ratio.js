// Aspect Ratio module - handles ratio calculations and SVG adjustments

import { ASPECT_RATIOS } from '../config.js';

export class AspectRatio {
    constructor() {
        this.aspectSelect = document.getElementById('aspect-select');
        this.customRatioContainer = document.getElementById('custom-ratio');
        this.ratioWidthInput = document.getElementById('ratio-width');
        this.ratioHeightInput = document.getElementById('ratio-height');
        this.currentRatio = 'auto';
        this.onChange = null;

        this.init();
    }

    init() {
        this.aspectSelect.addEventListener('change', (e) => {
            this.setRatio(e.target.value);
        });

        // Handle custom ratio inputs
        [this.ratioWidthInput, this.ratioHeightInput].forEach(input => {
            input.addEventListener('input', () => {
                if (this.currentRatio === 'custom' && this.onChange) {
                    this.onChange(this.getCurrentRatio());
                }
            });
        });
    }

    setRatio(ratio) {
        this.currentRatio = ratio;
        this.aspectSelect.value = ratio;

        // Show/hide custom inputs
        if (ratio === 'custom') {
            this.customRatioContainer.classList.remove('hidden');
        } else {
            this.customRatioContainer.classList.add('hidden');
        }

        if (this.onChange) {
            this.onChange(this.getCurrentRatio());
        }
    }

    getCurrentRatio() {
        if (this.currentRatio === 'auto') {
            return null;
        }

        if (this.currentRatio === 'custom') {
            const width = parseInt(this.ratioWidthInput.value) || 16;
            const height = parseInt(this.ratioHeightInput.value) || 9;
            return { width, height };
        }

        return ASPECT_RATIOS[this.currentRatio];
    }

    getRatioString() {
        return this.currentRatio;
    }

    // Apply aspect ratio to SVG by adjusting viewBox and container
    applySvgRatio(svg, containerWidth, containerHeight, ratio) {
        if (!svg || !ratio) return;

        // Get original dimensions
        const bbox = svg.getBBox();
        const originalWidth = bbox.width || svg.clientWidth || 100;
        const originalHeight = bbox.height || svg.clientHeight || 100;

        // Calculate target dimensions based on ratio
        const targetAspect = ratio.width / ratio.height;
        const originalAspect = originalWidth / originalHeight;

        let newWidth, newHeight;

        if (originalAspect > targetAspect) {
            // Original is wider, add padding top/bottom
            newWidth = originalWidth;
            newHeight = originalWidth / targetAspect;
        } else {
            // Original is taller, add padding left/right
            newHeight = originalHeight;
            newWidth = originalHeight * targetAspect;
        }

        // Calculate offsets to center the diagram
        const offsetX = (newWidth - originalWidth) / 2;
        const offsetY = (newHeight - originalHeight) / 2;

        // Update viewBox
        const viewBoxX = bbox.x - offsetX;
        const viewBoxY = bbox.y - offsetY;
        svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${newWidth} ${newHeight}`);

        // Set dimensions on SVG
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        return { width: newWidth, height: newHeight };
    }

    // Prepare SVG for export with specific dimensions
    prepareForExport(svg, exportWidth, ratio) {
        if (!svg) return null;

        // Clone SVG
        const clone = svg.cloneNode(true);

        // Get current viewBox
        const viewBox = clone.getAttribute('viewBox');
        if (!viewBox) return clone;

        const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);

        if (ratio) {
            const targetAspect = ratio.width / ratio.height;
            const exportHeight = exportWidth / targetAspect;

            clone.setAttribute('width', exportWidth);
            clone.setAttribute('height', exportHeight);
        } else {
            // Auto ratio - use original aspect
            const aspect = vbWidth / vbHeight;
            clone.setAttribute('width', exportWidth);
            clone.setAttribute('height', exportWidth / aspect);
        }

        return clone;
    }

    onRatioChange(callback) {
        this.onChange = callback;
    }

    loadRatio(ratioString) {
        if (ratioString && (ASPECT_RATIOS[ratioString] || ratioString === 'custom' || ratioString === 'auto')) {
            this.setRatio(ratioString);
        }
    }
}
