// src/pages/Values.jsx
import { useState } from 'react'; // 1. Import useState

// 2. Updated Data: Added the 'practice' text to each object
const coreValues = [
  { id: 'val-1', title: 'Innovation', icon: 'fa-lightbulb', colorText: 'text-indigo-700', colorBg: 'bg-indigo-50', summary: 'We foster creativity and innovative thinking, encouraging students to push boundaries and develop cutting-edge solutions.', practice: 'Supported by annual campus hackathons, capstone software incubators, and open R&D lab access.' },
  { id: 'val-2', title: 'Excellence', icon: 'fa-medal', colorText: 'text-emerald-700', colorBg: 'bg-emerald-50', summary: 'We maintain the highest standards in education, research, and student development, striving for excellence in everything we do.', practice: 'Rigorous curriculum aligned with international computing curricula and peer-reviewed project milestones.' },
  { id: 'val-3', title: 'Collaboration', icon: 'fa-people-group', colorText: 'text-blue-700', colorBg: 'bg-blue-50', summary: 'We believe in the power of teamwork and collaboration, building strong partnerships with industry and academic institutions.', practice: 'Cross-functional software engineering teams and co-op placements with over 50 technology partners.' },
  { id: 'val-4', title: 'Integrity', icon: 'fa-scale-balanced', colorText: 'text-amber-700', colorBg: 'bg-amber-50', summary: 'We uphold the highest ethical standards, ensuring transparency, honesty, and accountability in all our endeavors.', practice: 'Transparent academic grading workflows, reproducible research standards, and responsible AI ethics training.' },
  { id: 'val-5', title: 'Diversity', icon: 'fa-earth-africa', colorText: 'text-purple-700', colorBg: 'bg-purple-50', summary: 'We celebrate diversity and inclusion, creating an environment where all students feel valued and empowered to succeed.', practice: 'Inclusive mentorship programs, scholarship pathways, and accessible learning resources across all cohorts.' },
  { id: 'val-6', title: 'Growth', icon: 'fa-seedling', colorText: 'text-rose-700', colorBg: 'bg-rose-50', summary: 'We are committed to continuous improvement and growth, adapting to the ever-changing landscape of technology.', practice: 'Continuous syllabus updates covering cloud-native engineering, cybersecurity defense, and modern AI.' }
];

export default function Values() {
  // 3. Create state to track which card ID is currently expanded. 
  // It starts as an empty string ('') because no card is open initially.
  const [expandedId, setExpandedId] = useState('');

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-6">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Guiding Principles</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Our Core Values</h2>
          <p className="text-sm text-slate-600">The core principles that guide our academic mission and shape our computing community. Click any value card to inspect how it is practiced on campus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreValues.map((value) => {
            
            // 4. Check if THIS specific card in the loop is the one that is currently expanded
            const isExpanded = expandedId === value.id;

            return (
              <div 
                key={value.id} 
                className={`bg-white rounded-xl border p-6 shadow-sm flex flex-col justify-between transition ${isExpanded ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${value.colorBg} ${value.colorText}`}>
                      <i className={`fa-solid ${value.icon}`}></i>
                    </span>
                    
                    {/* 5. The Toggle Button */}
                    <button 
                      type="button" 
                      onClick={() => setExpandedId(isExpanded ? '' : value.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 focus:outline-none"
                    >
                      {isExpanded ? 'Hide Campus Practice' : 'View Campus Practice'}
                    </button>

                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{value.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{value.summary}</p>
                </div>
                
                {/* 6. Conditionally render the practice section */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-900 bg-indigo-50/60 p-3 rounded-lg">
                    <span className="font-semibold block mb-0.5">In Practice:</span>
                    {value.practice}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}