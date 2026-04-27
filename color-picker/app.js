const picker = document.getElementById('colorPicker');
const hexTxt = document.getElementById('hexValue');
const rgbTxt = document.getElementById('rgbValue');
const paletteContainer = document.getElementById('palette');

picker.addEventListener('input', updateColors);

function updateColors() {
    const color = picker.value;
    hexTxt.textContent = color.toUpperCase();
    rgbTxt.textContent = hexToRgb(color);
    generatePalette(color);
}

function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(hex) {
    paletteContainer.innerHTML = '';
    const hsl = hexToHsl(hex);

    const schemes = [
        { name: 'Base', color: hex },
        { name: 'Compl.', color: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l) },
        { name: 'Anál. -', color: hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l) },
        { name: 'Anál. +', color: hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l) }
    ];

    schemes.forEach(item => {
        const container = document.createElement('div');
        container.className = 'swatch-container';

        const div = document.createElement('div');
        div.className = 'swatch';
        div.style.backgroundColor = item.color;
        div.textContent = item.color.toUpperCase();
        div.onclick = () => copyToClipboard(item.color);

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = item.name;

        container.appendChild(div);
        container.appendChild(label);
        paletteContainer.appendChild(container);
    });
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text.toUpperCase());
    // Feedback visual simple
    const btn = document.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = '¡Copiado!';
    setTimeout(() => btn.textContent = originalText, 1000);
}

updateColors();