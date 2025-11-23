import SimulateurForm from '@/components/SimulateurForm';

export default function Home() {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-nikkei font-bold text-bleu-cobalt mb-4">
            Simulateur de Remboursement
          </h1>
          <p className="text-lg font-open text-bleu-turquin">
            Estimez en quelques clics votre reste à charge.
          </p>
        </div>
        <SimulateurForm />
      </div>
    </main>
  );
}

