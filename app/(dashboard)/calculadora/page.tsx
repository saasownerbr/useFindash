import { redirect } from "next/navigation";

// The calculator now lives in Inputs; keep old links and bookmarks working.
export default function CalculadoraPage() {
  redirect("/inputs?tab=calculadora");
}
