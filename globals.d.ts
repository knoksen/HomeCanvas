// Ambient declarations for Vite runtime replacements
// Vite replaces process.env.* at build time via define. Provide a minimal type to satisfy TS.
declare const process: { env: Record<string, string | undefined> };
