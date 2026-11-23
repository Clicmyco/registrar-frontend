// src/pages/Services.jsx
import { useState } from 'react';

// 1. The Data Array
const servicesData = [
  { id: 'srv-1', category: 'academic', title: 'Research & Development', icon: 'fa-flask', description: 'Cutting-edge research in computer science and technology with industry partnerships.' },
  { id: 'srv-2', category: 'academic', title: 'Academic Programs', icon: 'fa-graduation-cap', description: 'Comprehensive undergraduate and graduate programs in computer science and software engineering.' },
  { id: 'srv-3', category: 'industry', title: 'Industry Collaboration', icon: 'fa-handshake', description: 'Strong partnerships with leading technology companies for internships and job placement.' },
  { id: 'srv-4', category: 'academic', title: 'Innovation Hub', icon: 'fa-rocket', description: 'State-of-the-art facilities for students to develop and test their innovative software ideas.' },
  { id: 'srv-5', category: 'industry', title: 'International Exchange', icon: 'fa-globe', description: 'Global learning opportunities through international partnerships and exchange programs.' },
  { id: 'srv-6', category: 'industry', title: 'Competition Programs', icon: 'fa-trophy', description: 'Participation in national and international coding competitions and hackathons.' }
];

export default function Services() {
  // 2. State to track the current filter ('all', 'academic', or 'industry')
  const [activeFilter, setActiveFilter] = useState('all');

  // 3. Filter the data before rendering
  const displayedServices = activeFilter === 'all' 
    ? servicesData 
    : servicesData.filter((service) => service.category === activeFilter);

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-8">
        
        {/* Header & Filter Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Academic & Innovation Ecosystem</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Our Services & Degree Programs</h2>
            <p className="text-sm text-slate-600">Discover the comprehensive range of academic programs and technology services offered.</p>
          </div>
          
          {/* 4. Filter Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              All ({servicesData.length})
            </button>
            <button 
              onClick={() => setActiveFilter('academic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'academic' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Academic & R&D
            </button>
            <button 
              onClick={() => setActiveFilter('industry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'industry' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Industry & Global
            </button>
          </div>
        </div>

        {/* Grid of Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* 5. Map over the FILTERED array, not the original array */}
          {displayedServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <i className={`fa-solid ${service.icon}`}></i>
                  </div>
                  {/* Category Badge */}
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize ${service.category === 'academic'? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' } `}>
                    {service.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-1">{service.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>
              </div>
              <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 text-left">
                Open in Student Portal <i className="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          ))}
        </div>

      </section>
    </main>
  );
}