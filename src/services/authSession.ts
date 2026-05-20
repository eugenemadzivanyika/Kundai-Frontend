import { tokenStore } from './tokenStore';

export const getActiveAuthToken = (): string | null => tokenStore.get();

export default getActiveAuthToken;
