// This type is used to pass the normalized mouse coordinates to the 3D canvas.
export interface MousePosition {
  x: number;
  y: number;
}

// FIX: Define and export types for LiveCommsOverlay component props to resolve import error.
export interface TranscriptionState {
  history: string[];
  user: string;
  model: string;
}

export interface LiveCommsOverlayProps {
  onClose: () => void;
  transcription: TranscriptionState;
  isConnecting: boolean;
}

export interface AIOracleProps {
    onClose: () => void;
}

// Global window extensions for AI Studio integration
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}
