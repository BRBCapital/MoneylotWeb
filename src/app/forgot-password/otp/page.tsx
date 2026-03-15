import OtpClient from "./OtpClient";

export default async function ForgotPasswordOtpPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; sent?: string }>;
}) {
  const sp = (await searchParams) || {};
  const email = sp.email || "";
  const sent = sp.sent === "1";
  return <OtpClient email={email} sent={sent} />;
}

