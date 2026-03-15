import { apiGetJson } from "@/lib/apiClient";

export type AccountTypeDto = { id: number; name: string };

export type AccountTypesResponse = {
  status: boolean;
  message: string;
  data: AccountTypeDto[];
};

export async function getAccountTypes(signal?: AbortSignal) {
  return await apiGetJson<AccountTypesResponse>("/api/v1/auth/account-types", {
    signal,
  });
}

