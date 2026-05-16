import { beforeEach, describe, expect, it } from "vitest";
import { clearSentEmails, getSentEmails, sceneReadyEmail, sendEmail } from "@/lib/email";

describe("email service", () => {
  beforeEach(() => clearSentEmails());

  it("records sends in mock mode and returns an id", async () => {
    const r = await sendEmail({ to: "a@x.test", subject: "Hi", html: "<p>Hi</p>" });
    expect(r.id).toMatch(/^mock_email_/);
    expect(getSentEmails()).toHaveLength(1);
    expect(getSentEmails()[0].to).toBe("a@x.test");
  });

  it("clearSentEmails wipes the queue", async () => {
    await sendEmail({ to: "b@x.test", subject: "x", html: "x" });
    expect(getSentEmails()).toHaveLength(1);
    clearSentEmails();
    expect(getSentEmails()).toHaveLength(0);
  });

  describe("sceneReadyEmail template", () => {
    const tmpl = sceneReadyEmail({
      to: "mom@x.test",
      title: "Grandma's kitchen",
      shareUrl: "https://livingphotos.app/s/abc",
    });

    it("addresses the right person", () => {
      expect(tmpl.to).toBe("mom@x.test");
    });

    it("subject includes the title", () => {
      expect(tmpl.subject).toContain("Grandma's kitchen");
    });

    it("body links to the share URL", () => {
      expect(tmpl.html).toContain("https://livingphotos.app/s/abc");
      expect(tmpl.html).toContain("Step inside →");
    });

    it("body is HTML, not plain text", () => {
      expect(tmpl.html).toContain("<");
    });
  });

  describe("title HTML injection", () => {
    it("escapes <script> tags in the HTML body", () => {
      const tmpl = sceneReadyEmail({
        to: "x@x.test",
        title: '<script>alert("xss")</script>',
        shareUrl: "https://livingphotos.app/s/a",
      });
      expect(tmpl.html).not.toContain("<script>");
      expect(tmpl.html).toContain("&lt;script&gt;");
    });

    it("strips angle brackets and CR/LF from the subject line", () => {
      const tmpl = sceneReadyEmail({
        to: "x@x.test",
        title: 'Hello <evil href="x">\r\nBcc: spam',
        shareUrl: "https://livingphotos.app/s/a",
      });
      expect(tmpl.subject).not.toContain("<");
      expect(tmpl.subject).not.toContain(">");
      expect(tmpl.subject).not.toContain("\r");
      expect(tmpl.subject).not.toContain("\n");
    });
  });
});
