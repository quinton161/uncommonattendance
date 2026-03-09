/// <reference types="react-scripts" />

declare module 'simple-peer' {
  export interface Options {
    initiator?: boolean;
    trickle?: boolean;
    stream?: MediaStream;
    config?: RTCConfiguration;
  }

  export interface Instance {
    on(event: 'signal', cb: (data: any) => void): void;
    on(event: 'stream', cb: (stream: MediaStream) => void): void;
    on(event: 'connect', cb: () => void): void;
    on(event: 'close', cb: () => void): void;
    on(event: 'error', cb: (err: any) => void): void;
    signal(data: any): void;
    destroy(): void;
  }

  export default class SimplePeer {
    constructor(opts?: Options);
    on(event: 'signal', cb: (data: any) => void): void;
    on(event: 'stream', cb: (stream: MediaStream) => void): void;
    on(event: 'connect', cb: () => void): void;
    on(event: 'close', cb: () => void): void;
    on(event: 'error', cb: (err: any) => void): void;
    signal(data: any): void;
    destroy(): void;
  }
}
