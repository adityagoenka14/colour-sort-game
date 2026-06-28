#!/bin/bash
SRC="/Users/adityagoenka/.gemini/antigravity-ide/brain/cd2029d0-038b-45f4-9ad4-48d4d4642ee4/app_icon_1782633425996.png"
RES_DIR="android-app/app/src/main/res"

echo "Generating Android launcher PNG icons from $SRC..."

# Clean up adaptive XML launcher icons so Android uses PNG assets
rm -rf "$RES_DIR/mipmap-anydpi-v26"

# MDPI
echo "Processing mdpi (48x48)..."
rm -f "$RES_DIR/mipmap-mdpi/ic_launcher.webp" "$RES_DIR/mipmap-mdpi/ic_launcher_round.webp"
sips -s format png --resampleWidth 48 "$SRC" --out "$RES_DIR/mipmap-mdpi/ic_launcher.png" >/dev/null
sips -s format png --resampleWidth 48 "$SRC" --out "$RES_DIR/mipmap-mdpi/ic_launcher_round.png" >/dev/null

# HDPI
echo "Processing hdpi (72x72)..."
rm -f "$RES_DIR/mipmap-hdpi/ic_launcher.webp" "$RES_DIR/mipmap-hdpi/ic_launcher_round.webp"
sips -s format png --resampleWidth 72 "$SRC" --out "$RES_DIR/mipmap-hdpi/ic_launcher.png" >/dev/null
sips -s format png --resampleWidth 72 "$SRC" --out "$RES_DIR/mipmap-hdpi/ic_launcher_round.png" >/dev/null

# XHDPI
echo "Processing xhdpi (96x96)..."
rm -f "$RES_DIR/mipmap-xhdpi/ic_launcher.webp" "$RES_DIR/mipmap-xhdpi/ic_launcher_round.webp"
sips -s format png --resampleWidth 96 "$SRC" --out "$RES_DIR/mipmap-xhdpi/ic_launcher.png" >/dev/null
sips -s format png --resampleWidth 96 "$SRC" --out "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png" >/dev/null

# XXHDPI
echo "Processing xxhdpi (144x144)..."
rm -f "$RES_DIR/mipmap-xxhdpi/ic_launcher.webp" "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.webp"
sips -s format png --resampleWidth 144 "$SRC" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher.png" >/dev/null
sips -s format png --resampleWidth 144 "$SRC" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png" >/dev/null

# XXXHDPI
echo "Processing xxxhdpi (192x192)..."
rm -f "$RES_DIR/mipmap-xxxhdpi/ic_launcher.webp" "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.webp"
sips -s format png --resampleWidth 192 "$SRC" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png" >/dev/null
sips -s format png --resampleWidth 192 "$SRC" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png" >/dev/null

echo "Android app PNG icons generated successfully!"
