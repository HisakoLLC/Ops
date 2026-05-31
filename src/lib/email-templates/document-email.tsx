import * as React from "react";
import { BaseEmail } from "./base";

export interface DocumentEmailProps {
  clientName: string;
  docLabel: string;
  downloadUrl: string;
}

export function DocumentEmail({ clientName, docLabel, downloadUrl }: DocumentEmailProps) {
  return (
    <BaseEmail>
      <h2 style={{
        fontSize: "20px",
        fontWeight: "bold",
        color: "#0A0A0A",
        margin: "0 0 16px 0",
        fontFamily: "Arial, sans-serif"
      }}>
        Hi {clientName},
      </h2>
      <p style={{
        fontSize: "15px",
        lineHeight: "1.6",
        color: "#444444",
        margin: "0 0 24px 0",
        fontFamily: "Arial, sans-serif"
      }}>
        Your generated document <strong style={{ color: "#0A0A0A" }}>{docLabel}</strong> is ready. You can download and review it directly by clicking the button below:
      </p>
      
      <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style={{ margin: "30px 0" }}>
        <tbody>
          <tr>
            <td align="center">
              <a href={downloadUrl} target="_blank" rel="noreferrer" style={{
                backgroundColor: "#E8400C",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: "bold",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "6px",
                display: "inline-block",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontFamily: "Courier New, monospace"
              }}>
                Download Document
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      
      <p style={{
        fontSize: "14px",
        lineHeight: "1.6",
        color: "#666666",
        margin: "24px 0 24px 0",
        fontFamily: "Arial, sans-serif"
      }}>
        If you have any questions or require revisions, feel free to reply directly to this email.
      </p>
      
      <p style={{
        fontSize: "15px",
        lineHeight: "1.6",
        color: "#444444",
        margin: "30px 0 0 0",
        fontFamily: "Arial, sans-serif"
      }}>
        Best regards,<br />
        <strong style={{ color: "#0A0A0A" }}>The Hisako Team</strong>
      </p>
    </BaseEmail>
  );
}
