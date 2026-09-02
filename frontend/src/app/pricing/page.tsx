import { redirect } from "next/navigation";

/** Preserve legacy pricing links used by older campaigns and automated journeys. */
export default function PricingPage() {
  redirect("/plans");
}
