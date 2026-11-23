// src/components/Footer.jsx

// 1. Accept the navigate function as a prop so our links work
export default function Footer({ navigate }) {
  return (
    // 2. The footer container with a top border and top margin
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        
        {/* Left Side: System Info */}
        <div>
          <span className="font-semibold text-slate-700">Academic Registrar System UI</span> — Built for educational frontend layout & SPA state modeling.
        </div>
        
        {/* Right Side: Location & Quick Links */}
        <div className="flex flex-wrap items-center gap-4">
          <span><i className="fa-solid fa-location-dot mr-1 text-slate-400"></i>4 Kilo, Addis Ababa, Ethiopia</span>
          
          {/* 3. Wire up the navigation buttons */}
          <button onClick={() => navigate('about')} className="text-indigo-600 hover:underline">About</button>
          <button onClick={() => navigate('values')} className="text-indigo-600 hover:underline">Values</button>
          <button onClick={() => navigate('services')} className="text-indigo-600 hover:underline">Services</button>
        </div>

      </div>
    </footer>
  );
}