// Minimal preload for future APIs; isolated world for safety
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('homecanvas', {
  version: '0.1.0'
});
