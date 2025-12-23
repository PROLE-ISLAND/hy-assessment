// =====================================================
// Assessment Completion Email Template
// Sent to admins when a candidate completes an assessment
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

interface AssessmentCompletionProps {
  adminName?: string;
  candidateName: string;
  candidateEmail: string;
  completedAt: string;
  detailUrl: string;
  analysisStatus: 'pending' | 'completed' | 'failed';
}

export function AssessmentCompletionEmail({
  adminName = '管理者',
  candidateName,
  candidateEmail,
  completedAt,
  detailUrl,
  analysisStatus,
}: AssessmentCompletionProps) {
  const statusText = {
    pending: 'AI分析中',
    completed: '分析完了',
    failed: '分析エラー',
  }[analysisStatus];

  const statusColor = {
    pending: '#f59e0b',
    completed: '#10b981',
    failed: '#ef4444',
  }[analysisStatus];

  return (
    <Html>
      <Head />
      <Preview>適性検査が完了しました - {candidateName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.title}>検査完了通知</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>
              {adminName} 様
            </Text>

            <Text style={styles.paragraph}>
              候補者の適性検査が完了しましたのでお知らせいたします。
            </Text>

            <Section style={styles.infoBox}>
              <Text style={styles.infoLabel}>候補者名</Text>
              <Text style={styles.infoValue}>{candidateName}</Text>

              <Text style={styles.infoLabel}>メールアドレス</Text>
              <Text style={styles.infoValue}>{candidateEmail}</Text>

              <Text style={styles.infoLabel}>完了日時</Text>
              <Text style={styles.infoValue}>{completedAt}</Text>

              <Text style={styles.infoLabel}>分析ステータス</Text>
              <Text style={{ ...styles.infoValue, color: statusColor }}>
                {statusText}
              </Text>
            </Section>

            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={detailUrl}>
                検査結果を確認する
              </Button>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              このメールは検査完了時に自動送信されています。
            </Text>
          </Section>

          <Section style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              HY Assessment System
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
    marginBottom: '24px',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '500' as const,
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
  hr: {
    borderColor: '#e6e6e6',
    margin: '32px 0',
  },
  footer: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center' as const,
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

export default AssessmentCompletionEmail;
