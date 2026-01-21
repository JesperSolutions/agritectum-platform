import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className='inline-flex items-center text-slate-600 hover:text-slate-900 mb-8'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Tilbage
        </button>

        {/* Header */}
        <div className='bg-white rounded-xl shadow-sm p-8 mb-6'>
          <h1 className='text-3xl font-bold text-slate-900 mb-4'>Privatlivspolitik</h1>
          <p className='text-slate-600'>
            Sidst opdateret: {new Date().toLocaleDateString('da-DK')}
          </p>
        </div>

        {/* Content */}
        <div className='bg-white rounded-xl shadow-sm p-8 space-y-6'>
          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>1. Indledning</h2>
            <p className='text-slate-700 leading-relaxed'>
              Agritectum ApS ("vi", "os", "vores") respekterer dit privatliv og forpligter sig til
              at beskytte dine personoplysninger. Denne privatlivspolitik forklarer, hvordan vi
              indsamler, bruger og beskytter dine oplysninger, når du bruger vores platform.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              2. Oplysninger vi indsamler
            </h2>
            <div className='space-y-3'>
              <div>
                <h3 className='text-lg font-medium text-slate-800 mb-2'>2.1 Personoplysninger</h3>
                <p className='text-slate-700 leading-relaxed'>
                  Vi indsamler oplysninger, som du giver os direkte, herunder:
                </p>
                <ul className='list-disc list-inside text-slate-700 mt-2 space-y-1'>
                  <li>Navn og kontaktoplysninger</li>
                  <li>E-mailadresse og telefonnummer</li>
                  <li>Virksomhedsoplysninger</li>
                  <li>Adresseoplysninger</li>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-medium text-slate-800 mb-2'>
                  2.2 Tekniske oplysninger
                </h3>
                <ul className='list-disc list-inside text-slate-700 space-y-1'>
                  <li>IP-adresse</li>
                  <li>Browsertype og -version</li>
                  <li>Enhedsoplysninger</li>
                  <li>Brugsdata og analyse</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              3. Hvordan vi bruger dine oplysninger
            </h2>
            <p className='text-slate-700 leading-relaxed mb-3'>
              Vi bruger de indsamlede oplysninger til:
            </p>
            <ul className='list-disc list-inside text-slate-700 space-y-1'>
              <li>At levere og vedligeholde vores tjenester</li>
              <li>At behandle og administrere inspektionsrapporter</li>
              <li>At kommunikere med dig om din konto og tjenester</li>
              <li>At forbedre og optimere vores platform</li>
              <li>At overholde juridiske forpligtelser</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>4. Deling af oplysninger</h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi deler ikke dine personoplysninger med tredjeparter, undtagen:
            </p>
            <ul className='list-disc list-inside text-slate-700 mt-2 space-y-1'>
              <li>Med dit samtykke</li>
              <li>For at overholde lovkrav</li>
              <li>
                Med tjenesteudbydere, der hjælper os med at drive platformen (f.eks. Firebase/Google
                Cloud)
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>5. Datasikkerhed</h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi implementerer passende tekniske og organisatoriske sikkerhedsforanstaltninger for
              at beskytte dine personoplysninger mod uautoriseret adgang, ændring, videregivelse
              eller ødelæggelse. Vi bruger kryptering (SSL/TLS) og sikre cloud-tjenester.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              6. Dine rettigheder (GDPR)
            </h2>
            <p className='text-slate-700 leading-relaxed mb-3'>
              I henhold til GDPR har du følgende rettigheder:
            </p>
            <ul className='list-disc list-inside text-slate-700 space-y-1'>
              <li>
                <strong>Ret til adgang:</strong> Du kan anmode om en kopi af dine personoplysninger
              </li>
              <li>
                <strong>Ret til rettelse:</strong> Du kan anmode om rettelse af unøjagtige
                oplysninger
              </li>
              <li>
                <strong>Ret til sletning:</strong> Du kan anmode om sletning af dine
                personoplysninger
              </li>
              <li>
                <strong>Ret til dataportabilitet:</strong> Du kan anmode om at modtage dine data i
                et struktureret format
              </li>
              <li>
                <strong>Ret til indsigelse:</strong> Du kan gøre indsigelse mod behandling af dine
                oplysninger
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>7. Opbevaring af data</h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi opbevarer dine personoplysninger, så længe det er nødvendigt for at levere vores
              tjenester og overholde juridiske forpligtelser. Når oplysninger ikke længere er
              nødvendige, sletter eller anonymiserer vi dem sikkert.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>8. Cookies</h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi bruger cookies og lignende teknologier til at forbedre din oplevelse på platformen.
              Du kan administrere cookie-indstillinger i din browser.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>9. Kontakt os</h2>
            <p className='text-slate-700 leading-relaxed'>
              Hvis du har spørgsmål om denne privatlivspolitik eller ønsker at udøve dine
              rettigheder, kan du kontakte os:
            </p>
            <div className='mt-3 p-4 bg-slate-50 rounded-lg'>
              <p className='text-slate-700'>
                <strong>Agritectum ApS</strong>
              </p>
              <p className='text-slate-700'>E-mail: privacy@agritectum.dk</p>
              <p className='text-slate-700'>Telefon: +45 XX XX XX XX</p>
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              10. Ændringer til denne politik
            </h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi kan opdatere denne privatlivspolitik fra tid til anden. Vi vil informere dig om
              væsentlige ændringer ved at sende en meddelelse til din registrerede e-mailadresse
              eller ved at offentliggøre en meddelelse på platformen.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className='mt-8 text-center text-slate-600'>
          <p>© {currentYear} Agritectum ApS. Alle rettigheder forbeholdes.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
