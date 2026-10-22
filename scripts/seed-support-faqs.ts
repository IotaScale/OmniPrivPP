import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialFaqs = [
  {
    question: 'How does the 39-feature behavioral engine detect session anomalies?',
    answer: 'OmniPriv monitors 39 real-time behavioral features during every interactive session, including keystroke dynamics, command cadence, execution deviation, and uncharacteristic privilege calls. If an anomaly score crosses the alert threshold, a 10-second grace sweep initiates before automated isolation.',
    category: 'AI-PAM Engine & Behavioral Scoring',
    tags: ['ai-pam', 'behavioral', 'anomaly-detection', '39-features', 'auto-block'],
    order_index: 1,
  },
  {
    question: 'What happens when an active session triggers the 10-second auto-block sweep?',
    answer: 'The session enters a 10-second verification state. If no operator override or step-up authentication is received within 10 seconds, the proxy gateway immediately terminates the socket, invalidates ephemeral session tokens, and logs a tamper-evident HMAC-SHA256 audit record.',
    category: 'AI-PAM Engine & Behavioral Scoring',
    tags: ['auto-block', 'grace-period', 'session-kill', 'audit'],
    order_index: 2,
  },
  {
    question: 'How does OmniPriv secure Model Context Protocol (MCP) tool execution?',
    answer: 'OmniPriv inspects and policy-gates 53 distinct MCP tool actions before execution. It defends against prompt injection, indirect tool poisoning, and unauthorized filesystem/database mutations by AI agents like Claude, OpenAI, and custom LLM runtimes.',
    category: 'AI Agent Governance & MCP Controls',
    tags: ['mcp', 'ai-agents', 'prompt-injection', 'tool-governance', '53-tools'],
    order_index: 3,
  },
  {
    question: 'Can I restrict AI agent access to specific subnets or credentials?',
    answer: 'Yes. MCP agents are assigned isolated identity profiles with scoped, just-in-time credentials that expire immediately upon tool completion, ensuring AI agents never possess persistent administrative credentials.',
    category: 'AI Agent Governance & MCP Controls',
    tags: ['mcp', 'just-in-time', 'scoped-access', 'ephemeral-credentials'],
    order_index: 4,
  },
  {
    question: 'How does the 3-level key encryption hierarchy (KEK / DEK / SEK) work?',
    answer: 'OmniPriv utilizes a root Key Encryption Key (KEK) stored in an HSM or cloud KMS, which wraps tenant-specific Data Encryption Keys (DEKs). Each individual secret (passwords, SSH keys, API tokens) is encrypted with its own unique Secret Encryption Key (SEK) wrapped by the DEK with automated rotation.',
    category: 'Vault Architecture & Key Encryption',
    tags: ['vault', 'encryption', 'kek', 'dek', 'sek', 'hsm'],
    order_index: 5,
  },
  {
    question: 'Does OmniPriv require client VPNs for SSH or RDP sessions?',
    answer: 'No. OmniPriv provides a clientless, browser-based and desktop-native proxy gateway that tunnels TLS 1.3 connections directly into target Linux and Windows endpoints without opening inbound firewall ports or requiring a VPN.',
    category: 'Secure Remote Access & Proxy Gateway',
    tags: ['remote-access', 'vpn-free', 'rdp', 'ssh', 'proxy-gateway'],
    order_index: 6,
  },
  {
    question: 'How long does deal protection last once approved by Channel Operations?',
    answer: 'Approved deal registrations receive guaranteed 90 days of exclusive deal protection and margin lock. If procurement extends past 90 days, you can request an extension through your assigned Partner Manager.',
    category: 'Partner Program & Deal Protection',
    tags: ['deal-registration', 'protection-window', '90-days', 'partner-program'],
    order_index: 7,
  },
  {
    question: 'What causes a "Conflict Detected" status on a deal submission?',
    answer: 'A conflict occurs when the normalized customer domain has already been registered or actively protected by another partner. OmniPriv routes the case to Channel Admin arbitration while keeping both partners\' identities confidential.',
    category: 'Partner Program & Deal Protection',
    tags: ['deal-conflict', 'domain-conflict', 'arbitration', 'channel-admin'],
    order_index: 8,
  },
  {
    question: 'How do I request an internal NFR lab license or Customer PoC?',
    answer: 'Navigate to Commercial Requests in the Partner Portal, select "NFR / Internal Lab License" or "Proof of Concept", specify estimated nodes and duration, and submit for instant Channel review.',
    category: 'Licensing, NFR & Commercial Requests',
    tags: ['nfr-license', 'poc', 'trial', 'commercial-request'],
    order_index: 9,
  },
];

async function main() {
  console.log('[FAQ-SEED] Seeding OmniPriv Support FAQs...');
  for (const faq of initialFaqs) {
    const existing = await prisma.supportFaq.findFirst({
      where: { question: faq.question },
    });
    if (!existing) {
      await prisma.supportFaq.create({
        data: faq,
      });
      console.log(`[FAQ-SEED] Created: ${faq.question}`);
    } else {
      console.log(`[FAQ-SEED] Exists: ${faq.question}`);
    }
  }
  console.log('[FAQ-SEED] Completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
