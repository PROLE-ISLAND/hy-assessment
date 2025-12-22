#!/bin/bash
# Mermaid図をPNG形式で生成するスクリプト

DIAGRAMS_DIR="docs/diagrams"
OUTPUT_DIR="docs/diagrams/png"

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"

echo "Generating diagrams..."

# すべての.mmdファイルを処理
for mmd_file in "$DIAGRAMS_DIR"/*.mmd; do
    filename=$(basename "$mmd_file" .mmd)
    output_file="$OUTPUT_DIR/$filename.png"

    echo "  $filename.mmd -> $filename.png"
    mmdc -i "$mmd_file" -o "$output_file" -b transparent -t dark
done

echo "Done! Generated files in $OUTPUT_DIR"
echo ""
echo "To view in terminal (iTerm2):"
echo "  imgcat $OUTPUT_DIR/<filename>.png"
echo ""
echo "Or view all:"
for png in "$OUTPUT_DIR"/*.png; do
    echo "  imgcat $png"
done
