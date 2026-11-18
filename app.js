const $ = (id) => document.getElementById(id);
const input = $("file-input");
const dropzone = $("dropzone");
const workspace = $("workspace");
const preview = $("preview");
const formatSelect = $("format-select");
const convertButton = $("convert-button");
const statusBox = $("status");
const downloadLink = $("download-link");

const formats = {
  "image/png": { label: "PNG", extension: "png", hint: "PNG keeps transparency and uses lossless compression." },
  "image/jpeg": { label: "JPEG", extension: "jpg", hint: "JPEG is widely compatible. Transparent areas become white." },
  "image/webp": { label: "WebP", extension: "webp", hint: "WebP often creates smaller files with good visual quality." },
  "image/bmp": { label: "BMP", extension: "bmp", hint: "BMP is a simple, widely supported bitmap format and can be large." }
};
let selectedFile = null;
let previewUrl = null;
let convertedUrl = null;
let imageInfo = null;

function humanSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
function cleanBaseName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "_") || "converted-image";
}
function setStatus(message = "", type = "") {
  statusBox.textContent = message;
  statusBox.className = "status" + (type ? " " + type : "");
}
function clearDownload() {
  if (convertedUrl) URL.revokeObjectURL(convertedUrl);
  convertedUrl = null;
  downloadLink.hidden = true;
  downloadLink.removeAttribute("href");
}
function reset() {
  selectedFile = null;
  imageInfo = null;
  input.value = "";
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  clearDownload();
  workspace.hidden = true;
  dropzone.hidden = false;
  setStatus();
}
function loadImage(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("That file does not appear to be an image.", "error");
    return;
  }
  if (file.size > 40 * 1024 * 1024) {
    setStatus("That image is over the 40 MB first-release limit.", "error");
    return;
  }
  clearDownload();
  setStatus("Reading image…");
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = url;
    selectedFile = file;
    imageInfo = { width: img.naturalWidth, height: img.naturalHeight };
    preview.src = url;
    $("file-name").textContent = file.name;
    $("file-format").textContent = file.type ? file.type.replace("image/", "").toUpperCase() : "Unknown";
    $("file-size").textContent = humanSize(file.size);
    $("file-dimensions").textContent = imageInfo.width + " × " + imageInfo.height;
    dropzone.hidden = true;
    workspace.hidden = false;
    formatSelect.value = "image/png";
    updateHint();
    setStatus("Image ready to convert.", "success");
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus("Your browser couldn't decode this image. Try a PNG, JPG, WebP, or BMP file.", "error");
  };
  img.src = url;
}
function updateHint() {
  $("format-hint").textContent = formats[formatSelect.value].hint;
}
function canvasBlob(canvas, mime) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Your browser could not create that format.")), mime, 0.92);
  });
}
function encodeBmp(imageData, width, height) {
  const rowBytes = width * 3;
  const stride = (rowBytes + 3) & ~3;
  const pixelBytes = stride * height;
  const buffer = new ArrayBuffer(54 + pixelBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint8(0, 0x42); view.setUint8(1, 0x4d);
  view.setUint32(2, 54 + pixelBytes, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  const src = imageData.data;
  for (let y = 0; y < height; y++) {
    const dstRow = 54 + (height - 1 - y) * stride;
    for (let x = 0; x < width; x++) {
      const srcIndex = (y * width + x) * 4;
      const dstIndex = dstRow + x * 3;
      const alpha = src[srcIndex + 3] / 255;
      const r = Math.round(src[srcIndex] * alpha + 255 * (1 - alpha));
      const g = Math.round(src[srcIndex + 1] * alpha + 255 * (1 - alpha));
      const b = Math.round(src[srcIndex + 2] * alpha + 255 * (1 - alpha));
      bytes[dstIndex] = b; bytes[dstIndex + 1] = g; bytes[dstIndex + 2] = r;
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}
async function convert() {
  if (!selectedFile || !imageInfo) return;
  convertButton.disabled = true;
  convertButton.textContent = "Converting…";
  clearDownload();
  setStatus("Converting locally in your browser…");
  try {
    const img = new Image();
    img.src = previewUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = imageInfo.width;
    canvas.height = imageInfo.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Your browser could not create a drawing canvas.");
    if (formatSelect.value === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const mime = formatSelect.value;
    const blob = mime === "image/bmp"
      ? encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height)
      : await canvasBlob(canvas, mime);
    convertedUrl = URL.createObjectURL(blob);
    const base = cleanBaseName(selectedFile.name);
    downloadLink.href = convertedUrl;
    downloadLink.download = base + "." + formats[mime].extension;
    downloadLink.hidden = false;
    setStatus("Done — " + formats[mime].label + " created (" + humanSize(blob.size) + ").", "success");
  } catch (error) {
    setStatus(error.message || "Conversion failed. Try another image or format.", "error");
  } finally {
    convertButton.disabled = false;
    convertButton.innerHTML = 'Convert image <span aria-hidden="true">→</span>';
  }
}

dropzone.addEventListener("click", () => input.click());
dropzone.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); input.click(); }
});
input.addEventListener("change", () => loadImage(input.files[0]));
["dragenter", "dragover"].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.remove("dragover");
}));
dropzone.addEventListener("drop", event => loadImage(event.dataTransfer.files[0]));
$("remove-file").addEventListener("click", reset);
formatSelect.addEventListener("change", () => { updateHint(); clearDownload(); setStatus(); });
convertButton.addEventListener("click", convert);
window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  if (convertedUrl) URL.revokeObjectURL(convertedUrl);
});