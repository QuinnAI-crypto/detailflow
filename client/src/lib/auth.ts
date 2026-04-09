// Module-level auth state — NO localStorage (blocked in sandbox iframe)
let _token: string | null = null;
let _user: any = null;
let _listeners: Array<() => void> = [];

export const auth = {
  getToken: () => _token,
  getUser: () => _user,
  setSession: (token: string, user: any) => {
    _token = token;
    _user = user;
    _listeners.forEach((fn) => fn());
  },
  clearSession: () => {
    _token = null;
    _user = null;
    _listeners.forEach((fn) => fn());
  },
  isAuthenticated: () => !!_token,
  subscribe: (fn: () => void) => {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  },
  updateUser: (user: any) => {
    _user = user;
    _listeners.forEach((fn) => fn());
  },
};
