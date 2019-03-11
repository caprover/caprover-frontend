const fallbackNoOps = {
  getItem(t: string) {
    return "";
  },
  setItem(t: string, v: string) {}
};
const localStorage = window.localStorage ? window.localStorage : fallbackNoOps;
const sessionStorage = window.sessionStorage
  ? window.sessionStorage
  : fallbackNoOps;

const AUTH_KEY = "CAPROVER_AUTH_KEY";

class StorageHelper {
  getAuthKeyFromStorage() {
    const localStorageAuth = localStorage.getItem(AUTH_KEY);
    return localStorageAuth
      ? localStorageAuth
      : sessionStorage.getItem(AUTH_KEY) || "";
  }

  clearAuthKeys() {
    localStorage.setItem(AUTH_KEY, "");
    sessionStorage.setItem(AUTH_KEY, "");
  }

  setAuthKeyInSessionStorage(authKey: string) {
    sessionStorage.setItem(AUTH_KEY, authKey);
    localStorage.setItem(AUTH_KEY, "");
  }

  setAuthKeyInLocalStorage(authKey: string) {
    localStorage.setItem(AUTH_KEY, authKey);
    sessionStorage.setItem(AUTH_KEY, "");
  }
}

const instance = new StorageHelper();
export default instance;
