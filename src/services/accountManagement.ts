import { apiGetJson } from "@/lib/apiClient";

export type GetPersonalDetailResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export type PersonalDetailDto = Partial<{
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
  bvn: string;
  nin: string;
}>;

export async function getPersonalDetail(signal?: AbortSignal) {
  return await apiGetJson<GetPersonalDetailResponse>(
    "/api/v1/accountmanagement/get-personal-detail",
    { signal }
  );
}

