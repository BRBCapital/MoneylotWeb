import { apiPostJson } from "@/lib/apiClient";

export type AccountCreationWebRequest = {
  firstName: string;
  lastName: string;
  accountType: string;
  phoneNumber: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
  otpType?: number;
};

export type AuthTokenData = {
  accountId: number;
  userId: number;
  firstName: string;
  lastName: string;
  refreshToken: string;
  expires: string;
  sessionToken: string;
  lastAccessed: string;
  attempts: number;
  refreshTokenExpiryTime: string;
  createdAt: string;
  updatedAt: string;
  enforcePassword: boolean;
  isNINVerified?: boolean;
  ninVerified?: boolean;
  /** Some APIs expose NIN state as a boolean flag instead of ninVerified */
  ninStatus?: boolean;
  bvnStatus?: boolean;
  kycStatus?: number;
  stage1?: boolean;
  stage1_5?: boolean;
  stage2?: boolean;
  stage3?: boolean;
  stage3_5?: boolean;
  stage4?: boolean;
  emailVerified?: boolean;
};

export type AuthTokenResponse = {
  status: boolean;
  message?: string | null;
  data?: AuthTokenData | null;
  statusCode?: number;
  error?: unknown;
};

export async function accountCreationWeb(payload: AccountCreationWebRequest) {
  return await apiPostJson<AuthTokenResponse>(
    "/api/v1/auth/account-creation-web",
    payload
  );
}

