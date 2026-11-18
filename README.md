# Extension Changer

A lightweight, browser-based file converter. Extension Changer converts file data into genuinely different formats — it does **not** just rename extensions.

## Current features

### Images
- Convert images to **PNG, JPEG, WebP, and BMP**
- Preview images and inspect dimensions and file size

### Audio
- Convert browser-decodable audio to **WAV or MP3**
- Preview audio before conversion
- WAV output is uncompressed 16-bit PCM; MP3 output offers 128, 192, or 320 kbps bitrate choices
- Audio input formats depend on browser support (commonly MP3, WAV, OGG, M4A, AAC, and sometimes FLAC)

### Shared features
- Drag and drop or browse for a file
- Choose an output format, convert, and download
- Conversion happens locally in your browser; selected files are not uploaded to a conversion server

## Limits
- Images: 40 MB maximum input size
- Audio: 25 MB maximum input size and 10 minutes maximum duration
- Audio conversion currently supports mono and stereo input
- Audio decoding depends on the browser. Not every browser can decode every listed input format.
- MP3 output uses the LAME encoder library loaded from cdnjs; an internet connection is needed for that library. WAV output does not need the MP3 encoder.

## Run locally

No build tools or package installation are required.

1. Clone or download this repository.
2. Open `index.html` in a modern browser.

For local development, you can also run a simple static server from the project folder, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Privacy

Image and audio conversion is performed on-device in the browser. Selected files are not sent to a conversion server. The page loads the MP3 encoder library from cdnjs when it is opened.

## Roadmap

- [x] Image conversion: PNG, JPEG, WebP, BMP
- [x] Audio conversion: WAV and MP3 output
- [ ] More audio output formats (such as OGG and FLAC)
- [ ] Document conversion
- [ ] More image formats and improved metadata handling

## License

This project is distributed under the **Extension Changer Responsible Use License (ECRUL) v1.0**. Read [LICENSE](LICENSE) before using, modifying, or redistributing the code. It permits personal and commercial use subject to its conditions and responsible-use restrictions.

## Important

Extension Changer is provided as-is. Always keep an original copy of important files. Converting between lossy formats (for example, MP3 to another lossy format) can reduce audio quality.
