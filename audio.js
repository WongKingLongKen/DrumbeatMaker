(() => {
    async function ensureAudio(state) {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (state.audioContext.state === 'suspended') {
            await state.audioContext.resume();
        }
    }

    function triggerSound(context, id, velocity, time) {
        const gain = Math.max(0.05, Math.min(1, velocity));

        switch (id) {
            case 'kick':
                playKick(context, time, gain);
                break;
            case 'snare':
                playSnare(context, time, gain);
                break;
            case 'hat':
                playHat(context, time, gain, false);
                break;
            case 'openHat':
                playHat(context, time, gain, true);
                break;
            case 'rim':
                playRim(context, time, gain);
                break;
            case 'clap':
                playClap(context, time, gain);
                break;
            case 'tomLow':
                playTom(context, time, gain, 110);
                break;
            case 'tomHigh':
                playTom(context, time, gain, 180);
                break;
            case 'ghost':
                playGhost(context, time, gain);
                break;
            case 'shaker':
                playShaker(context, time, gain);
                break;
            case 'bell':
                playBell(context, time, gain);
                break;
            case 'crash':
                playCrash(context, time, gain);
                break;
            case 'sub':
                playSub(context, time, gain);
                break;
            case 'wood':
                playWood(context, time, gain);
                break;
            case 'ride':
                playRide(context, time, gain);
                break;
            case 'fx':
                playFx(context, time, gain);
                break;
            default:
                break;
        }
    }

    function playKick(context, time, velocity) {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(48, time + 0.18);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.92 * velocity, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        filter.type = 'lowpass';
        filter.frequency.value = 420;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.28);
    }

    function playSnare(context, time, velocity) {
        const noise = createNoiseBuffer(context, 0.22);
        const source = context.createBufferSource();
        source.buffer = noise;

        const noiseFilter = context.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1800;
        noiseFilter.Q.value = 0.75;

        const tone = context.createOscillator();
        tone.type = 'triangle';
        tone.frequency.value = 200;

        const noiseGain = context.createGain();
        const toneGain = context.createGain();
        noiseGain.gain.setValueAtTime(0.001, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.8 * velocity, time + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        toneGain.gain.setValueAtTime(0.001, time);
        toneGain.gain.exponentialRampToValueAtTime(0.28 * velocity, time + 0.01);
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        source.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        tone.connect(toneGain);
        noiseGain.connect(context.destination);
        toneGain.connect(context.destination);
        source.start(time);
        source.stop(time + 0.22);
        tone.start(time);
        tone.stop(time + 0.14);
    }

    function playHat(context, time, velocity, open = false) {
        const noise = createNoiseBuffer(context, open ? 0.35 : 0.12);
        const source = context.createBufferSource();
        source.buffer = noise;

        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = open ? 5600 : 7600;

        const gain = context.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime((open ? 0.46 : 0.26) * velocity, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.18 : 0.08));

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start(time);
        source.stop(time + (open ? 0.3 : 0.12));
    }

    function playRim(context, time, velocity) {
        playClick(context, time, velocity * 0.75, 2400, 1600, 0.03);
    }

    function playClap(context, time, velocity) {
        const noise = createNoiseBuffer(context, 0.25);
        const source = context.createBufferSource();
        source.buffer = noise;

        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2200;

        const gain = context.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.58 * velocity, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start(time);
        source.stop(time + 0.25);
    }

    function playTom(context, time, velocity, frequency) {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.72, time + 0.16);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.5 * velocity, time + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.25);
    }

    function playGhost(context, time, velocity) {
        playClick(context, time, velocity * 0.45, 1500, 900, 0.02);
    }

    function playShaker(context, time, velocity) {
        const noise = createNoiseBuffer(context, 0.09);
        const source = context.createBufferSource();
        source.buffer = noise;

        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 9000;

        const gain = context.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.18 * velocity, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start(time);
        source.stop(time + 0.09);
    }

    function playBell(context, time, velocity) {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, time);
        osc.frequency.exponentialRampToValueAtTime(1320, time + 0.01);
        osc.frequency.exponentialRampToValueAtTime(660, time + 0.16);

        filter.type = 'bandpass';
        filter.frequency.value = 1600;
        filter.Q.value = 3;

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.28 * velocity, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.32);
    }

    function playCrash(context, time, velocity) {
        const noise = createNoiseBuffer(context, 0.8);
        const source = context.createBufferSource();
        source.buffer = noise;

        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4800;

        const gain = context.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.38 * velocity, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.75);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start(time);
        source.stop(time + 0.8);
    }

    function playSub(context, time, velocity) {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(58, time);
        osc.frequency.exponentialRampToValueAtTime(34, time + 0.22);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.5 * velocity, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.28);
    }

    function playWood(context, time, velocity) {
        playClick(context, time, velocity * 0.6, 3200, 2200, 0.03);
    }

    function playRide(context, time, velocity) {
        playHat(context, time, velocity * 0.85, true);
    }

    function playFx(context, time, velocity) {
        const noise = createNoiseBuffer(context, 0.5);
        const source = context.createBufferSource();
        source.buffer = noise;

        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1300;
        filter.Q.value = 0.5;

        const gain = context.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.22 * velocity, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start(time);
        source.stop(time + 0.48);
    }

    function playClick(context, time, velocity, frequencyA = 2200, frequencyB = 1400, release = 0.05) {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(frequencyA, time);
        osc.frequency.exponentialRampToValueAtTime(frequencyB, time + 0.01);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.14 * velocity, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, time + release);

        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + release + 0.02);
    }

    function createNoiseBuffer(context, duration) {
        const sampleRate = context.sampleRate;
        const buffer = context.createBuffer(1, Math.max(1, Math.floor(sampleRate * duration)), sampleRate);
        const channel = buffer.getChannelData(0);

        for (let index = 0; index < channel.length; index += 1) {
            channel[index] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    window.DrumbeatAudio = {
        ensureAudio,
        triggerSound,
    };
})();