import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService: React.FC = () => {
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
          <h1 className='text-3xl font-bold text-slate-900 mb-4'>Servicevilkår</h1>
          <p className='text-slate-600'>
            Sidst opdateret: {new Date().toLocaleDateString('da-DK')}
          </p>
        </div>

        {/* Content */}
        <div className='bg-white rounded-xl shadow-sm p-8 space-y-6'>
          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>1. Accept af vilkår</h2>
            <p className='text-slate-700 leading-relaxed'>
              Ved at tilgå og bruge Agritectum-platformen accepterer du at være bundet af disse
              servicevilkår. Hvis du ikke accepterer disse vilkår, må du ikke bruge platformen.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              2. Beskrivelse af tjeneste
            </h2>
            <p className='text-slate-700 leading-relaxed'>
              Agritectum er en cloud-baseret platform til administration af taginspektioner,
              rapporter og kundeforhold. Platformen tilbyder værktøjer til inspektører, filialledere
              og kunder til at oprette, administrere og dele inspektionsrapporter.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>3. Brugerkonti</h2>
            <div className='space-y-3'>
              <p className='text-slate-700 leading-relaxed'>
                <strong>3.1 Kontotilmelding:</strong> For at bruge visse funktioner skal du oprette
                en konto. Du accepterer at give nøjagtige og fuldstændige oplysninger under
                registreringen.
              </p>
              <p className='text-slate-700 leading-relaxed'>
                <strong>3.2 Kontosikkerhed:</strong> Du er ansvarlig for at beskytte din adgangskode
                og holde din konto sikker. Du må ikke dele dine loginoplysninger med andre.
              </p>
              <p className='text-slate-700 leading-relaxed'>
                <strong>3.3 Kontoansvar:</strong> Du er ansvarlig for alle aktiviteter, der
                forekommer under din konto.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>4. Acceptabel brug</h2>
            <p className='text-slate-700 leading-relaxed mb-3'>Du accepterer at IKKE:</p>
            <ul className='list-disc list-inside text-slate-700 space-y-1'>
              <li>Bruge platformen til ulovlige formål</li>
              <li>Uploade ondsindet kode eller virus</li>
              <li>Forsøge at få uautoriseret adgang til systemet</li>
              <li>Kopiere, modificere eller distribuere platformens indhold uden tilladelse</li>
              <li>Krænke andres intellektuelle ejendomsrettigheder</li>
              <li>Forstyrre eller belaste serverene eller netværkene</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              5. Intellektuel ejendomsret
            </h2>
            <p className='text-slate-700 leading-relaxed'>
              Platformens design, kode, logo, grafik og andre materialer er beskyttet af ophavsret
              og andre intellektuelle ejendomsrettigheder. Du modtager en begrænset licens til at
              bruge platformen til dens tilsigtede formål.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>6. Brugerindhold</h2>
            <div className='space-y-3'>
              <p className='text-slate-700 leading-relaxed'>
                <strong>6.1 Dit indhold:</strong> Du beholder ejerskabet af indhold, du uploader
                (rapporter, billeder, data).
              </p>
              <p className='text-slate-700 leading-relaxed'>
                <strong>6.2 Licens til os:</strong> Ved at uploade indhold giver du os en begrænset
                licens til at gemme, behandle og vise dit indhold med henblik på at levere
                tjenesten.
              </p>
              <p className='text-slate-700 leading-relaxed'>
                <strong>6.3 Indholdsstandarder:</strong> Dit indhold må ikke være ulovligt,
                krænkende, stødende eller overtræde andres rettigheder.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>
              7. Betaling og fakturering
            </h2>
            <p className='text-slate-700 leading-relaxed'>
              Hvis du abonnerer på betalte tjenester, accepterer du at betale alle gældende gebyrer.
              Priser og betalingsvilkår vil blive kommunikeret separat. Vi forbeholder os retten til
              at ændre priserne med forudgående varsel.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>8. Opsigelse</h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi kan suspendere eller opsige din konto, hvis du overtræder disse vilkår. Du kan også
              opsige din konto når som helst ved at kontakte os. Ved opsigelse kan vi slette dine
              data i overensstemmelse med vores privatlivspolitik.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>9. Ansvarsfraskrivelse</h2>
            <p className='text-slate-700 leading-relaxed'>
              Platformen leveres "som den er" og "som tilgængelig" uden garantier af nogen art. Vi
              garanterer ikke, at tjenesten vil være uafbrudt, fejlfri eller sikker. Din brug af
              platformen er på egen risiko.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>10. Ansvarsbegrænsning</h2>
            <p className='text-slate-700 leading-relaxed'>
              I det omfang det er tilladt ved lov, er vi ikke ansvarlige for indirekte, tilfældige,
              særlige eller følgeskader, der opstår som følge af din brug eller manglende evne til
              at bruge platformen.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>11. Ændringer til vilkår</h2>
            <p className='text-slate-700 leading-relaxed'>
              Vi forbeholder os retten til at ændre disse vilkår når som helst. Væsentlige ændringer
              vil blive kommunikeret via e-mail eller gennem platformen. Din fortsatte brug efter
              ændringer udgør accept af de nye vilkår.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>12. Gældende lov</h2>
            <p className='text-slate-700 leading-relaxed'>
              Disse vilkår er underlagt dansk lovgivning. Eventuelle tvister skal behandles af de
              danske domstole.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold text-slate-900 mb-4'>13. Kontakt</h2>
            <p className='text-slate-700 leading-relaxed'>
              Hvis du har spørgsmål om disse vilkår, kan du kontakte os:
            </p>
            <div className='mt-3 p-4 bg-slate-50 rounded-lg'>
              <p className='text-slate-700'>
                <strong>Agritectum ApS</strong>
              </p>
              <p className='text-slate-700'>E-mail: support@agritectum.dk</p>
              <p className='text-slate-700'>Telefon: +45 XX XX XX XX</p>
            </div>
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

export default TermsOfService;
