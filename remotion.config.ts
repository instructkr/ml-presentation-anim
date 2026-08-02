import path from 'node:path';
import { Config } from '@remotion/cli/config';

// 'angle' is required for WebGL (ThreeCanvas) scenes in headless renders on macOS.
Config.setChromiumOpenGlRenderer('angle');
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
}));
