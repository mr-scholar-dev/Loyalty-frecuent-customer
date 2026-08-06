import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoyaltyCard } from "@/components/loyalty-card/LoyaltyCard";
import { MembershipStatus } from "@/types/domain";
import type { CardView } from "@/lib/loyalty/card";

const card: CardView = {
  organization: {
    name: "Lavacar Demo",
    logoUrl: null,
    primaryColor: "#0f172a",
    secondaryColor: "#1d4ed8",
  },
  customerDisplayName: "María R••••••",
  licensePlate: "ABC123",
  status: MembershipStatus.Active,
  progress: {
    current: 3,
    required: 9,
    remaining: 6,
    availableRewards: 0,
    progressLabel: "3 de 9 lavados",
    remainingLabel: "Faltan 6 lavados",
  },
  cardUrl: "https://example.com/c/tok_abc123",
  lastActivityAt: null,
};

/**
 * Public card tests: the QR panel must also expose the raw token so it can be
 * copied and pasted into the scan console when scanning isn't possible.
 */
describe("LoyaltyCard token copy", () => {
  it("shows the token extracted from the card URL", () => {
    render(<LoyaltyCard card={card} qrSvg="<svg />" qrPngDataUrl="data:," />);
    expect(screen.getByText("tok_abc123")).toBeInTheDocument();
  });

  it("copies the token to the clipboard and confirms", async () => {
    const user = userEvent.setup();
    render(<LoyaltyCard card={card} qrSvg="<svg />" qrPngDataUrl="data:," />);

    await user.click(
      screen.getByRole("button", { name: "Copiar código de la tarjeta" }),
    );

    expect(await screen.findByText("Copiado")).toBeInTheDocument();
    expect(await window.navigator.clipboard.readText()).toBe("tok_abc123");
  });
});
