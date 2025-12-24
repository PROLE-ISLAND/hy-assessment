// =====================================================
// Report Link Email Template
// Sent when a candidate requests their report link
// =====================================================

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components';

interface ReportLinkEmailProps {
  candidateName: string;
  reportUrl: string;
  expiresAt: string;
}

export function ReportLinkEmail({
  candidateName,
  reportUrl,
  expiresAt,
}: ReportLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>適性検査レポートのご案内</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.title}>適性検査レポート</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>
              {candidateName} 様
            </Text>

            <Text style={styles.paragraph}>
              適性検査レポートの閲覧リンクをお送りします。
            </Text>

            <Text style={styles.paragraph}>
              下記のボタンからレポートをご確認いただけます。
            </Text>

            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={reportUrl}>
                レポートを見る
              </Button>
            </Section>

            <Text style={styles.note}>
              ※ このリンクはあなた専用です。他の方と共有しないでください。
            </Text>
            <Text style={styles.warning}>
              ※ 有効期限: {expiresAt}
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              ご不明な点がございましたら、採用担当までお問い合わせください。
            </Text>
          </Section>

          <Section style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              このメールは自動送信されています。
              心当たりのない場合は、このメールを破棄してください。
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '20px 0 48px',
    maxWidth: '600px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  header: {
    padding: '20px 40px',
    borderBottom: '1px solid #e6e6e6',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600' as const,
    color: '#1a1a1a',
    margin: '0',
  },
  content: {
    padding: '32px 40px',
  },
  greeting: {
    fontSize: '16px',
    color: '#1a1a1a',
    marginBottom: '24px',
  },
  paragraph: {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#4a4a4a',
    marginBottom: '16px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '12px 32px',
  },
  note: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  warning: {
    fontSize: '13px',
    color: '#dc2626',
    fontWeight: '500' as const,
    marginTop: '16px',
  },
  hr: {
    borderColor: '#e6e6e6',
    margin: '32px 0',
  },
  footer: {
    fontSize: '14px',
    color: '#4a4a4a',
  },
  disclaimer: {
    padding: '0 40px',
  },
  disclaimerText: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
} as const;

export default ReportLinkEmail;
