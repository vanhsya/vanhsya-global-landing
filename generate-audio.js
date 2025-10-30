// Audio generation script using Web Audio API
import fs from 'fs';

class AudioGenerator {
  constructor() {
    this.sampleRate = 44100;
    this.duration = 10; // 10 seconds
    this.channels = 2; // Stereo
  }

  // Generate a simple melody with sine waves
  generateMelody() {
    const buffer = Buffer.alloc(this.sampleRate * this.duration * this.channels * 2);
    let offset = 0;

    // Define a simple melody in Hz
    const melody = [
      440, // A4
      493.88, // B4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      698.46, // F5
      783.99, // G5
      659.25, // E5
      587.33, // D5
      523.25, // C5
    ];

    const noteDuration = this.duration / melody.length;

    for (let i = 0; i < this.sampleRate * this.duration; i++) {
      const noteIndex = Math.floor((i / this.sampleRate) / noteDuration);
      const currentNote = melody[Math.min(noteIndex, melody.length - 1)];
      
      // Generate sine wave with fade in/out
      const t = i / this.sampleRate;
      const fadeIn = Math.min(1, t * 5); // 5 second fade in
      const fadeOut = Math.min(1, (this.duration - t) * 5); // 5 second fade out
      const envelope = Math.min(fadeIn, fadeOut);
      
      // Add some harmonics for richer sound
      const fundamental = Math.sin(2 * Math.PI * currentNote * t) * envelope * 0.3;
      const harmonic2 = Math.sin(2 * Math.PI * currentNote * 2 * t) * envelope * 0.1;
      const harmonic3 = Math.sin(2 * Math.PI * currentNote * 3 * t) * envelope * 0.05;
      
      const sample = fundamental + harmonic2 + harmonic3;
      
      // Convert to 16-bit PCM
      const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      
      // Write to stereo buffer (left and right channel)
      buffer.writeInt16LE(intSample, offset);
      buffer.writeInt16LE(intSample, offset + 2);
      offset += 4;
    }

    return buffer;
  }

  // Create WAV file (more compatible than generating MP3 directly)
  generateWavFile(filename) {
    console.log('Generating audio file...');
    
    const audioBuffer = this.generateMelody();
    
    // WAV header
    const header = Buffer.alloc(44);
    const dataLength = audioBuffer.length;
    
    // WAV header chunks
    header.write('RIFF', 0); // ChunkID
    header.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    header.write('WAVE', 8); // Format
    
    // fmt subchunk
    header.write('fmt ', 12); // Subchunk1ID
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    header.writeUInt16LE(this.channels, 22); // NumChannels
    header.writeUInt32LE(this.sampleRate, 24); // SampleRate
    header.writeUInt32LE(this.sampleRate * this.channels * 2, 28); // ByteRate
    header.writeUInt16LE(this.channels * 2, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample
    
    // data subchunk
    header.write('data', 36); // Subchunk2ID
    header.writeUInt32LE(dataLength, 40); // Subchunk2Size
    
    // Combine header and audio data
    const wavBuffer = Buffer.concat([header, audioBuffer]);
    
    // Write to file
    fs.writeFileSync(filename, wavBuffer);
    console.log(`Generated ${filename}`);
    
    return filename;
  }
}

// Create public directory if it doesn't exist
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

// Generate the audio file
const generator = new AudioGenerator();
const wavFile = generator.generateWavFile('./public/output_20250914223625_0.wav');

console.log('Audio file generation complete!');
console.log('Note: Generated as WAV format for maximum compatibility. The React app will serve it as an audio file.');