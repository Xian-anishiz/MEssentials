import { MOCK_ACCOUNTS, type AccountType, type UserProfile } from '$mocks/user';

export function createAuthState() {
  let user = $state<UserProfile>(MOCK_ACCOUNTS.student);
  let isLoggedIn = $state<boolean>(false);

  return {
    get user() { return user; },
    get isLoggedIn() { return isLoggedIn; },
    get accountType() { return user.role; },
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
    loginAs(type: AccountType) {
      user = MOCK_ACCOUNTS[type];
      isLoggedIn = true;
    },
    logout() {
      isLoggedIn = false;
      user = MOCK_ACCOUNTS.student;
    },
    login() {
      isLoggedIn = true;
    }
  };
}

export const authState = createAuthState();
