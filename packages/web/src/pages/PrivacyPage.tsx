import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const PrivacyPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>

          <h3 className="text-lg font-semibold">1. Data Processing</h3>
          <p>We process shift scheduling and time tracking data on a contractual basis (Art 6(1)(b) UK GDPR) to fulfill employment obligations.</p>

          <h3 className="text-lg font-semibold">2. Data Retention</h3>
          <p>We retain timesheet and shift data for <strong>2 years</strong> post-employment to comply with UK employment laws. After this period, personal identifiers are anonymized.</p>

          <h3 className="text-lg font-semibold">3. Your Rights</h3>
          <p>You have the right to request access to your data or request erasure (Right to be Forgotten). You can exercise these rights via the Data Subject Request (DSR) endpoints or by contacting us.</p>

          <h3 className="text-lg font-semibold">4. Data Security</h3>
          <p>We implement appropriate technical measures to secure your data, including encryption in transit and at rest where applicable. In the event of a data breach, we will notify the ICO and affected individuals within 72 hours.</p>

          <h3 className="text-lg font-semibold">5. Contact</h3>
          <p>For privacy inquiries, please contact: <strong>client@workforce.com</strong></p>
        </CardContent>
      </Card>
    </div>
  );
};
