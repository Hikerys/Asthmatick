#!/usr/bin/env python3
import os
import math
import wave
import struct

SAMPLE_RATE = 44100

def write_wav(filepath, samples):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, 'w') as wav:
        wav.setnchannels(1)      # Mono
        wav.setsampwidth(2)      # 16-bit
        wav.setframerate(SAMPLE_RATE)
        # Convert float samples (-1.0 to 1.0) to 16-bit signed PCM
        data = bytearray()
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            int_val = int(clamped * 32767.0)
            data.extend(struct.pack('<h', int_val))
        wav.writeframes(data)
    print(f"Generated {filepath} ({len(samples)} samples, {len(samples)/SAMPLE_RATE:.2f}s)")

# 1. Chime: Tri-tone bright chime (D5 -> A5 -> D6)
def gen_chime():
    duration = 1.6
    total_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * total_samples
    notes = [
        (0.00, 587.33, 0.40),  # D5
        (0.12, 880.00, 0.45),  # A5
        (0.24, 1174.66, 0.50), # D6
    ]
    for start_t, freq, amp in notes:
        start_idx = int(start_t * SAMPLE_RATE)
        for i in range(start_idx, total_samples):
            t = (i - start_idx) / SAMPLE_RATE
            # Exponential decay
            env = math.exp(-t * 3.5)
            # Fundamental + soft octave overtone
            val = (math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 2 * t)) * env * amp
            samples[i] += val
    return samples

# 2. Breeze: Gentle airy chord swell (C5 + E5 + G5)
def gen_breeze():
    duration = 1.4
    total_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * total_samples
    freqs = [523.25, 659.25, 783.99]  # C5, E5, G5
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Smooth attack & decay envelope
        if t < 0.2:
            env = 0.5 * (1 - math.cos(math.pi * t / 0.2))
        else:
            env = math.exp(-(t - 0.2) * 2.8)
        val = sum(math.sin(2 * math.pi * f * t) for f in freqs) / len(freqs)
        samples[i] = val * env * 0.75
    return samples

# 3. Digital: Clean modern medical reminder double-pip
def gen_digital():
    duration = 0.8
    total_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * total_samples
    pips = [
        (0.00, 0.10, 880.0),   # A5
        (0.14, 0.22, 1318.5),  # E6
    ]
    for start_t, end_t, freq in pips:
        start_idx = int(start_t * SAMPLE_RATE)
        end_idx = int(end_t * SAMPLE_RATE)
        pip_len = end_idx - start_idx
        for i in range(start_idx, min(end_idx, total_samples)):
            t = (i - start_idx) / SAMPLE_RATE
            # Envelope with quick fade-in/fade-out to avoid clicks
            pos = (i - start_idx) / pip_len
            env = math.sin(math.pi * pos)
            samples[i] = math.sin(2 * math.pi * freq * t) * env * 0.65
    return samples

# 4. Marimba: Warm acoustic wood tone (A4 -> C#5 -> E5)
def gen_marimba():
    duration = 1.2
    total_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * total_samples
    notes = [
        (0.00, 440.0, 0.45),
        (0.10, 554.37, 0.45),
        (0.20, 659.25, 0.50),
    ]
    for start_t, freq, amp in notes:
        start_idx = int(start_t * SAMPLE_RATE)
        for i in range(start_idx, total_samples):
            t = (i - start_idx) / SAMPLE_RATE
            env = math.exp(-t * 6.0)
            # Marimba overtone ratio ~ 3.9x
            val = (math.sin(2 * math.pi * freq * t) + 0.25 * math.sin(2 * math.pi * freq * 3.9 * t)) * env * amp
            samples[i] += val
    return samples

if __name__ == '__main__':
    sounds = {
        'sound_chime': gen_chime(),
        'sound_breeze': gen_breeze(),
        'sound_digital': gen_digital(),
        'sound_marimba': gen_marimba(),
    }

    out_dirs = [
        os.path.join(os.path.dirname(__file__), '..', 'public', 'sounds'),
        os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res', 'raw'),
    ]

    for out_dir in out_dirs:
        for name, data in sounds.items():
            path = os.path.join(out_dir, f"{name}.wav")
            write_wav(path, data)
