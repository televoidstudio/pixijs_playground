import * as Tone from 'tone';
import { EventManager } from '../events/EventManager';

export class AudioEngine {
    private transport: ReturnType<typeof Tone.getTransport>;
    private synth: Tone.PolySynth;
    private isInitialized: boolean = false;
    private midiNotes: Map<string, Tone.ToneEvent> = new Map();

    constructor() {
        this.transport = Tone.getTransport();
        this.transport.bpm.value = 120;
        this.synth = new Tone.PolySynth().toDestination();
    }

    async init() {
        if (this.isInitialized) return;
        await Tone.start();
        this.isInitialized = true;
        
        // 設置事件監聽
        this.setupEvents();
    }

    private setupEvents(): void {
        const eventManager = EventManager.getInstance();
        
        eventManager.on('daw:midi:note:added', ({ note }) => {
            this.scheduleNote(note);
        });
        
        eventManager.on('daw:midi:note:removed', ({ note }) => {
            this.removeNote(note);
        });
        
        eventManager.on('daw:midi:note:moved', ({ note }) => {
            this.removeNote(note);
            this.scheduleNote(note);
        });
        
        eventManager.on('daw:midi:note:resized', ({ note }) => {
            this.removeNote(note);
            this.scheduleNote(note);
        });
        
        eventManager.on('daw:audio:preview', ({ note }) => {
            this.previewNote(note);
        });
    }

    private scheduleNote(note: { pitch: number; time: number; duration: number; velocity: number }): void {
        const noteId = `${note.pitch}-${note.time}`;
        const noteName = this.getMidiNoteName(note.pitch);
        const startTime = `${note.time}*4n`;
        const duration = `${note.duration}*4n`;
        const velocity = note.velocity / 127;

        const event = new Tone.ToneEvent((time) => {
            this.synth.triggerAttackRelease(noteName, duration, time, velocity);
        }, {});

        event.start(startTime);
        this.midiNotes.set(noteId, event);
    }

    private removeNote(note: { pitch: number; time: number }): void {
        const noteId = `${note.pitch}-${note.time}`;
        const event = this.midiNotes.get(noteId);
        if (event) {
            event.dispose();
            this.midiNotes.delete(noteId);
        }
    }

    private previewNote(noteName: string): void {
        this.synth.triggerAttackRelease(noteName, '8n');
    }

    private getMidiNoteName(midiNumber: number): string {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const noteName = noteNames[midiNumber % 12];
        return `${noteName}${octave}`;
    }

    play() {
        this.transport.start();
    }

    pause() {
        this.transport.pause();
    }

    stop() {
        this.transport.stop();
    }

    setBPM(bpm: number) {
        this.transport.bpm.value = bpm;
    }

    getCurrentTime(): number {
        return this.transport.seconds;
    }

    setPosition(time: number) {
        this.transport.seconds = time;
    }

    // 測試音頻功能
    playTestNote(note: string = 'C4', duration: string = '8n') {
        this.synth.triggerAttackRelease(note, duration);
    }

    playChord(notes: string[] = ['C4', 'E4', 'G4'], duration: string = '4n') {
        this.synth.triggerAttackRelease(notes, duration);
    }

    playScale() {
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        let time = 0;
        
        notes.forEach((note, i) => {
            this.transport.schedule((time) => {
                this.synth.triggerAttackRelease(note, '8n');
            }, `+${i * 0.25}`);
        });
    }

    destroy() {
        this.transport.stop();
        this.transport.cancel();
        this.midiNotes.forEach(event => event.dispose());
        this.midiNotes.clear();
        this.synth.dispose();
        Tone.getContext().dispose();
    }
} 