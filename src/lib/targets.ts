export interface CommonTarget {
  id: string;
  name: string;
  description: string;
}

export const COMMON_TARGETS: CommonTarget[] = [
  {
    id: "target-ad-dc",
    name: "Active Directory Domain Controller",
    description: "The primary authentication and authorization server for the Windows domain environment. Compromise results in total administrative control of the network."
  },
  {
    id: "target-admin-accts",
    name: "Privileged / Administrator Accounts",
    description: "Accounts with elevated access privileges (e.g., Domain Admins, Global Admins, root). Highly prized for lateral movement and maintaining persistence."
  },
  {
    id: "target-db-server",
    name: "Customer Database Server",
    description: "Backend database servers containing sensitive customer information, credit card data, or PII. Primary target for data exfiltration and extortion."
  },
  {
    id: "target-code-repo",
    name: "Source Code Repository",
    description: "Version control systems (e.g., GitHub, GitLab, Bitbucket) containing proprietary source code, hardcoded credentials, or signing keys."
  },
  {
    id: "target-cred-store",
    name: "Credential Store / Password Manager",
    description: "Enterprise password managers or secrets vaults (e.g., CyberArk, HashiCorp Vault, 1Password). Compromise grants access to myriad downstream systems."
  },
  {
    id: "target-intellectual-property",
    name: "Intellectual Property (IP)",
    description: "Proprietary research, trade secrets, manufacturing blueprints, or sensitive algorithms stored on file shares or collaboration platforms."
  },
  {
    id: "target-pii-phi",
    name: "PII / PHI Records",
    description: "Personally Identifiable Information (PII) or Protected Health Information (PHI) subject to strict regulatory compliance (e.g., HIPAA, GDPR)."
  },
  {
    id: "target-crypto-wallet",
    name: "Cryptocurrency Wallets",
    description: "Cold or hot wallets holding cryptocurrency. Direct financial targets for immediate theft and monetization."
  },
  {
    id: "target-backup-server",
    name: "Backup Servers / Storage",
    description: "Servers housing critical business backups. Ransomware operators target these first to destroy recovery capabilities before encrypting production systems."
  },
  {
    id: "target-exec-comm",
    name: "Executive Communications",
    description: "Email inboxes or messaging accounts of C-suite executives. Targeted for insider trading information, BEC (Business Email Compromise), or espionage."
  },
  {
    id: "target-payment-gateway",
    name: "Payment Gateway / POS Systems",
    description: "Point of Sale (POS) systems or payment gateways. Targeted to skim credit card data or siphon funds during transactions."
  },
  {
    id: "target-cicd-pipeline",
    name: "CI/CD Pipeline",
    description: "Continuous Integration / Continuous Deployment servers (e.g., Jenkins, GitHub Actions). Targeted to inject malicious code into software updates (Supply Chain Attack)."
  },
  {
    id: "target-cloud-idp",
    name: "Cloud Identity Provider (IdP) / SSO",
    description: "Single Sign-On solutions (e.g., Okta, Entra ID, Ping). Centralized authentication hubs. Golden SAML or session token theft here compromises the entire cloud ecosystem."
  },
  {
    id: "target-ics-scada",
    name: "ICS / SCADA Infrastructure",
    description: "Industrial Control Systems managing physical processes (e.g., power, water, manufacturing). Targeted by nation-states to cause physical disruption or destruction."
  },
  {
    id: "target-erp-system",
    name: "ERP System",
    description: "Enterprise Resource Planning systems (e.g., SAP, Oracle). The backbone of enterprise operations, containing financial data, HR records, and supply chain logistics."
  },
  {
    id: "target-crm-system",
    name: "CRM Database",
    description: "Customer Relationship Management software (e.g., Salesforce). Contains massive lists of customer contacts, sales pipelines, and support tickets. High risk for data extortion."
  },
  {
    id: "target-network-core",
    name: "Core Network Infrastructure",
    description: "Core routers, switches, or firewalls. Targeted to intercept traffic, create hidden VPN tunnels, or cause widespread denial of service."
  },
  {
    id: "target-pki-certs",
    name: "Code Signing Certificates / PKI",
    description: "Private keys used to sign software or SSL certificates. Stolen keys allow attackers to sign their own malware so it bypasses OS trust controls."
  },
  {
    id: "target-voip-pbx",
    name: "VoIP / PBX Systems",
    description: "Enterprise telephony servers. Targeted for eavesdropping on executive calls, telecom fraud, or harassment."
  },
  {
    id: "target-physical-security",
    name: "Physical Security Controllers",
    description: "Servers managing badge access, CCTV, and physical locks. Compromised to facilitate or cover up physical break-ins."
  }
];

export async function searchTargets(query: string): Promise<CommonTarget[]> {
  const q = query.toLowerCase();
  return COMMON_TARGETS.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.description.toLowerCase().includes(q)
  );
}
