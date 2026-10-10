import os
import subprocess

# 1. Foreground SVG: Transparent background, perfectly proportioned coral lungs in the safe zone
foreground_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <g transform="translate(19, 17) scale(0.65)">
    <!-- Left Lung -->
    <path
      d="M 46 28 C 42 22 28 22 20 32 C 10 44 8 64 13 78 C 17 90 30 94 38 88 C 45 82 46 66 46 48 Z"
      fill="#FF5252"
    />
    <!-- Right Lung -->
    <path
      d="M 54 28 C 58 22 72 22 80 32 C 90 44 92 64 87 78 C 83 90 70 94 62 88 C 55 82 54 66 54 48 Z"
      fill="#FF5252"
    />
    <!-- Trachea and Bronchial Tree -->
    <path
      d="M 50 14 L 50 42"
      stroke="#FFFFFF"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path
      d="M 50 38 C 44 44 34 50 28 55 M 37 45 C 33 50 31 57 30 64 M 34 47 C 30 45 25 47 23 50"
      stroke="#FFFFFF"
      stroke-width="3.2"
      stroke-linecap="round"
    />
    <path
      d="M 50 38 C 56 44 66 50 72 55 M 63 45 C 67 50 69 57 70 64 M 66 47 C 70 45 75 47 77 50"
      stroke="#FFFFFF"
      stroke-width="3.2"
      stroke-linecap="round"
    />
  </g>
</svg>
"""

# 2. Square icon with soft mint background and rounded corners
square_icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <rect width="108" height="108" rx="24" fill="#E8F6F4" />
  <g transform="translate(19, 17) scale(0.65)">
    <path
      d="M 46 28 C 42 22 28 22 20 32 C 10 44 8 64 13 78 C 17 90 30 94 38 88 C 45 82 46 66 46 48 Z"
      fill="#FF5252"
    />
    <path
      d="M 54 28 C 58 22 72 22 80 32 C 90 44 92 64 87 78 C 83 90 70 94 62 88 C 55 82 54 66 54 48 Z"
      fill="#FF5252"
    />
    <path
      d="M 50 14 L 50 42"
      stroke="#FFFFFF"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path
      d="M 50 38 C 44 44 34 50 28 55 M 37 45 C 33 50 31 57 30 64 M 34 47 C 30 45 25 47 23 50"
      stroke="#FFFFFF"
      stroke-width="3.2"
      stroke-linecap="round"
    />
    <path
      d="M 50 38 C 56 44 66 50 72 55 M 63 45 C 67 50 69 57 70 64 M 66 47 C 70 45 75 47 77 50"
      stroke="#FFFFFF"
      stroke-width="3.2"
      stroke-linecap="round"
    />
  </g>
</svg>
"""

# 3. Round icon with circular soft mint background
round_icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <circle cx="54" cy="54" r="54" fill="#E8F6F4" />
  <g transform="translate(19, 17) scale(0.65)">
    <path
      d="M 46 28 C 42 22 28 22 20 32 C 10 44 8 64 13 78 C 17 90 30 94 38 88 C 45 82 46 66 46 48 Z"
      fill="#FF5252"
    />
    <path
      d="M 54 28 C 58 22 72 22 80 32 C 90 44 92 64 87 78 C 83 90 70 94 62 88 C 55 82 54 66 54 48 Z"
      fill="#FF5252"
    />
    <path
      d="M 50 14 L 50 42"
      stroke="#FFFFFF"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path
      d="M 50 38 C 44 44 34 50 28 55 M 37 45 C 33 50 31 57 30 64 M 34 47 C 30 45 25 47 23 50"
      stroke="#FFFFFF"
      stroke-width="3.2"
      stroke-linecap="round"
    />
    <path
      d="M 50 38 C 56 44 66 50 72 55 M 63 45 C 67 50 69 57 70 64 M 66 47 C 70 45 75 47 77 50"
      stroke="#FFFFFF"
      stroke-width="3.2"
      stroke-linecap="round"
    />
  </g>
</svg>
"""

# 4. Monochrome icon for Android 13+ Material You Themed Icons
monochrome_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <defs>
    <mask id="cutout">
      <rect width="108" height="108" fill="white" />
      <g transform="translate(19, 17) scale(0.65)">
        <path d="M 50 14 L 50 42" stroke="black" stroke-width="5" stroke-linecap="round" />
        <path d="M 50 38 C 44 44 34 50 28 55 M 37 45 C 33 50 31 57 30 64 M 34 47 C 30 45 25 47 23 50" stroke="black" stroke-width="3.2" stroke-linecap="round" />
        <path d="M 50 38 C 56 44 66 50 72 55 M 63 45 C 67 50 69 57 70 64 M 66 47 C 70 45 75 47 77 50" stroke="black" stroke-width="3.2" stroke-linecap="round" />
      </g>
    </mask>
  </defs>
  <g transform="translate(19, 17) scale(0.65)" mask="url(#cutout)">
    <path d="M 46 28 C 42 22 28 22 20 32 C 10 44 8 64 13 78 C 17 90 30 94 38 88 C 45 82 46 66 46 48 Z" fill="#FFFFFF" />
    <path d="M 54 28 C 58 22 72 22 80 32 C 90 44 92 64 87 78 C 83 90 70 94 62 88 C 55 82 54 66 54 48 Z" fill="#FFFFFF" />
  </g>
</svg>
"""

with open("/tmp/fg.svg", "w") as f:
    f.write(foreground_svg)

with open("/tmp/square.svg", "w") as f:
    f.write(square_icon_svg)

with open("/tmp/round.svg", "w") as f:
    f.write(round_icon_svg)

with open("/tmp/mono.svg", "w") as f:
    f.write(monochrome_svg)

DENSITIES = {
    "mipmap-mdpi": (108, 48),
    "mipmap-hdpi": (162, 72),
    "mipmap-xhdpi": (216, 96),
    "mipmap-xxhdpi": (324, 144),
    "mipmap-xxxhdpi": (432, 192),
}

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
base_dir = os.path.join(project_root, "android", "app", "src", "main", "res")

for folder, (fg_size, legacy_size) in DENSITIES.items():
    folder_path = os.path.join(base_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # 1. Foreground
    fg_out = os.path.join(folder_path, "ic_launcher_foreground.png")
    subprocess.run(["rsvg-convert", "-w", str(fg_size), "-h", str(fg_size), "/tmp/fg.svg", "-o", fg_out], check=True)
    
    # 2. Legacy square
    sq_out = os.path.join(folder_path, "ic_launcher.png")
    subprocess.run(["rsvg-convert", "-w", str(legacy_size), "-h", str(legacy_size), "/tmp/square.svg", "-o", sq_out], check=True)
    
    # 3. Round
    round_out = os.path.join(folder_path, "ic_launcher_round.png")
    subprocess.run(["rsvg-convert", "-w", str(legacy_size), "-h", str(legacy_size), "/tmp/round.svg", "-o", round_out], check=True)

    # 4. Monochrome (Android 13+ MD3 Themed Icon)
    mono_out = os.path.join(folder_path, "ic_launcher_monochrome.png")
    subprocess.run(["rsvg-convert", "-w", str(fg_size), "-h", str(fg_size), "/tmp/mono.svg", "-o", mono_out], check=True)

# Also generate notification icon
subprocess.run(["rsvg-convert", "-w", "48", "-h", "48", "/tmp/fg.svg", "-o", f"{base_dir}/drawable/ic_stat_lungs.png"], check=True)

print("Icons successfully regenerated with vibrant coral lungs and mint background!")
