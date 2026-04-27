    const text = document.getElementById('text');
    const fg = document.getElementById('fg');
    const bg = document.getElementById('bg');
    const size = document.getElementById('size');
    const sizeVal = document.getElementById('sizeVal');
    const gen = document.getElementById('gen');
    const download = document.getElementById('download');
    const copy = document.getElementById('copy');
    const qrContainer = document.getElementById('qrContainer');
    let qrcode = null;

    size.addEventListener('input', ()=> sizeVal.textContent = size.value);

    function clearQR(){ qrContainer.innerHTML = ''; qrcode = null; }

    function generate(){
      clearQR();
      const value = text.value || '';
      const opts = {
        text: value,
        width: parseInt(size.value,10),
        height: parseInt(size.value,10),
        colorDark: fg.value,
        colorLight: bg.value,
        correctLevel: QRCode.CorrectLevel.H
      };
      const el = document.createElement('div');
      qrContainer.appendChild(el);
      qrcode = new QRCode(el, opts);
    }

    gen.addEventListener('click', generate);

    download.addEventListener('click', ()=>{
      const canvas = qrContainer.querySelector('canvas');
      if(!canvas){ alert('Genera el QR primero'); return; }
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'qr.png';
      a.click();
    });

    copy.addEventListener('click', ()=>{
      const canvas = qrContainer.querySelector('canvas');
      if(!canvas){ alert('Genera el QR primero'); return; }
      canvas.toBlob(async (blob)=>{
        try {
          await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
          alert('Imagen copiada al portapapeles');
        } catch(err) {
          alert('Error al copiar: ' + err.message);
        }
      });
    });

    window.addEventListener('load', generate);