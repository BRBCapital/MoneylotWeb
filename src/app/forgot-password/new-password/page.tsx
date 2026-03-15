import NewPasswordClient from "./NewPasswordClient";

export default async function CreateNewPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const sp = (await searchParams) || {};
  const email = sp.email || "sonma@gmail.com";
  return <NewPasswordClient email={email} />;
}

