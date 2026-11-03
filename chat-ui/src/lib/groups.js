export const DEFAULT_GROUPS = ["Java", "General", "Python", "C#"];

const LAST_GROUP_KEY = "reactive-chat:last-group";

export function getLastGroup() {
  try {
    return localStorage.getItem(LAST_GROUP_KEY);
  } catch {
    return null;
  }
}

export function setLastGroup(groupId) {
  try {
    localStorage.setItem(LAST_GROUP_KEY, groupId);
  } catch {
    // private browsing / storage disabled -last group just won't persist
  }
}
