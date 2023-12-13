export interface OnShutdown {
  onShutdown(signal: number): Promise<void>;
}