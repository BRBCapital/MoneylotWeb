import { redirect } from "next/navigation";

export default function Home() {
  // Entry to the app is login (primary).
  // The redirect entry used by another website is available at `/entry`.
  redirect("/login");
}
