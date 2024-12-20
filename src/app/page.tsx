import ImageUpload from '@/components/ImageUpload';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-center mb-8">Recycling Item Scanner</h1>
      <ImageUpload />
    </div>
  );
}
