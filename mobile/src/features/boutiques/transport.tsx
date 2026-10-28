import { createContext, useContext } from 'react';
import { boutiqueRequest } from './api';
export const BoutiqueNativeTransport = createContext({ api: boutiqueRequest, example: false });
export function useBoutiqueNativeTransport() { return useContext(BoutiqueNativeTransport); }
