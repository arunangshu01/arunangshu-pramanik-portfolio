"""Generates public/ambient.m4a — BR2049-style dark synthwave score.

Deterministic: fixed seed => identical output every run. Tweak CONFIG and rerun:

    python3 scripts/gen_ambient.py && afconvert -f m4af -d aac -b 96000 /tmp/ambient.wav public/ambient.m4a
"""

import math, wave, struct, random

random.seed(11)

SR = 44100
OUT_WAV = "/tmp/ambient.wav"

CONFIG = {
    "duration": 40.0,
    "loop_xfade": 3.0,
    "throb_period": 1.2,      # heartbeat sub pulse
    "stab_times": (6.0, 18.0, 30.0),  # giant brass hits
    "blip_hz": (1046.5, 1568.0),
}

FREQ = dict(
    C1=32.70, G1=49.0, C2=65.41, Eb2=77.78, G2=98.0, Bb2=116.54,
    C3=130.81, Eb3=155.56, G3=196.0, C4=261.63, Eb4=311.13, G4=392.0,
)

# colossal drone chords (detuned supersaw stacks), one per era
DRONES = [
    (0.0, ["C2", "G2", "Eb3", "C3"]),
    (12.0, ["G1", "C2", "Bb2", "G2"]),
    (24.0, ["Eb2", "C2", "G2", "Eb3"]),
    (34.0, ["C2", "G2", "Eb3", "C3"]),
]

def supersaw(f, t):
    # 3 detuned saws + sub = the BR2049 wall of sound voice
    return (
        sum((1.0 / k) * math.sin(2 * math.pi * f * k * t) for k in range(1, 6))
        + sum((1.0 / k) * math.sin(2 * math.pi * f * 1.005 * k * t) for k in range(1, 6))
        + sum((1.0 / k) * math.sin(2 * math.pi * f * 0.995 * k * t) for k in range(1, 6))
        + 0.8 * math.sin(2 * math.pi * f * 0.5 * t)
    ) / 3.8


def render():
    dur = CONFIG["duration"]
    xf = int(CONFIG["loop_xfade"] * SR)
    total = int(SR * dur) + xf
    raw = []

    for i in range(total):
        t = i / SR
        s = 0.0

        # industrial heartbeat: distorted sub thump, felt more than heard
        ph = t % CONFIG["throb_period"]
        s += 0.22 * math.sin(2 * math.pi * (80.0 - 35.0 * min(ph, 0.2) / 0.2) * ph) * math.exp(-ph / 0.45)

        # drone chords with very slow swell in/out
        for start, notes in DRONES:
            rel = t - start
            if 0 <= rel <= 14:
                env = min(rel / 4.0, 1.0) * math.exp(-max(0.0, rel - 10.0) / 3.0)
                for n in notes:
                    s += env * 0.032 * supersaw(FREQ[n], rel)

        # giant brass stabs — the "sea wall" hits
        for st0 in CONFIG["stab_times"]:
            rel = t - st0
            if 0 <= rel < 6:
                env = min(rel / 0.03, 1.0) * math.exp(-rel / 1.6)
                s += env * 0.16 * supersaw(FREQ["C2"], rel)

        # sparse reverb-y pings — distant synth calls
        pings = [(4.0, "C4"), (13.5, "Eb4"), (22.0, "G4"), (31.0, "Eb4"), (37.0, "C4")]
        for start, n in pings:
            rel = t - start
            if rel > 0:
                f = FREQ[n]
                e = math.exp(-rel / 3.0)
                s += e * 0.05 * (math.sin(2 * math.pi * f * rel) + 0.25 * math.sin(2 * math.pi * f * 2 * rel))

        # rare dry blips
        bph = t % 9.0
        for k, f in enumerate(CONFIG["blip_hz"]):
            st = k * 0.5
            if bph > st:
                s += 0.010 * math.sin(2 * math.pi * f * (bph - st)) * math.exp(-(bph - st) / 0.15)

        # analog hiss
        s += 0.003 * (random.random() * 2 - 1)

        raw.append(s)

    head = int(SR * dur)
    out = bytearray()
    for i in range(head):
        s = raw[i]
        if i < xf:
            s = raw[i] * (i / xf) + raw[head + i] * (1.0 - i / xf)
        out += struct.pack("<h", int(max(-1.0, min(1.0, s)) * 32767))

    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(out))
    print(f"wrote {OUT_WAV} ({dur}s, seed=11)")


if __name__ == "__main__":
    render()
