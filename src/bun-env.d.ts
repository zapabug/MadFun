/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

// Add common environment variables
interface ImportMeta {
  env: {
    MODE: string;
    DEV: boolean;
    PROD: boolean;
    [key: string]: string | boolean | undefined;
  };
}

// Bun specific types
declare namespace Bun {
  interface Env {
    [key: string]: string | undefined;
  }
}

// Add window type extensions for Tailwind
interface Window {
  // Add any window properties used in the app
} 