import * as React from "react";

export interface BaseEmailProps {
  children: React.ReactNode;
}

export function BaseEmail({ children }: BaseEmailProps) {
  return (
    <div style={{
      fontFamily: "'Inter', 'Arial', sans-serif",
      backgroundColor: "#F7F7F5",
      padding: "40px 20px",
      color: "#0A0A0A",
      margin: 0
    }}>
      <table role="presentation" width="100%" cellSpacing="0" cellPadding="0" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <tbody>
          <tr>
            <td style={{ padding: "0 0 20px 0", textAlign: "center" }}>
              <div style={{
                fontFamily: "Courier New, monospace",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "2px",
                color: "#111111",
                textTransform: "uppercase"
              }}>
                HISAKO  |  AI AGENCY
              </div>
            </td>
          </tr>
          <tr>
            <td style={{
              backgroundColor: "#FFFFFF",
              borderTop: "4px solid #E8400C",
              borderRadius: "8px",
              padding: "40px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
            }}>
              {children}
            </td>
          </tr>
          <tr>
            <td style={{
              padding: "30px 20px 0 20px",
              textAlign: "center",
              fontSize: "12px",
              color: "#888888",
              lineHeight: "1.5"
            }}>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>HISAKO AI AGENCY</strong> · Nairobi, Kenya
              </p>
              <p style={{ margin: 0 }}>
                <a href="mailto:hello@hisako.eu" style={{ color: "#E8400C", textDecoration: "none" }}>hello@hisako.eu</a> · <a href="https://hisako.eu" style={{ color: "#E8400C", textDecoration: "none" }}>hisako.eu</a>
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
