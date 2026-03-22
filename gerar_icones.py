"""
Gera os ícones PWA a partir do logo EMG.png (ou EMG2.jpeg).
Instale: pip install Pillow
Execute:  python gerar_icones.py
"""
from PIL import Image
import os

SOURCE = os.path.join('frontend', 'public', 'EMG.png')  # troque se quiser outro arquivo
OUT_DIR = os.path.join('frontend', 'public', 'icons')
SIZES   = [180, 192, 512]

os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SOURCE).convert('RGBA')

for size in SIZES:
    resized = img.resize((size, size), Image.LANCZOS)
    out_path = os.path.join(OUT_DIR, f'icon-{size}.png')
    resized.save(out_path, 'PNG')
    print(f'  Gerado: {out_path}')

print('Icones gerados com sucesso!')
