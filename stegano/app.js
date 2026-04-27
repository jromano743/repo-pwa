function textToBits(text){
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const bits = [];
    for (const byte of data)
        for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
    return bits;
}
function bitsToText(bits){
    const bytes = [];
    for (let i=0; i<bits.length; i+=8){
        let byte = 0;
        for (let j=0; j<8; j++) byte = (byte << 1) | bits[i+j];
        bytes.push(byte);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}
function getSelectedChannels(className){
    return Array.from(document.querySelectorAll('.'+className+':checked'))
                .map(el => el.value);
}
function hideMessage(image, channels, message){
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imgData.data;

    const bits = textToBits(message);
    // prepend length (32 bits)
    const len = bits.length;
    const lenBits = [];
    for (let i=31; i>=0; i--) lenBits.push((len >> i) & 1);
    const fullBits = lenBits.concat(bits);

    const chIndexMap = {r:0,g:1,b:2};
    const totalSlots = (data.length/4)*channels.length;
    if (fullBits.length > totalSlots)
        throw new Error("Mensaje demasiado grande para la combinación de canales e imagen");

    let bitPos = 0;
    for (let i=0; i<data.length && bitPos<fullBits.length; i+=4){
        for (const c of channels){
            if (bitPos >= fullBits.length) break;
            data[i + chIndexMap[c]] = (data[i + chIndexMap[c]] & 0xFE) | fullBits[bitPos++];
        }
    }
    ctx.putImageData(imgData,0,0);
    return canvas.toDataURL("image/png");
}
function revealMessage(image, channels){
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;

    const chIndexMap = {r:0,g:1,b:2};
    let bits = [];
    for (let i=0; i<data.length; i+=4){
        for (const c of channels){
            bits.push(data[i + chIndexMap[c]] & 1);
        }
    }
    const lenBits = bits.slice(0,32);
    let len = 0;
    for (let i=0; i<32; i++) len = (len << 1) | lenBits[i];
    const msgBits = bits.slice(32, 32+len);
    return bitsToText(msgBits);
}

document.getElementById('hideBtn').onclick = () => {
    const file = document.getElementById('hideImage').files[0];
    const channels = getSelectedChannels('hideChannel');
    const msg = document.getElementById('secretMessage').value;
    if(!file || !msg) return alert("Selecciona una imagen y escribe un mensaje");
    if(channels.length === 0) return alert("Selecciona al menos un canal");
    const img = new Image();
    img.onload = () => {
        try {
            const dataUrl = hideMessage(img, channels, msg);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = "imagen_oculta.png";
            a.click();
        } catch(e){ alert(e.message); }
    };
    img.src = URL.createObjectURL(file);
};

document.getElementById('revealBtn').onclick = () => {
    const file = document.getElementById('revealImage').files[0];
    const channels = getSelectedChannels('revealChannel');
    if(!file) return alert("Selecciona una imagen");
    if(channels.length === 0) return alert("Selecciona al menos un canal");
    const img = new Image();
    img.onload = () => {
        const message = revealMessage(img, channels);
        document.getElementById('revealedMessage').value = message;
        const dlBtn = document.getElementById('downloadTextBtn');
        dlBtn.style.display = "inline-block";
        dlBtn.onclick = () => {
            const blob = new Blob([message], {type:'text/plain'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = "mensaje.txt";
            a.click();
        };
    };
    img.src = URL.createObjectURL(file);
};

document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // Botones
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Contenido
        document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});