import { type FC, useState } from 'react';
import { FiDownload, FiImage, FiLoader } from 'react-icons/fi';
import {
  useGenerateImageMutation,
  type GenerateImageResult,
  type ImageModel,
  type ImageQuality,
  type ImageSize,
} from '@/services/imageGenerationApi';

const SIZE_LABELS: Record<ImageSize, string> = {
  '1024x1024': '1024 × 1024 (Square)',
  '1536x1024': '1536 × 1024 (Landscape)',
  '1024x1536': '1024 × 1536 (Portrait)',
};

const ImageGenerationPage: FC = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ImageModel>('gpt-image-1');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [quality, setQuality] = useState<ImageQuality>('medium');
  const [result, setResult] = useState<GenerateImageResult | null>(null);

  const [generateImage, { isLoading, error }] = useGenerateImageMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const res = await generateImage({
      prompt: prompt.trim(),
      model,
      size,
      quality,
    });
    if (res.data) setResult(res.data);
  };

  const handleDownload = () => {
    if (!result?.imageDataUrl) return;
    const a = document.createElement('a');
    a.href = result.imageDataUrl;
    a.download = `generated-image-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-primary">
            Image Generation
          </h1>
          <p className="text-secondary text-sm mt-1">
            Generate images using OpenAI&apos;s latest models
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body text-xs font-medium mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-border text-primary placeholder-muted text-sm outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-body text-xs font-medium mb-2">
                Model
              </label>
              <div className="flex gap-2">
                {(['gpt-image-1', 'gpt-image-1-mini'] as ImageModel[]).map(
                  (m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        model === m
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border text-body hover:border-border-strong hover:text-heading'
                      }`}
                    >
                      {m}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <label className="block text-body text-xs font-medium mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as ImageSize)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-raised border border-border text-primary text-sm outline-none focus:border-accent/50 transition-colors"
              >
                {(Object.keys(SIZE_LABELS) as ImageSize[]).map((s) => (
                  <option key={s} value={s}>
                    {SIZE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body text-xs font-medium mb-2">
                Quality
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as ImageQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 capitalize ${
                      quality === q
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-border text-body hover:border-border-strong hover:text-heading'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-surface-dim text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <FiLoader size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiImage size={14} />
                  Generate Image
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center">
                Failed to generate image. Please try again.
              </p>
            )}
          </form>

          <div className="lg:w-80">
            {result ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-border bg-surface-raised">
                  <img
                    src={result.imageDataUrl}
                    alt="Generated image"
                    className="w-full h-auto"
                  />
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-body text-sm hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                >
                  <FiDownload size={14} />
                  Download
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 lg:h-80 rounded-2xl border border-border border-dashed bg-surface-raised">
                <FiImage size={28} className="text-muted mb-3" />
                <p className="text-muted text-sm">
                  Your image will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPage;
