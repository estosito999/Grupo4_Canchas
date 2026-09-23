import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases (e.g. the ones added by `nest g library`) live in tsconfig.json,
// so they are read from there instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

/**
 * Jest + NestJS 12 ESM: @nestjs/testing (v12) es un paquete ESM-only
 * ("type": "module"). Jest en modo CommonJS no puede hacer require() de él.
 * Se habilita el modo ESM nativo de Node.js (--experimental-vm-modules) y
 * ts-jest con useESM para transformar los .ts de los tests a módulos ESM.
 */
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
    extensionsToTreatAsEsm: ['.ts'], // '.js' se infiere del campo "type" del package.json,
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
