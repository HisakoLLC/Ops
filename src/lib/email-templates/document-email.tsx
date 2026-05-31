import * as React from "react";
import { BaseEmail } from "./base";

export interface DocumentEmailProps {
  clientName: string;
  docLabel: string;
  downloadUrl: string;
  pipelineStage?: string;
}

export function DocumentEmail({ clientName, docLabel, downloadUrl, pipelineStage }: DocumentEmailProps) {
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
        Our team at Hisako has prepared the document <strong style={{ color: "#0A0A0A" }}>{docLabel}</strong> for your review. You can download and access it directly by clicking the button below:
      </p>

      {pipelineStage && (
        <div style={{
          backgroundColor: "#FDF1EE",
          borderLeft: "4px solid #E8400C",
          padding: "16px",
          borderRadius: "0 6px 6px 0",
          margin: "24px 0"
        }}>
          <p style={{ margin: 0, fontSize: "14px", fontFamily: "Arial, sans-serif", color: "#0A0A0A" }}>
            <strong>Project Status Update:</strong> Our engagement is currently in the <strong style={{ textTransform: "uppercase", fontSize: "12px", fontFamily: "Courier New, monospace", backgroundColor: "#E8400C", color: "#FFFFFF", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>{pipelineStage}</strong> stage.
          </p>
        </div>
      )}
      
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
