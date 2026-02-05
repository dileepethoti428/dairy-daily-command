import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            Privacy Policy
          </h1>
        </div>

        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="text-lg">Zaago Milk Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-foreground">
            <section>
              <h3 className="font-semibold text-foreground">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect information you provide directly, including:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>Account information (name, email, phone number)</li>
                <li>Farmer details (name, contact, village, bank information)</li>
                <li>Milk collection records and transactions</li>
                <li>Payment and settlement data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                Your information is used to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>Provide and maintain our milk procurement services</li>
                <li>Process milk entries and settlements</li>
                <li>Generate reports for your collection center</li>
                <li>Communicate important updates</li>
                <li>Improve our services</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">3. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information. 
                Data is stored securely and access is restricted to authorized personnel only.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">4. Data Sharing</h3>
              <p className="text-muted-foreground">
                We do not sell or share your personal information with third parties except:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>When required by law</li>
                <li>To protect our rights and safety</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">6. Contact Us</h3>
              <p className="text-muted-foreground">
                For any privacy-related questions, contact us at:
              </p>
              <ul className="list-none pl-0 text-muted-foreground">
                <li>Email: zaago.online@gmail.com</li>
                <li>Phone: +91-7842343642</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
