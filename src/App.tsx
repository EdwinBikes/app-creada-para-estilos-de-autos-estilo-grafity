/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Image as ImageIcon, Send, Loader2, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [backgroundText, setBackgroundText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#00bcd4');
  const [selectedStyle, setSelectedStyle] = useState('graffiti');
  const [isGenerating, setIsGenerating] = useState(false);

  const styles = [
    { id: 'graffiti', name: 'Graffiti', desc: 'Estilo urbano con salpicaduras' },
    { id: 'neon', name: 'Neon City', desc: 'Futurista con luces de neón' },
    { id: 'comic', name: 'Comic Pop', desc: 'Estilo cómic con puntos y acción' },
    { id: 'synthwave', name: 'Synthwave', desc: 'Retro 80s con cuadrícula y sol' },
    { id: 'studio', name: 'Studio', desc: 'Limpio y profesional' },
  ];
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    if (!selectedImage) {
      setError("Por favor, sube una foto de un carro primero.");
      return;
    }
    if (!backgroundText) {
      setError("Por favor, ingresa el texto para el graffiti.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = selectedImage.split(',')[1];
      
      let stylePrompt = "";
      switch (selectedStyle) {
        case 'graffiti':
          stylePrompt = `Background: Large, bold graffiti-style text that says "${backgroundText}". The text should have outlines and shadows. Add paint splatters, drips, and artistic graffiti elements around the text.`;
          break;
        case 'neon':
          stylePrompt = `Background: A futuristic cyberpunk city at night with glowing neon signs. The text "${backgroundText}" should be a massive glowing neon sign in the background. Reflective wet streets.`;
          break;
        case 'comic':
          stylePrompt = `Background: Pop-art comic book style. Use Ben-Day dots, action lines, and a large stylized text bubble saying "${backgroundText}". Vibrant and high contrast.`;
          break;
        case 'synthwave':
          stylePrompt = `Background: 80s retro synthwave aesthetic. A glowing wireframe grid floor, a massive retro sun, and the text "${backgroundText}" in a chrome-styled 80s font.`;
          break;
        case 'studio':
          stylePrompt = `Background: Professional clean studio lighting with a soft gradient. The text "${backgroundText}" should be elegant, minimalist, and integrated into the clean background.`;
          break;
      }

      const prompt = `Create a high-quality vertical (9:16) Instagram Story image. 
      Subject: A vector art caricature of the car from the uploaded image. 
      Style: Clean lines, vibrant colors, cartoonish but detailed, similar to professional automotive illustrations. 
      ${stylePrompt}
      Watermark: Add a very small, subtle, and elegant text watermark in the bottom right corner that says "@EdwinBikes". It should be discreet but legible.
      Color Palette: The primary background color or accent color should be ${backgroundColor}. 
      Composition: The car should be in the lower half of the frame, with a subtle reflection on the ground. The background elements and text should be prominently displayed behind the car in the upper half. 
      Format: Vertical 9:16 aspect ratio.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/png",
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
          }
        }
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No se pudo generar la imagen. Intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al generar la imagen. Por favor, intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `car-graffiti-${Date.now()}.png`;
      link.click();
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setGeneratedImageUrl(null);
    setBackgroundText('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: backgroundColor }}
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: backgroundColor }}
        />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-4"
          >
            Car <span style={{ color: backgroundColor }}>Graffiti</span> Art
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Transforma tus fotos en arte urbano estilo caricatura para tus historias de Instagram.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Controls */}
          <section className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">
                1. Sube tu Carro
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4
                  ${selectedImage ? 'border-transparent bg-black' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
              >
                {selectedImage ? (
                  <>
                    <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-white/10">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 font-medium">Haz clic para subir una foto</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">
                2. Texto del Fondo
              </label>
              <input 
                type="text"
                value={backgroundText}
                onChange={(e) => setBackgroundText(e.target.value)}
                placeholder="Ej: HONDA, SPEED, DRIFT..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-white/20"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">
                3. Estilo del Fondo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all flex flex-col items-center gap-2 text-center
                      ${selectedStyle === style.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">
                4. Color de Fondo
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-none"
                />
                <input 
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 font-mono uppercase focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={isGenerating || !selectedImage || !backgroundText}
              className="w-full py-6 rounded-2xl bg-white text-black font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Crear Arte
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-sm font-medium text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </p>
            )}
          </section>

          {/* Right Column: Result */}
          <section className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-[360px] aspect-[9/16] bg-white/5 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl shadow-black">
              <AnimatePresence mode="wait">
                {generatedImageUrl ? (
                  <motion.div key="result" className="relative w-full h-full">
                    <motion.img
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      src={generatedImageUrl}
                      alt="Generated Art"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 text-white/40 text-[10px] font-bold tracking-widest uppercase pointer-events-none">
                      @EdwinBikes
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center p-12 text-center gap-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <ImageIcon className="w-10 h-10 text-white/20" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Tu Obra Maestra</h3>
                      <p className="text-gray-500 text-sm">
                        Configura los detalles a la izquierda y haz clic en "Crear Arte" para ver el resultado aquí.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isGenerating && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-white" />
                  <p className="font-bold tracking-widest uppercase text-sm">Pintando Graffiti...</p>
                </div>
              )}
            </div>

            {generatedImageUrl && (
              <div className="flex gap-4 w-full max-w-[360px]">
                <button
                  onClick={downloadImage}
                  className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Descargar
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold transition-all"
                >
                  Nuevo
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-white/5 text-center text-gray-600 text-sm">
        <p>© 2026 Car Graffiti Art Maker. Potenciado por Gemini 2.5 Flash Image.</p>
      </footer>
    </div>
  );
}
