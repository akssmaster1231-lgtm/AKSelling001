import React from 'react';

const WHATSAPP_NUMBER = '917290894907';
const DEFAULT_MESSAGE = 'Namaste AKSelling! I need assistance with shopping / order support.';

export const WhatsAppFloatingButton: React.FC = () => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encoded = encodeURIComponent(DEFAULT_MESSAGE);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <aside aria-label="WhatsApp Support" className="fixed bottom-20 right-3.5 z-40 flex items-center justify-end pointer-events-auto">
      {/* Floating Circular WhatsApp Button */}
      <button
        type="button"
        onClick={handleClick}
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-[0_8px_25px_rgba(37,211,102,0.55)] hover:shadow-[0_10px_30px_rgba(37,211,102,0.75)] active:scale-90 transition-all duration-300 border-2 border-white cursor-pointer"
        aria-label="Chat on WhatsApp with AKSelling Support"
        title="Chat on WhatsApp (+91 7290894907)"
      >
        {/* Subtle Ambient Pulse Ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none [animation-duration:3s]" />

        {/* WhatsApp Official Vector Logo */}
        <svg
          className="w-8 h-8 fill-white relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Floating Tooltip Label */}
        <span className="hidden sm:inline-block absolute right-full mr-3 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md text-white text-xs font-black rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700">
          WhatsApp Chat
        </span>
      </button>
    </aside>
  );
};
