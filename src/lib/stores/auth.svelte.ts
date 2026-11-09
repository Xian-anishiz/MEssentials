import { MOCK_USER, type UserProfile } from '$mocks/user';

export function createAuthState() {
  let user = $state<UserProfile>(MOCK_USER);
  let isLoggedIn = $state<boolean>(true);

  return {
    get user() { return user; },
    get isLoggedIn() { return isLoggedIn; },
    updateProfile(updated: Partial<UserProfile>) {
      user = { ...user, ...updated };
    },
    linkRfid(masked: string) {
      user = { ...user, rfidCardLinked: true, rfidCardMasked: masked };
    },
    revokeRfid() {
      user = { ...user, rfidCardLinked: false, rfidCardMasked: '' };
    },
    togglePush(enabled: boolean) {
      user = { ...user, pushEnabled: enabled };
    },
    logout() {
      isLoggedIn = false;
    },
    login() {
      isLoggedIn = true;
    }
  };
}

export const authState = createAuthState();
