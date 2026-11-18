const $ = (id) => document.getElementById(id);
const input = $("file-input");
const dropzone = $("dropzone");
const workspace = $("workspace");
const preview = $("preview");
const audioPreview = $("audio-preview");
const formatSelect = $("format-select");
const convertButton = $("convert-button");
const statusBox = $("status");
const downloadLink = $("download-link");

const imageFormats = {
  "image/png": { label: "PNG", extension: "png", hint: "PNG keeps transparency and uses lossless compression." },
  "image/jpeg": { label: "JPEG", extension: "jpg", hint: "JPEG is widely compatible. Transparent areas become white." },
  "image/webp": { label: "WebP", extension: "webp", hint: "WebP often creates smaller files with good visual quality." },
  "image/bmp": { label: "BMP", extension: "bmp", hint: "BMP is a simple bitmap format and can be large." }
};
const audioFormats = {
  "audio/wav": { label: "WAV", extension: "wav", hint: "WAV uses uncompressed PCM audio. Files can be large." },
  "audio/mpeg": { label: "MP3", extension: "mp3", hint: "MP3 uses lossy compression. Choose a bitrate below." }
};
let mode = "image";
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
  return name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "_") || "converted-file";
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
  preview.removeAttribute("src");
  audioPreview.pause();
  audioPreview.removeAttribute("src");
  audioPreview.load();
  clearDownload();
  workspace.hidden = true;
  dropzone.hidden = false;
  setStatus();
}
function setMode(nextMode) {
  if (mode === nextMode) return;
  reset();
  mode = nextMode;
  const isAudio = mode === "audio";
  $("image-mode").classList.toggle("active", !isAudio);
  $("audio-mode").classList.toggle("active", isAudio);
  $("image-mode").setAttribute("aria-pressed", String(!isAudio));
  $("audio-mode").setAttribute("aria-pressed", String(isAudio));
  input.accept = isAudio
    ? "audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/aac,audio/flac,audio/webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus"
    : "image/png,image/jpeg,image/webp,image/bmp,image/gif,image/avif";
  $("drop-title").textContent = isAudio ? "Drop an audio file here" : "Drop an image here";
  $("drop-help").textContent = isAudio
    ? "MP3, WAV, OGG, M4A, AAC, FLAC and other browser-supported audio"
    : "PNG, JPG, WebP, BMP and other browser-supported images";
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
    $("image-preview-wrap").hidden = false;
    $("audio-preview-wrap").hidden = true;
    preview.src = url;
    $("file-name").textContent = file.name;
    $("file-format").textContent = file.type ? file.type.replace("image/", "").toUpperCase() : "Unknown";
    $("file-size").textContent = humanSize(file.size);
    $("extra-label").textContent = "Dimensions";
    $("file-extra").textContent = imageInfo.width + " × " + imageInfo.height;
    dropzone.hidden = true;
    workspace.hidden = false;
    formatSelect.innerHTML = Object.entries(imageFormats).map(([value, f]) => '<option value="' + value + '">' + f.label + ' (.' + f.extension + ')</option>').join("");
    updateHint();
    setStatus("Image ready to convert.", "success");
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus("Your browser couldn't decode this image. Try a PNG, JPG, WebP, or BMP file.", "error");
  };
  img.src = url;
}
function loadAudio(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) {
    setStatus("That audio file is over the 25 MB first-release limit.", "error");
    return;
  }
  clearDownload();
  setStatus("Reading audio file…");
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  audio.preload = "metadata";
  audio.onloadedmetadata = () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      URL.revokeObjectURL(url);
      setStatus("Your browser couldn't read this audio file's duration.", "error");
      return;
    }
    if (audio.duration > 600) {
      URL.revokeObjectURL(url);
      setStatus("Audio is limited to 10 minutes in this first audio release.", "error");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = url;
    selectedFile = file;
    $("image-preview-wrap").hidden = true;
    $("audio-preview-wrap").hidden = false;
    audioPreview.src = url;
    $("file-name").textContent = file.name;
    $("file-format").textContent = (file.type || file.name.split(".").pop() || "Unknown").replace("audio/", "").toUpperCase();
    $("file-size").textContent = humanSize(file.size);
    $("extra-label").textContent = "Duration";
    $("file-extra").textContent = formatDuration(audio.duration);
    dropzone.hidden = true;
    workspace.hidden = false;
    formatSelect.innerHTML = Object.entries(audioFormats).map(([value, f]) => '<option value="' + value + '">' + f.label + ' (.' + f.extension + ')</option>').join("");
    formatSelect.value = "audio/wav";
    updateHint();
    setStatus("Audio ready to convert.", "success");
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus("Your browser couldn't read this audio format. Try MP3 or WAV.", "error");
  };
  audio.src = url;
}
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return mins + ":" + secs;
}
function updateHint() {
  const formats = mode === "audio" ? audioFormats : imageFormats;
  $("format-hint").textContent = formats[formatSelect.value].hint;
  $("mp3-options").hidden = mode !== "audio" || formatSelect.value !== "audio/mpeg";
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
      bytes[dstIndex] = Math.round(src[srcIndex + 2] * alpha + 255 * (1 - alpha));
      bytes[dstIndex + 1] = Math.round(src[srcIndex + 1] * alpha + 255 * (1 - alpha));
      bytes[dstIndex + 2] = Math.round(src[srcIndex] * alpha + 255 * (1 - alpha));
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}
function encodeWav(audioBuffer) {
  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const frames = audioBuffer.length;
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, dataSize, true);
  const channelData = Array.from({length: channels}, (_, i) => audioBuffer.getChannelData(i));
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
      offset += 2;
    }
  }
  return new Blob([buffer], {type: "audio/wav"});
}
function encodeMp3(audioBuffer, bitrate) {
  if (!window.lamejs) throw new Error("The MP3 encoder did not load. Check your internet connection and try again, or choose WAV.");
  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, bitrate);
  const left = audioBuffer.getChannelData(0);
  const right = channels === 2 ? audioBuffer.getChannelData(1) : left;
  const blockSize = 1152;
  const chunks = [];
  const leftBlock = new Int16Array(blockSize);
  const rightBlock = new Int16Array(blockSize);
  for (let start = 0; start < audioBuffer.length; start += blockSize) {
    const length = Math.min(blockSize, audioBuffer.length - start);
    for (let i = 0; i < length; i++) {
      const l = Math.max(-1, Math.min(1, left[start + i]));
      leftBlock[i] = l < 0 ? l * 32768 : l * 32767;
      if (channels === 2) {
        const r = Math.max(-1, Math.min(1, right[start + i]));
        rightBlock[i] = r < 0 ? r * 32768 : r * 32767;
      }
    }
    const encoded = channels === 1
      ? encoder.encodeBuffer(leftBlock.subarray(0, length))
      : encoder.encodeBuffer(leftBlock.subarray(0, length), rightBlock.subarray(0, length));
    if (encoded.length) chunks.push(encoded);
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(tail);
  return new Blob(chunks, {type: "audio/mpeg"});
}
async function convertImage() {
  if (!selectedFile || !imageInfo) return null;
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
  return mime === "image/bmp"
    ? encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height)
    : await canvasBlob(canvas, mime);
}
async function convertAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("This browser does not support audio conversion.");
  const context = new AudioContextClass();
  try {
    const data = await selectedFile.arrayBuffer();
    const decoded = await context.decodeAudioData(data);
    if (decoded.duration > 600) throw new Error("Audio is limited to 10 minutes in this first audio release.");
    if (decoded.numberOfChannels > 2) throw new Error("This first release supports mono and stereo audio only.");
    return formatSelect.value === "audio/mpeg" ? encodeMp3(decoded, Number($("mp3-bitrate").value)) : encodeWav(decoded);
  } finally {
    await context.close();
  }
}
async function convert() {
  if (!selectedFile) return;
  convertButton.disabled = true;
  convertButton.textContent = "Converting…";
  clearDownload();
  setStatus("Converting locally in your browser…");
  try {
    const blob = mode === "audio" ? await convertAudio() : await convertImage();
    const format = (mode === "audio" ? audioFormats : imageFormats)[formatSelect.value];
    convertedUrl = URL.createObjectURL(blob);
    downloadLink.href = convertedUrl;
    downloadLink.download = cleanBaseName(selectedFile.name) + "." + format.extension;
    downloadLink.hidden = false;
    setStatus("Done — " + format.label + " created (" + humanSize(blob.size) + ").", "success");
  } catch (error) {
    setStatus(error.message || "Conversion failed. Try another file or format.", "error");
  } finally {
    convertButton.disabled = false;
    convertButton.innerHTML = 'Convert ' + (mode === "audio" ? "audio" : "image") + ' <span aria-hidden="true">→</span>';
  }
}

dropzone.addEventListener("click", () => input.click());
dropzone.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); input.click(); }
});
input.addEventListener("change", () => mode === "audio" ? loadAudio(input.files[0]) : loadImage(input.files[0]));
["dragenter", "dragover"].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.remove("dragover");
}));
dropzone.addEventListener("drop", event => mode === "audio" ? loadAudio(event.dataTransfer.files[0]) : loadImage(event.dataTransfer.files[0]));
$("remove-file").addEventListener("click", reset);
$("image-mode").addEventListener("click", () => setMode("image"));
$("audio-mode").addEventListener("click", () => setMode("audio"));
formatSelect.addEventListener("change", () => { updateHint(); clearDownload(); setStatus(); });
$("mp3-bitrate").addEventListener("change", () => { clearDownload(); setStatus("MP3 settings changed. Convert again to apply them."); });
convertButton.addEventListener("click", convert);
window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  if (convertedUrl) URL.revokeObjectURL(convertedUrl);
});
