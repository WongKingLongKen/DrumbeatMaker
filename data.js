(() => {
    const sequenceLength = 16;

    function cells(notes) {
        const lane = Array.from({ length: sequenceLength }, () => ({ on: false, velocity: 0.8 }));

        for (const [step, velocity] of notes) {
            lane[step] = { on: true, velocity };
        }

        return lane;
    }

    const TRACKS = [
        { name: 'Kick', id: 'kick', key: '1', help: '808 boom' },
        { name: 'Snare', id: 'snare', key: '2', help: 'backbeat' },
        { name: 'Hat', id: 'hat', key: '3', help: 'pulse' },
        { name: 'Perc', id: 'perc', key: '4', help: 'texture' },
    ];

    const PAD_LAYOUT = [
        { id: 'kick', label: 'Kick', subtitle: '808 sub', key: '1' },
        { id: 'snare', label: 'Snare', subtitle: '909 crack', key: '2' },
        { id: 'hat', label: 'Closed Hat', subtitle: 'tight pulse', key: '3' },
        { id: 'openHat', label: 'Open Hat', subtitle: 'lift the bar', key: '4' },
        { id: 'rim', label: 'Rim', subtitle: 'soft click', key: 'Q' },
        { id: 'clap', label: 'Clap', subtitle: 'wide snap', key: 'W' },
        { id: 'tomLow', label: 'Low Tom', subtitle: 'warm body', key: 'E' },
        { id: 'tomHigh', label: 'High Tom', subtitle: 'lift the groove', key: 'R' },
        { id: 'ghost', label: 'Ghost', subtitle: 'barely there', key: 'A' },
        { id: 'shaker', label: 'Shaker', subtitle: 'soft motion', key: 'S' },
        { id: 'bell', label: 'Bell', subtitle: 'sparkle', key: 'D' },
        { id: 'crash', label: 'Crash', subtitle: 'scene change', key: 'F' },
        { id: 'sub', label: 'Sub Hit', subtitle: 'low weight', key: 'Z' },
        { id: 'wood', label: 'Wood Block', subtitle: 'dry accent', key: 'X' },
        { id: 'ride', label: 'Ride', subtitle: 'soft wash', key: 'C' },
        { id: 'fx', label: 'FX', subtitle: 'air and space', key: 'V' },
    ];

    const TRACK_DEFAULT_VELOCITIES = {
        0: 0.95,
        1: 0.9,
        2: 0.62,
        3: 0.48,
    };

    const GENRES = {
        basics: {
            label: 'Beat Basics',
            tempo: 88,
            swing: 0.04,
            gap: 8,
            description: 'Lock the snare on 2 and 4, keep the kick simple, and use hats to count the grid.',
            tip: 'Less is more. A clear backbeat makes the pocket easier to hear than a busy pattern.',
            summary: 'Beat Basics at 88 BPM with a light swing and a small pocket gap. The starter groove keeps the backbeat clear.',
            pattern: {
                kick: cells([[0, 0.95], [7, 0.84], [8, 0.92], [14, 0.88]]),
                snare: cells([[4, 0.95], [12, 0.95]]),
                hat: cells([[0, 0.58], [2, 0.54], [4, 0.62], [6, 0.54], [8, 0.6], [10, 0.54], [12, 0.62], [14, 0.54]]),
                perc: cells([[11, 0.42], [15, 0.4]]),
            },
        },
        soul: {
            label: 'R&B / Soul',
            tempo: 76,
            swing: 0.14,
            gap: 22,
            description: 'Use fewer notes, add ghost hits, and let the snare sit a little behind the grid.',
            tip: 'A sparse kick pattern leaves room for the groove. Ghost notes should feel small, not loud.',
            summary: 'R&B / Soul at 76 BPM with stronger swing and more gap on the pocket tracks. The loop stays relaxed and spacious.',
            pattern: {
                kick: cells([[0, 0.9], [6, 0.72], [8, 0.86], [13, 0.74]]),
                snare: cells([[4, 0.9], [10, 0.48], [12, 0.93]]),
                hat: cells([[1, 0.42], [3, 0.52], [5, 0.4], [7, 0.5], [9, 0.42], [11, 0.52], [13, 0.4], [15, 0.48]]),
                perc: cells([[7, 0.35], [15, 0.34]]),
            },
        },
        neoSoul: {
            label: 'Neo Soul',
            tempo: 68,
            swing: 0.24,
            gap: 34,
            description: 'Lean into halftime space, syncopated hats, and deep kick placement for a looser feel.',
            tip: 'Neo soul is about balance: keep the groove deep, but leave enough air around every accent.',
            summary: 'Neo Soul at 68 BPM with a deeper pocket and a larger delay on kick and hat lanes. The rhythm breathes more between hits.',
            pattern: {
                kick: cells([[0, 0.92], [3, 0.58], [6, 0.72], [10, 0.8], [13, 0.56]]),
                snare: cells([[8, 0.92], [12, 0.52]]),
                hat: cells([[0, 0.38], [2, 0.48], [3, 0.34], [5, 0.42], [7, 0.36], [8, 0.42], [10, 0.5], [11, 0.36], [13, 0.44], [15, 0.34]]),
                perc: cells([[4, 0.38], [14, 0.44]]),
            },
        },
    };

    window.DrumbeatData = {
        TRACKS,
        PAD_LAYOUT,
        TRACK_DEFAULT_VELOCITIES,
        sequenceLength,
        GENRES,
        cells,
    };
})();