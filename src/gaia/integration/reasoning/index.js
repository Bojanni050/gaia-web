/**
 * Reasoning integration — the only place Gaia Web reaches reasoning.
 *
 * Returns a single, lazily-built provider. Today that is
 * GaiaCloudProvider (services/gaia-api) — tomorrow it could be swapped
 * without any caller knowing.
 */
import { GaiaCloudProvider } from './GaiaCloudProvider';
import { ReasoningProvider } from './ReasoningProvider';
import {
  ReasoningUnavailableError,
  ReasoningAbortedError,
} from './errors';

let _provider = null;

export function getReasoningProvider() {
  if (_provider) return _provider;
  _provider = createProvider();
  return _provider;
}

export function createProvider() {
  return new GaiaCloudProvider();
}

export function resetProvider() {
  _provider = null;
}

export {
  ReasoningProvider,
  GaiaCloudProvider,
  ReasoningUnavailableError,
  ReasoningAbortedError,
};
