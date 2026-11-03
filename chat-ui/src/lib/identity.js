const NAME_KEY = "reactive-chat:name";

export function getStoredName() {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

export function setStoredName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // private browsing / storage disabled -identity just won't persist
  }
}
