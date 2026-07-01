const { TRACKS, PAD_LAYOUT, TRACK_DEFAULT_VELOCITIES, sequenceLength, GENRES } = window.DrumbeatData;
const DrumbeatAudio = window.DrumbeatAudio;

const state = {
    genre: 'basics',
    tempo: GENRES.basics.tempo,
    swing: GENRES.basics.swing,
    gap: GENRES.basics.gap,
    sequence: createEmptySequence(),
    playhead: 0,
    playing: false,
    stepDurations: buildStepDurations(GENRES.basics.tempo, GENRES.basics.swing),
    transportStart: 0,
    stepStart: 0,
    timer: null,
    hitHistory: [],
    hitCounts: { early: 0, late: 0, dead: 0 },
    audioContext: null,
};

const elements = {
    genreButtons: document.getElementById('genreButtons'),
    genreTitle: document.getElementById('genreTitle'),
    genreDescription: document.getElementById('genreDescription'),
    genreTip: document.getElementById('genreTip'),
    tempoSlider: document.getElementById('tempoSlider'),
    swingSlider: document.getElementById('swingSlider'),
    gapSlider: document.getElementById('gapSlider'),
    tempoValue: document.getElementById('tempoValue'),
    swingValue: document.getElementById('swingValue'),
    gapValue: document.getElementById('gapValue'),
    currentFeel: document.getElementById('currentFeel'),
    loopLength: document.getElementById('loopLength'),
    padGrid: document.getElementById('padGrid'),
    sequencerBoard: document.getElementById('sequencerBoard'),
    playButton: document.getElementById('playButton'),
    stopButton: document.getElementById('stopButton'),
    clearButton: document.getElementById('clearButton'),
    resetButton: document.getElementById('resetButton'),
    midiButton: document.getElementById('midiButton'),
    wavButton: document.getElementById('wavButton'),
    statusLine: document.getElementById('statusLine'),
    exportSummary: document.getElementById('exportSummary'),
    accuracyScore: document.getElementById('accuracyScore'),
    deadOnCount: document.getElementById('deadOnCount'),
    earlyCount: document.getElementById('earlyCount'),
    lateCount: document.getElementById('lateCount'),
    hitLog: document.getElementById('hitLog'),
    tabs: document.querySelectorAll('.tab-button'),
    panels: document.querySelectorAll('.tab-panel'),
};

const padKeyMap = new Map(PAD_LAYOUT.map((pad) => [pad.key.toLowerCase(), pad.id]));

renderGenreButtons();
renderPadGrid();
renderSequencer();
applyGenre('basics', { resetControls: true, announce: false });
bindEvents();
refreshUI();

function createEmptySequence() {
    return TRACKS.map(() => Array.from({ length: sequenceLength }, () => ({ on: false, velocity: 0.8 })));
}

function buildStepDurations(tempo, swing) {
    const baseStep = 60000 / tempo / 4;
    return Array.from({ length: sequenceLength }, (_, step) => (step % 2 === 0 ? baseStep * (1 - swing * 0.5) : baseStep * (1 + swing * 0.5)));
}

function renderGenreButtons() {
    elements.genreButtons.innerHTML = '';

    for (const [genreKey, label] of [
        ['basics', GENRES.basics.label],
        ['soul', GENRES.soul.label],
        ['neoSoul', GENRES.neoSoul.label],
    ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'genre-button';
        button.dataset.genre = genreKey;
        button.textContent = label;
        button.addEventListener('click', () => applyGenre(genreKey));
        elements.genreButtons.appendChild(button);
    }
}

function renderPadGrid() {
    elements.padGrid.innerHTML = '';

    for (const pad of PAD_LAYOUT) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pad';
        button.dataset.pad = pad.id;
        button.dataset.key = pad.key;
        button.innerHTML = `<strong>${pad.label}</strong><span>${pad.subtitle}</span><small>${pad.key}</small>`;
        button.addEventListener('pointerdown', async () => {
            await DrumbeatAudio.ensureAudio(state);
            triggerPad(pad.id, 1, true);
        });
        elements.padGrid.appendChild(button);
    }
}

function renderSequencer() {
    elements.sequencerBoard.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'sequencer-row';
    header.appendChild(createSequencerLabel('Step', '1 bar'));

    for (let step = 0; step < sequenceLength; step += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'step is-label';
        cell.textContent = String(step + 1);
        header.appendChild(cell);
    }

    elements.sequencerBoard.appendChild(header);

    TRACKS.forEach((track, trackIndex) => {
        const row = document.createElement('div');
        row.className = 'sequencer-row';
        row.dataset.track = track.id;
        row.appendChild(createSequencerLabel(track.name, track.help));

        for (let step = 0; step < sequenceLength; step += 1) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'step';
            button.dataset.track = String(trackIndex);
            button.dataset.step = String(step);
            button.dataset.bar = String(step % 4 === 0);
            button.setAttribute('aria-label', `${track.name} step ${step + 1}`);
            button.addEventListener('click', (event) => toggleStep(trackIndex, step, event.shiftKey));
            row.appendChild(button);
        }

        elements.sequencerBoard.appendChild(row);
    });
}

function createSequencerLabel(title, subtitle) {
    const label = document.createElement('div');
    label.className = 'sequencer-track';
    label.innerHTML = `<span>${title}</span><small>${subtitle}</small>`;
    return label;
}

function bindEvents() {
    elements.tempoSlider.addEventListener('input', () => {
        state.tempo = Number(elements.tempoSlider.value);
        state.stepDurations = buildStepDurations(state.tempo, state.swing);
        refreshUI();
    });

    elements.swingSlider.addEventListener('input', () => {
        state.swing = Number(elements.swingSlider.value) / 100;
        state.stepDurations = buildStepDurations(state.tempo, state.swing);
        refreshUI();
    });

    elements.gapSlider.addEventListener('input', () => {
        state.gap = Number(elements.gapSlider.value);
        refreshUI();
    });

    elements.playButton.addEventListener('click', async () => {
        await DrumbeatAudio.ensureAudio(state);
        startPlayback();
    });

    elements.stopButton.addEventListener('click', stopPlayback);
    elements.clearButton.addEventListener('click', clearPattern);
    elements.resetButton.addEventListener('click', () => applyGenre(state.genre, { resetControls: false }));
    elements.midiButton.addEventListener('click', downloadMidi);
    elements.wavButton.addEventListener('click', downloadWav);

    elements.tabs.forEach((button) => {
        button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    window.addEventListener('keydown', async (event) => {
        if (event.key === ' ') {
            event.preventDefault();
            if (state.playing) {
                stopPlayback();
            } else {
                await DrumbeatAudio.ensureAudio(state);
                startPlayback();
            }

            return;
        }

        const key = event.key.toLowerCase();
        const padId = padKeyMap.get(key);

        if (padId) {
            await DrumbeatAudio.ensureAudio(state);
            triggerPad(padId, 1, true);
        }
    });
}

function setActiveTab(tabId) {
    elements.tabs.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.tab === tabId);
    });

    elements.panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.id === tabId);
    });
}

function applyGenre(genreKey, options = {}) {
    const genre = GENRES[genreKey];

    if (!genre) {
        return;
    }

    state.genre = genreKey;
    state.tempo = genre.tempo;
    state.swing = genre.swing;
    state.gap = genre.gap;
    state.sequence = clonePattern(genre.pattern);
    state.stepDurations = buildStepDurations(state.tempo, state.swing);

    if (options.resetControls !== false) {
        elements.tempoSlider.value = String(genre.tempo);
        elements.swingSlider.value = String(Math.round(genre.swing * 100));
        elements.gapSlider.value = String(genre.gap);
    }

    elements.genreButtons.querySelectorAll('.genre-button').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.genre === genreKey);
    });

    elements.genreTitle.textContent = genre.label;
    elements.genreDescription.textContent = genre.description;
    elements.genreTip.textContent = genre.tip;
    elements.currentFeel.textContent = genre.label;
    elements.exportSummary.textContent = genre.summary;

    refreshUI();

    if (options.announce !== false) {
        setStatus(`Loaded ${genre.label}.`);
    }
}

function clonePattern(pattern) {
    return TRACKS.map((track) => pattern[track.id].map((cell) => ({ ...cell })));
}

function toggleStep(trackIndex, stepIndex, soft = false) {
    const cell = state.sequence[trackIndex][stepIndex];

    if (soft) {
        state.sequence[trackIndex][stepIndex] = {
            on: true,
            velocity: cell.on ? cell.velocity : 0.42,
        };
    } else {
        state.sequence[trackIndex][stepIndex] = cell.on
            ? { on: false, velocity: cell.velocity }
            : { on: true, velocity: TRACK_DEFAULT_VELOCITIES[trackIndex] };
    }

    refreshSequencerCells();
}

function clearPattern() {
    state.sequence = createEmptySequence();
    refreshUI();
    setStatus('Pattern cleared.');
}

function refreshUI() {
    elements.tempoValue.textContent = `${state.tempo} BPM`;
    elements.swingValue.textContent = `${Math.round(state.swing * 100)}%`;
    elements.gapValue.textContent = `${state.gap} ms`;
    elements.loopLength.textContent = '1 bar';
    refreshSequencerCells();
    elements.exportSummary.textContent = GENRES[state.genre].summary;
}

function refreshSequencerCells() {
    const buttons = elements.sequencerBoard.querySelectorAll('.step[data-track]');

    buttons.forEach((button) => {
        const trackIndex = Number(button.dataset.track);
        const stepIndex = Number(button.dataset.step);
        const cell = state.sequence[trackIndex][stepIndex];

        button.classList.toggle('is-on', cell.on);
        button.classList.toggle('is-soft', cell.on && cell.velocity < 0.55);
        button.classList.toggle('is-current', state.playing && stepIndex === state.playhead);
        button.classList.toggle('is-bar', stepIndex % 4 === 0);
        button.textContent = cell.on ? '•' : '';
    });
}

function setStatus(message) {
    elements.statusLine.textContent = message;
}

function startPlayback() {
    if (state.playing) {
        stopPlayback();
    }

    state.playing = true;
    state.playhead = 0;
    state.transportStart = performance.now();
    state.stepStart = state.transportStart;
    state.hitHistory = [];
    state.hitCounts = { early: 0, late: 0, dead: 0 };
    elements.playButton.textContent = 'Playing';
    elements.playButton.classList.add('is-primary');
    setStatus(`Playing ${GENRES[state.genre].label} at ${state.tempo} BPM.`);
    scheduleNextStep();
    refreshSequencerCells();
}

function stopPlayback() {
    state.playing = false;

    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    elements.playButton.textContent = 'Play';
    refreshSequencerCells();
    setStatus('Playback stopped.');
}

function scheduleNextStep() {
    if (!state.playing) {
        return;
    }

    const step = state.playhead;
    const now = performance.now();
    state.stepStart = now;
    playSequenceStep(step);
    refreshSequencerCells();

    const duration = state.stepDurations[step];
    state.timer = window.setTimeout(() => {
        state.playhead = (state.playhead + 1) % sequenceLength;
        scheduleNextStep();
    }, duration);
}

function playSequenceStep(step) {
    const audioTime = state.audioContext.currentTime;
    TRACKS.forEach((track, trackIndex) => {
        const cell = state.sequence[trackIndex][step];

        if (!cell.on) {
            return;
        }

        const offset = track.id === 'snare' ? 0 : state.gap / 1000;
        DrumbeatAudio.triggerSound(state.audioContext, track.id, cell.velocity, audioTime + offset);
    });

    if (step % 4 === 0) {
        DrumbeatAudio.triggerSound(state.audioContext, 'click', 0.4, audioTime);
    }
}

function triggerPad(padId, velocity = 1, fromInteraction = false) {
    const trackVelocity = Math.max(0.2, Math.min(1, velocity));
    const startTime = state.audioContext.currentTime + 0.005;
    DrumbeatAudio.triggerSound(state.audioContext, padId, trackVelocity, startTime);
    flashPad(padId);

    if (fromInteraction) {
        recordHit();
    }
}

function flashPad(padId) {
    const button = elements.padGrid.querySelector(`[data-pad="${padId}"]`);
    if (!button) {
        return;
    }

    button.classList.add('is-active');
    window.setTimeout(() => button.classList.remove('is-active'), 120);
}

function recordHit() {
    if (!state.playing) {
        pushHit('Tap added', 'Practice mode', 'Tap while the loop is playing to score timing.');
        updateScoreboard();
        return;
    }

    const elapsed = (performance.now() - state.transportStart) % getBarDuration();
    let nearestDistance = Number.POSITIVE_INFINITY;
    let cursor = 0;

    for (let index = 0; index < state.stepDurations.length; index += 1) {
        const distance = elapsed - cursor;
        if (Math.abs(distance) < Math.abs(nearestDistance)) {
            nearestDistance = distance;
        }
        cursor += state.stepDurations[index];
    }

    const absoluteDistance = Math.abs(nearestDistance);
    let rating = 'dead on';

    if (absoluteDistance <= 25) {
        state.hitCounts.dead += 1;
    } else if (nearestDistance < 0) {
        state.hitCounts.early += 1;
        rating = 'early';
    } else {
        state.hitCounts.late += 1;
        rating = 'late';
    }

    const score = Math.max(20, Math.round(100 - Math.min(absoluteDistance * 1.5, 80)));
    pushHit(`Score ${score}`, rating, `${Math.round(nearestDistance)} ms from the grid.`);
    updateScoreboard();
}

function pushHit(title, rating, detail) {
    const entry = { title, rating, detail };
    state.hitHistory.unshift(entry);
    state.hitHistory = state.hitHistory.slice(0, 5);

    elements.hitLog.innerHTML = '';
    for (const hit of state.hitHistory) {
        const row = document.createElement('div');
        row.className = 'accuracy-hit';
        row.innerHTML = `<strong>${hit.title}</strong><span>${hit.rating} · ${hit.detail}</span>`;
        elements.hitLog.appendChild(row);
    }
}

function updateScoreboard() {
    const total = state.hitCounts.early + state.hitCounts.late + state.hitCounts.dead;
    const accuracy = total === 0 ? 100 : Math.max(0, Math.round((state.hitCounts.dead / total) * 100));
    elements.accuracyScore.textContent = String(accuracy);
    elements.deadOnCount.textContent = String(state.hitCounts.dead);
    elements.earlyCount.textContent = String(state.hitCounts.early);
    elements.lateCount.textContent = String(state.hitCounts.late);
}

function getBarDuration() {
    return state.stepDurations.reduce((sum, duration) => sum + duration, 0);
}

async function downloadMidi() {
    const bytes = buildMidiFile();
    downloadBlob(new Blob([bytes], { type: 'audio/midi' }), `drumbeat-maker-${state.genre}.mid`);
    setStatus('MIDI file ready for download.');
}

async function downloadWav() {
    await DrumbeatAudio.ensureAudio(state);
    const renderDuration = getBarDuration() + 1.0;
    const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offline = new OfflineContext(2, Math.ceil(state.audioContext.sampleRate * renderDuration), state.audioContext.sampleRate);

    renderSequenceToContext(offline);

    const buffer = await offline.startRendering();
    const wav = encodeWav(buffer);
    downloadBlob(new Blob([wav], { type: 'audio/wav' }), `drumbeat-maker-${state.genre}.wav`);
    setStatus('WAV loop rendered and ready to download.');
}

function renderSequenceToContext(context) {
    const baseStep = 60000 / state.tempo / 4;
    let currentTime = 0;

    for (let step = 0; step < sequenceLength; step += 1) {
        const stepTime = currentTime;
        TRACKS.forEach((track, trackIndex) => {
            const cell = state.sequence[trackIndex][step];
            if (!cell.on) {
                return;
            }

            const offset = track.id === 'snare' ? 0 : state.gap / 1000;
            DrumbeatAudio.triggerSound(context, track.id, cell.velocity, stepTime + offset);
        });

        currentTime += step % 2 === 0 ? baseStep * (1 - state.swing * 0.5) : baseStep * (1 + state.swing * 0.5);
    }
}

function buildMidiFile() {
    const ticksPerQuarter = 960;
    const ticksPerStep = ticksPerQuarter / 4;
    const tempoMicroseconds = Math.round(60000000 / state.tempo);
    const notes = [];

    TRACKS.forEach((track, trackIndex) => {
        for (let step = 0; step < sequenceLength; step += 1) {
            const cell = state.sequence[trackIndex][step];
            if (!cell.on) {
                continue;
            }

            const stepSeconds = getStepStartSeconds(step);
            const trackOffset = track.id === 'snare' ? 0 : state.gap / 1000;
            const startTicks = Math.round((stepSeconds + trackOffset) * ticksPerQuarter * state.tempo / 60);
            const durationTicks = Math.round(ticksPerStep * 0.82);

            notes.push({ tick: startTicks, type: 'on', note: trackToMidi(track.id), velocity: Math.max(20, Math.min(127, Math.round(cell.velocity * 127))) });
            notes.push({ tick: startTicks + durationTicks, type: 'off', note: trackToMidi(track.id), velocity: 0 });
        }
    });

    notes.sort((a, b) => {
        if (a.tick !== b.tick) {
            return a.tick - b.tick;
        }

        if (a.type === b.type) {
            return 0;
        }

        return a.type === 'off' ? -1 : 1;
    });

    const trackBytes = [];
    trackBytes.push(...writeMetaEvent(0, 0x51, [tempoMicroseconds >> 16 & 0xff, tempoMicroseconds >> 8 & 0xff, tempoMicroseconds & 0xff]));

    let lastTick = 0;
    for (const note of notes) {
        const delta = note.tick - lastTick;
        lastTick = note.tick;
        trackBytes.push(...writeVariableLength(delta));
        if (note.type === 'on') {
            trackBytes.push(0x90, note.note, note.velocity);
        } else {
            trackBytes.push(0x80, note.note, 0);
        }
    }

    trackBytes.push(...writeVariableLength(0), 0xff, 0x2f, 0x00);

    const header = [
        0x4d, 0x54, 0x68, 0x64,
        0x00, 0x00, 0x00, 0x06,
        0x00, 0x00,
        0x00, 0x01,
        ticksPerQuarter >> 8, ticksPerQuarter & 0xff,
    ];

    const trackHeader = [
        0x4d, 0x54, 0x72, 0x6b,
        (trackBytes.length >> 24) & 0xff,
        (trackBytes.length >> 16) & 0xff,
        (trackBytes.length >> 8) & 0xff,
        trackBytes.length & 0xff,
    ];

    return new Uint8Array([...header, ...trackHeader, ...trackBytes]);

    function writeMetaEvent(delta, type, data) {
        return [...writeVariableLength(delta), 0xff, type, data.length, ...data];
    }
}

function getStepStartSeconds(step) {
    let total = 0;
    for (let index = 0; index < step; index += 1) {
        total += state.stepDurations[index] / 1000;
    }
    return total;
}

function trackToMidi(id) {
    const lookup = {
        kick: 36,
        snare: 38,
        hat: 42,
        openHat: 46,
        rim: 37,
        clap: 39,
        tomLow: 45,
        tomHigh: 50,
        ghost: 40,
        shaker: 82,
        bell: 76,
        crash: 49,
        sub: 41,
        wood: 75,
        ride: 51,
        fx: 83,
    };

    return lookup[id] || 36;
}

function writeVariableLength(value) {
    let buffer = value & 0x7f;

    while ((value >>= 7)) {
        buffer <<= 8;
        buffer |= ((value & 0x7f) | 0x80);
    }

    const bytes = [];
    while (true) {
        bytes.push(buffer & 0xff);
        if (buffer & 0x80) {
            buffer >>= 8;
        } else {
            break;
        }
    }

    return bytes;
}

function encodeWav(buffer) {
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const frameCount = buffer.length;
    const bytesPerSample = 2;
    const dataSize = frameCount * channels * bytesPerSample;
    const output = new ArrayBuffer(44 + dataSize);
    const view = new DataView(output);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = [];
    for (let channel = 0; channel < channels; channel += 1) {
        channelData.push(buffer.getChannelData(channel));
    }

    let offset = 44;
    for (let frame = 0; frame < frameCount; frame += 1) {
        for (let channel = 0; channel < channels; channel += 1) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][frame] || 0));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Uint8Array(output);
}

function writeString(view, offset, string) {
    for (let index = 0; index < string.length; index += 1) {
        view.setUint8(offset + index, string.charCodeAt(index));
    }
}

function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
