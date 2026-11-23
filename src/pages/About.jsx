// src/pages/About.jsx

export default function About() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-8">
        
        {/* 1. Institutional Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
          
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <i className="fa-solid fa-building-columns"></i> Institutional Profile
          </div>
          
          {/* Heading & Paragraph */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Excellence in Technology Education Since 1999</h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Located in 4 Kilo, Addis Ababa, Ethiopia, our specialized computer science institution is dedicated to software engineering, cybersecurity, artificial intelligence, and industry-ready technology leadership.
          </p>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Mission Box */}
            <div className="p-6 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-base">
                <i className="fa-solid fa-bullseye"></i> Our Mission
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                To provide world-class education in computer science and technology, fostering innovation, critical thinking, and leadership skills that prepare students for successful careers in the digital age.
              </p>
            </div>
            
            {/* Vision Box */}
            <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <i className="fa-solid fa-eye"></i> Our Vision
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                To be the leading institution in East Africa for technology education, recognized for academic excellence, research innovation, and producing industry-ready technology leaders.
              </p>
            </div>

          </div>
        </div>

        {/* 2. Why Choose Us Pillars */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Why Choose Our Institution?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Pillar 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Expert Faculty</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn from experienced professionals and researchers who are leaders in their respective fields with extensive industry experience.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <i className="fa-solid fa-server"></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Advanced Facilities</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                State-of-the-art computing labs, research centers, and innovation hubs equipped with modern technology and software.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <i className="fa-solid fa-building"></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Industry Partnerships</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strong collaborations with leading technology companies, providing internships, job placements, and real-world project opportunities.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <i className="fa-solid fa-microscope"></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Research Excellence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cutting-edge research programs in artificial intelligence, cybersecurity, software engineering, and emerging technologies.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <i className="fa-solid fa-lightbulb"></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Innovation Culture</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fostering creativity and innovation through hackathons, innovation challenges, and entrepreneurship programs.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <i className="fa-solid fa-hands-helping"></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base">Student Support</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive support services including career counseling, mentorship programs, and academic guidance.
              </p>
            </div>

          </div>
        </div>


        {/* 2. We will add the 6 Pillars Grid here next! */}

      </section>
    </main>
  );
}