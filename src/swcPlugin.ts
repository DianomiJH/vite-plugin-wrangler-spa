import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { getViteConfig } from './utils';
import { transform as swcTransform } from '@swc/core';
import { writeFile } from 'node:fs';
import path from 'node:path';
import type { PluginOption, ResolvedConfig } from 'vite';

export const swcPlugin = (config: ResolvedCloudflareSpaConfig) => {
  const { allowedApiPaths, excludedApiPaths, swcConfig } = config;
  let _resolvedConfig: ResolvedConfig;
  return {
    name: 'vite-plugin-wrangler-spa:swc',
    apply: (_, { command, mode }) => command === 'build' && mode === 'page-function',
    config: () => getViteConfig(config),
    configResolved(resolvedConfig) {
      _resolvedConfig = resolvedConfig;
    },
    transform: (code) => swcTransform(code, swcConfig),
    writeBundle: async () => {
      const outDir = _resolvedConfig.build?.outDir ?? 'dist';
      return await writeFile(
        path.join(outDir, '_routes.json'),
        JSON.stringify(
          {
            version: 1,
            include: allowedApiPaths.map((x) => x.replace('^', '')),
            exclude: excludedApiPaths.map((x) => x.replace('^', '')),
          },
          null,
          2
        ),
        (err) => (err ? console.error(err.message) : null)
      );
    },
  } as PluginOption;
};
