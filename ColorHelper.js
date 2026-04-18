.pragma library

// Convert hex color string to RGB object
function hexToRgb(hex) {
    if (!hex) return {r:0, g:0, b:0};
    hex = hex.toString();
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }
    // Also try rgba and rgb formats or name parsing if needed
    // Assuming we mostly get standard "#RRGGBB" from Color properties
    return { r: 0, g: 0, b: 0 };
}

// Extract RGB from QML color object which toString() returns "#AARRGGBB" or "#RRGGBB"
function qmlColorToRgb(color) {
    let str = color.toString();
    if (str.length === 9) { // #AARRGGBB
        return {
            r: parseInt(str.substring(3, 5), 16),
            g: parseInt(str.substring(5, 7), 16),
            b: parseInt(str.substring(7, 9), 16)
        };
    } else if (str.length === 7) { // #RRGGBB
        return hexToRgb(str);
    }
    return { r: 0, g: 0, b: 0 };
}


function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function getLuminance(rgb) {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val /= 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isLightColor(color) {
    return getLuminance(qmlColorToRgb(color)) > 0.5;
}

function getContrastRatio(rgb1, rgb2) {
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function generateContainerColor(baseColor, isDarkMode) {
    const rgb = qmlColorToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    if (isDarkMode) {
        hsl.l = Math.max(10, Math.min(30, hsl.l - 20));
        hsl.s = Math.min(100, hsl.s + 10);
    } else {
        hsl.l = Math.min(90, Math.max(75, hsl.l + 30));
        hsl.s = Math.max(0, hsl.s - 10);
    }
    
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function generateOnColor(baseColor) {
    const isBaseLight = isLightColor(baseColor);
    const rgbBase = qmlColorToRgb(baseColor);
    
    if (isBaseLight) {
        let testColor = {r:0, g:0, b:0};
        if (getContrastRatio(rgbBase, testColor) >= 4.5) return "#000000";
        return "#1c1b1f";
    } else {
        let testColor = {r:255, g:255, b:255};
        if (getContrastRatio(rgbBase, testColor) >= 4.5) return "#ffffff";
        return "#e6e1e5";
    }
}

