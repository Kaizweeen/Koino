"""Synthesizes the promo's soundtrack from storyboard.json: no samples, no licensed music.

A lock-screen pile-up of dings and buzzes that cuts to silence, then a warm pad and a felt-piano
arpeggio that follow the video's scenes chord by chord, with chimes on the moments that matter
(stillness, the brand, Amen, the call to action) and soft keystrokes under the typing.

    python3 promo/music.py            -> promo/build/music.wav
"""

import json
import os
import re

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SB = json.load(open(os.path.join(HERE, "storyboard.json")))
MF_PATH = os.path.join(BUILD, "manifest.json")
MF = json.load(open(MF_PATH)) if os.path.exists(MF_PATH) else {"clips": {}}

SR = 44100
DUR = SB["duration"]
N = int(DUR * SR)
RNG = np.random.default_rng(1102)
M = SB["music"]
BEAT = 60.0 / M["bpm"]


def bus():
    return np.zeros((2, N + SR * 6))


hook, pad, keys, bells, fx = bus(), bus(), bus(), bus(), bus()


def freq(name):
    m = re.fullmatch(r"([A-G])(#|b)?(-?\d)", name)
    step = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[m.group(1)]
    step += {"#": 1, "b": -1, None: 0}[m.group(2)]
    midi = 12 * (int(m.group(3)) + 1) + step
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(b, t0, sig, pan=0.0, gain=1.0):
    """Adds a mono or stereo signal into a bus at time t0 with constant-power panning."""
    i = int(round(t0 * SR))
    if i >= b.shape[1]:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    n = min(sig.shape[1], b.shape[1] - i)
    b[:, i : i + n] += sig[:, :n] * gain


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


# ———————————————————————————————————— instruments


def piano(f0, vel=0.7, length=3.2):
    """A soft felt piano: stretched partials, two slightly detuned strings, two-stage decay."""
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    base = 0.55 + f0 / 900.0
    for k in range(1, 13):
        fk = k * f0 * np.sqrt(1 + 0.00025 * k * k)
        if fk > 12000:
            break
        amp = (1.0 / k**1.25) * np.exp(-k * (0.42 - 0.22 * vel))
        d = base * (1 + 0.45 * k)
        env = 0.72 * np.exp(-t * d * 2.2) + 0.28 * np.exp(-t * d * 0.42)
        ph = RNG.uniform(0, 2 * np.pi)
        out += amp * env * (np.sin(2 * np.pi * fk * t + ph) + 0.6 * np.sin(2 * np.pi * fk * 1.0006 * t + ph))
    attack = np.minimum(1, t / 0.005)
    hammer = lowpass(RNG.standard_normal(len(t)) * np.exp(-t * 180), 2400) * 0.05 * vel
    tail = np.minimum(1, (length - t) / 0.4)
    return (out * attack * vel + hammer) * tail / 1.8


def bell(f0, length=4.5, bright=1.0):
    """An inharmonic chime with a quick shimmer."""
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    for ratio, amp, dec in [(1, 1, 1.1), (2.0, 0.5, 1.6), (2.76, 0.32 * bright, 2.4), (4.07, 0.2 * bright, 3.4), (5.4, 0.1 * bright, 4.6)]:
        out += amp * np.exp(-t * dec) * np.sin(2 * np.pi * f0 * ratio * t)
    return out * np.minimum(1, t / 0.003) * np.minimum(1, (length - t) / 0.3) / 2.0


def pad_voice(f0, length, attack=1.4, release=2.0):
    """Three detuned soft saws, softened further by the pad bus's low-pass."""
    t = np.arange(int(length * SR)) / SR
    stereo = np.zeros((2, len(t)))
    for cents, pan in [(-7, -0.6), (0, 0.0), (7, 0.6)]:
        f = f0 * 2 ** (cents / 1200)
        ph = RNG.uniform(0, 2 * np.pi, 10)
        v = sum((1 / k) * np.exp(-k / 3.2) * np.sin(2 * np.pi * f * k * t + ph[k - 1]) for k in range(1, 11) if f * k < 9000)
        a = (pan + 1) * np.pi / 4
        stereo += np.stack([v * np.cos(a), v * np.sin(a)])
    env = np.minimum(1, t / attack) * np.clip((length - t) / release, 0, 1)
    env *= 1 + 0.07 * np.sin(2 * np.pi * 0.18 * t + RNG.uniform(0, 6))
    return stereo * env / 3


def ding(f0, t0, pan):
    """A phone notification: two quick glassy notes."""
    for i, mult in enumerate([1.0, 1.335]):
        sig = bell(f0 * mult, length=0.9, bright=0.6)
        place(hook, t0 + i * 0.075, sig, pan=pan, gain=0.32)


def buzz(t0, length=0.32):
    """A phone vibrating against a table."""
    t = np.arange(int(length * SR)) / SR
    motor = np.sign(np.sin(2 * np.pi * 172 * t)) * 0.5 + np.sin(2 * np.pi * 344 * t) * 0.3
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 28 * t)
    env = np.minimum(1, t / 0.01) * np.minimum(1, (length - t) / 0.04)
    place(hook, t0, lowpass(motor * am * env, 900), pan=RNG.uniform(-0.3, 0.3), gain=0.22)


def noise_swell(t0, length=0.9, peak=0.75, gain=0.06, lo=500, hi=6000):
    t = np.arange(int(length * SR)) / SR
    x = RNG.standard_normal((2, len(t)))
    x = np.stack([highpass(lowpass(c, hi), lo) for c in x])
    env = np.where(t < peak * length, (t / (peak * length)) ** 2.2, np.clip(1 - (t - peak * length) / ((1 - peak) * length), 0, 1))
    place(fx, t0, x * env, gain=gain)


def click(t0, gain=0.03, tone=3200):
    length = 0.025
    t = np.arange(int(length * SR)) / SR
    x = highpass(RNG.standard_normal(len(t)), tone) * np.exp(-t * 260)
    place(fx, t0, x, pan=RNG.uniform(-0.15, 0.15), gain=gain)


# ———————————————————————————————————— the hook: noise

h = SB["hook"]
at, gap = h["first"], h["gap"]
ding_notes = [1318.5, 1174.7, 1568.0, 1396.9, 1760.0, 1244.5, 1661.2]
for i in range(h["count"]):
    buzz(at)
    ding(ding_notes[i % len(ding_notes)], at + 0.02, pan=(-0.5, 0.4, -0.1, 0.6, -0.6, 0.2)[i % 6])
    at += gap
    gap *= h["accel"]

# A low, rising unease under the pile-up.
t = np.arange(int(M["start"] * SR)) / SR
rumble = lowpass(RNG.standard_normal(len(t)), 180) * 3 + np.sin(2 * np.pi * (52 + 6 * t / M["start"]) * t)
place(hook, 0, rumble * (t / M["start"]) ** 2 * 0.09)

# Hard cut to silence the instant stillness arrives.
cut = int(M["start"] * SR)
hook[:, cut:] = 0
hook[:, cut - 400 : cut] *= np.linspace(1, 0, 400)

# ———————————————————————————————————— the devotion: pad, piano, bells

chords = M["chords"]
ends = [c["at"] for c in chords[1:]] + [DUR]
for c, end in zip(chords, ends):
    notes = [freq(n) for n in c["notes"]]
    first = c is chords[0]
    length = end - c["at"] + 1.0
    for f in notes[1:]:
        place(pad, c["at"] - (0 if first else 0.25), pad_voice(f, length, attack=2.6 if first else 1.1, release=1.2), gain=0.11)
    # Bass: a sine sub plus a low piano note on each change.
    tt = np.arange(int(length * SR)) / SR
    sub = np.sin(2 * np.pi * notes[0] / 2 * tt) * np.minimum(1, tt / 0.6) * np.clip((length - tt) / 1.6, 0, 1)
    place(pad, c["at"], sub, gain=0.035)
    place(keys, c["at"], piano(notes[0], 0.55, 4.0), pan=-0.2, gain=0.42)


def chord_at(t):
    cur = chords[0]
    for c in chords:
        if c["at"] <= t + 1e-6:
            cur = c
    return [freq(n) for n in cur["notes"]]


step = 0
for section in M["arpeggio"]:
    t = section["from"]
    while t < section["to"] - 1e-6:
        ns = chord_at(t)
        pool = [ns[2] * 2, ns[3] * 2, ns[4] * 2, ns[2] * 4, ns[3] * 4] if section["every"] >= 0.75 else [ns[1] * 2, ns[2] * 2, ns[3] * 2, ns[4] * 2, ns[2] * 4]
        walk = [0, 1, 2, 3, 4, 3, 2, 1]
        f = pool[walk[step % len(walk)] % len(pool)]
        b = (t - M["start"]) / BEAT
        downbeat = abs(b - round(b)) < 1e-3 and round(b) % 4 == 0
        vel = (0.62 if downbeat else 0.42) + RNG.uniform(-0.06, 0.06)
        place(keys, t, piano(f, vel, 2.6), pan=0.35 if step % 2 else -0.05, gain=0.36)
        step += 1
        t += section["every"]

# The promise lines each get one clear note, rising.
for t0, n in zip(M["promiseHits"], ["A4", "D5", "F#5", "A5"]):
    place(keys, t0, piano(freq(n), 0.7, 3.5), pan=0.1, gain=0.5)
    place(keys, t0, piano(freq(n) / 2, 0.45, 3.5), pan=-0.1, gain=0.3)

for i, t0 in enumerate(M["chimes"]):
    big = t0 == 31.5
    place(bells, t0, bell(freq("D6"), 5.0), pan=0.15, gain=0.2 if big else 0.13)
    place(bells, t0 + 0.012, bell(freq("A5"), 5.0), pan=-0.2, gain=0.1)
    if big:  # Amen: a small ascending sparkle
        for j, n in enumerate(["F#6", "A6", "D7", "E7"]):
            place(bells, t0 + 0.11 + j * 0.07, bell(freq(n), 3.0, 0.7), pan=-0.4 + j * 0.3, gain=0.06)

for t0 in M["swells"]:
    noise_swell(t0 - 0.5, length=1.1, gain=0.05)

# ———————————————————————————————————— interface sounds

for clip in MF["clips"].values():
    for k in clip.get("keys", []):
        click(k, gain=0.05, tone=RNG.uniform(2600, 4200))
    for tap in clip.get("taps", []):
        click(tap["t"], gain=0.06, tone=1500)
for seg in SB["phone"]:
    if seg.get("enter") == "slide":
        noise_swell(seg["at"] - 0.05, length=0.38, peak=0.4, gain=0.035, lo=900, hi=5000)

# ———————————————————————————————————— space and master


def reverb(x, seconds=3.4, pre=0.02):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal((2, n)) * np.exp(-t / (seconds / 6.5))
    ir = np.stack([lowpass(c, 5200) for c in ir])
    ir = np.concatenate([np.zeros((2, int(pre * SR))), ir], axis=1)
    ir /= np.sqrt((ir**2).sum(axis=1, keepdims=True))
    return np.stack([fftconvolve(x[i], ir[i])[: x.shape[1]] for i in range(2)])


pad = np.stack([lowpass(c, 2300, 4) for c in pad])
mix = (
    hook + reverb(hook, 1.2) * 0.25
    + pad * 0.85 + reverb(pad) * 0.5
    + keys + reverb(keys) * 0.55
    + bells + reverb(bells, 4.5) * 0.7
    + fx + reverb(fx, 1.5) * 0.3
)[:, :N]

# A slow fade out over the held end card.
t = np.arange(N) / SR
mix *= np.clip((DUR - t) / 2.2, 0, 1)
mix = np.stack([highpass(c, 32) for c in mix])
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.abs(mix).max() / 0.89

os.makedirs(BUILD, exist_ok=True)
out = os.path.join(BUILD, "music.wav")
wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
print(f"wrote {os.path.relpath(out)} ({DUR:.1f}s, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS)")
