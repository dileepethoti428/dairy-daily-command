import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
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
            <FileText className="h-5 w-5 text-primary" />
            Terms & Conditions
          </h1>
        </div>

        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="text-lg">Zaago Milk Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4 text-foreground">
            <section>
              <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By using Zaago Milk application, you agree to be bound by these Terms and Conditions. 
                If you do not agree, please do not use the application.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">2. Description of Service</h3>
              <p className="text-muted-foreground">
                Zaago Milk provides a milk procurement management system that allows users to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>Manage farmer records and information</li>
                <li>Record daily milk collection entries</li>
                <li>Generate collection reports and settlements</li>
                <li>Manage collection centers</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">3. User Responsibilities</h3>
              <p className="text-muted-foreground">
                As a user, you agree to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not share your login credentials with others</li>
                <li>Report any unauthorized access immediately</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">4. Data Accuracy</h3>
              <p className="text-muted-foreground">
                You are responsible for ensuring the accuracy of all data entered into the system, 
                including farmer details, milk quantities, and financial information.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">5. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                Zaago Milk shall not be liable for any indirect, incidental, or consequential damages 
                arising from the use of this service. The service is provided "as is" without warranties 
                of any kind.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">6. Service Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue any part of the service 
                at any time without prior notice.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">7. Termination</h3>
              <p className="text-muted-foreground">
                We may terminate or suspend your access to the service immediately, without prior 
                notice, for conduct that we believe violates these Terms or is harmful to other users.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">8. Governing Law</h3>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of India.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">9. Contact Information</h3>
              <p className="text-muted-foreground">
                For any questions about these Terms, contact us at:
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
