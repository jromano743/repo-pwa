const encoder = new TextEncoder();
const decoder = new TextDecoder();

// -------- BINARIO --------
function textToBinary(text) {
  return [...encoder.encode(text)]
    .map(b => b.toString(2).padStart(8, '0'))
    .join(' ');
}

function binaryToText(binary) {
  const bytes = binary.trim().split(/\s+/).map(b => parseInt(b, 2));
  return decoder.decode(new Uint8Array(bytes));
}

// -------- HEX --------
function textToHex(text) {
  return [...encoder.encode(text)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToText(hex) {
  const clean = hex.replace(/\s+/g, '');
  const bytes = clean.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
  return decoder.decode(new Uint8Array(bytes));
}

// -------- BASE64 UTF-8 --------
function toBase64UTF8(str) {
  return btoa(String.fromCharCode(...encoder.encode(str)));
}

function fromBase64UTF8(str) {
  const binary = atob(str);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return decoder.decode(bytes);
}

// -------- URL --------
function urlEncode(text) {
  return encodeURIComponent(text);
}

function urlDecode(text) {
  return decodeURIComponent(text);
}

// -------- HTML ENTITIES --------
function htmlEncode(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function htmlDecode(text) {
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.innerText;
}

// -------- ROT13 --------
function rot13(text) {
  return text.replace(/[a-zA-Z]/g, function(c) {
    return String.fromCharCode(
      (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13)
        ? c
        : c - 26
    );
  });
}

// -------- PROCESAMIENTO --------
function processText() {
  const input = document.getElementById("inputText").value;
  const algorithm = document.getElementById("algorithm").value;
  const decode = document.getElementById("modeToggle").checked;
  let result = "";

  try {
    if (!decode) {
      if (algorithm === "binary") result = textToBinary(input);
      else if (algorithm === "base64") result = toBase64UTF8(input);
      else if (algorithm === "hex") result = textToHex(input);
      else if (algorithm === "url") result = urlEncode(input);
      else if (algorithm === "html") result = htmlEncode(input);
      else if (algorithm === "rot13") result = rot13(input);
    } else {
      if (algorithm === "binary") result = binaryToText(input);
      else if (algorithm === "base64") result = fromBase64UTF8(input);
      else if (algorithm === "hex") result = hexToText(input);
      else if (algorithm === "url") result = urlDecode(input);
      else if (algorithm === "html") result = htmlDecode(input);
      else if (algorithm === "rot13") result = rot13(input);
    }
  } catch (e) {
    result = "Error en conversión";
  }

  document.getElementById("outputText").value = result;
  updateStats();
}

// -------- COPIAR --------
function copyToClipboard() {
  const output = document.getElementById("outputText").value;
  navigator.clipboard.writeText(output);
}

// -------- EXPORTAR --------
function exportToFile() {
  const text = document.getElementById("outputText").value;
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "resultado.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

// -------- CONTADORES --------
function updateStats() {
  const input = document.getElementById("inputText").value;
  const output = document.getElementById("outputText").value;

  const inputBytes = encoder.encode(input).length;
  const outputBytes = encoder.encode(output).length;

  document.getElementById("inputStats").textContent =
    `${input.length} caracteres · ${inputBytes} bytes`;

  document.getElementById("outputStats").textContent =
    `${output.length} caracteres · ${outputBytes} bytes`;
}

// -------- EVENT LISTENERS --------
window.addEventListener("load", () => {
  document.getElementById("processBtn")
    .addEventListener("click", processText);

  document.getElementById("copyBtn")
    .addEventListener("click", copyToClipboard);

  document.getElementById("exportBtn")
    .addEventListener("click", exportToFile);

  document.getElementById("inputText")
    .addEventListener("input", updateStats);

  updateStats();
});