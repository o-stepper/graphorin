/**
 * Public surface of the locale-pack module. The bundled English pack
 * (`enLocalePack`) is the default; additional locales are
 * community-supplied via {@link defineLocalePack}.
 *
 * @packageDocumentation
 */

export { enLocalePack } from './en.js';
export {
  defineLocalePack,
  evaluateMarkers,
  type LocaleMatch,
  type LocalePack,
  type LocalePatternEntry,
  type LocaleSupersedeKind,
} from './types.js';
