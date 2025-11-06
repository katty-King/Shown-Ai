export enum Sender {
  User = 'user',
  Model = 'model',
  Error = 'error',
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  image?: string; // base64 data URL for display
  video?: string; // object URL for display
}