# Extension Changer

A lightweight, browser-based file converter. Extension Changer converts image data into a genuinely different file format — it does **not** just rename extensions.

## First release

- Convert images to **PNG, JPEG, WebP, and BMP**
- Drag and drop or browse for a file
- Preview the selected image and inspect its file details
- Choose an output format, convert, and download
- Conversion happens locally in your browser; files are not uploaded to a conversion server

## Run locally

No build tools or package installation are required.

1. Clone or download this repository.
2. Open `index.html` in a modern browser.

For local development, you can also run a simple static server from the project folder, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Supported formats

| Format | Input | Output |
|---|---:|---:|
| PNG | Yes* | Yes |
| JPEG / JPG | Yes* | Yes |
| WebP | Yes* | Yes |
| BMP | Yes* | Yes |

`*` Input support depends on whether the browser can decode the image. Output is generated from decoded pixels using the browser's Canvas API (BMP is encoded by the app).

JPEG does not support transparency. Transparent pixels are composited onto a white background when converting to JPEG.

## Privacy

Image conversion is performed on-device in the browser. The current version does not send selected files to a server.

## Roadmap

- [x] First image conversion interface
- [x] PNG, JPEG, WebP, and BMP output
- [ ] More image formats and improved metadata handling
- [ ] Audio conversion
- [ ] Document conversion

## License

This project is distributed under the **Extension Changer Responsible Use License (ECRUL) v1.0**. Read [LICENSE](LICENSE) before using, modifying, or redistributing the code. It permits personal and commercial use subject to its conditions and responsible-use restrictions.

## Important

Extension Changer is provided as-is. Always keep an original copy of important files. The project does not currently guarantee preservation of image metadata, animation, or color profiles.