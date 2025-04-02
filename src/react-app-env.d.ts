/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace React {
  interface ReactNode {
    // Add any missing React node types
  }
  
  interface FC<P = {}> {
    (props: P): ReactElement | null;
  }
  
  // React hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any>): T;
  export function useRef<T>(initialValue: T): { current: T };
  
  // Context
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  export interface Provider<T> {
    props: {
      value: T;
      children?: ReactNode;
    };
  }
  export interface Consumer<T> {
    props: {
      children: (value: T) => ReactNode;
    };
  }
}

declare module 'react/jsx-runtime' {
  export default any;
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-force-graph' {
  export const ForceGraph2D: any;
  export const ForceGraph3D: any;
  export const ForceGraphVR: any;
  export const ForceGraphAR: any;
} 