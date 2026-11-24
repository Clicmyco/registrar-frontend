// src/pages/Services.jsx
import { useState } from 'react';
import {  useEffect } from "react";
import { getPublicPrograms } from "../services/api";

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

    
    const [programs, setPrograms] = useState([]);
const [search, setSearch] = useState("");
const [degreeType, setDegreeType] = useState("All");
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  // Wait 250ms after the user stops typing before calling the API (debounce)
  const timer = setTimeout(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPublicPrograms({ search, degreeType });
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load academic programs.");
    } finally {
      setIsLoading(false);
    }
  }, 250);

  return () => clearTimeout(timer);
}, [search, degreeType]);


  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-8">
        
        {/* Header & Filter Buttons */}
        <section className="space-y-6">
  {/* Search & Filter Controls */}
  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search programs by name, code, or department..."
      className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <div className="flex gap-2">
      {["All", "Undergraduate", "Graduate"].map((type) => (
        <button
          key={type}
          onClick={() => setDegreeType(type)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            degreeType === type
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  </div>

  {/* Program Cards Grid */}
  {error && (
    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
      {error}
    </div>
  )}

  {isLoading ? (
    <div className="py-10 text-center text-sm text-slate-500">Loading academic programs...</div>
  ) : programs.length === 0 ? (
    <div className="py-10 text-center text-sm text-slate-500">
      No programs match your search criteria.
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {programs.map((program) => (
        <div
          key={program.id}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 hover:border-indigo-200 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {program.programCode}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {program.degreeType}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">{program.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{program.department}</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>

          <div className="pt-2 border-t border-slate-100 flex gap-4 text-xs font-semibold text-slate-700">
            <span>{program.durationYears} Years</span>
            <span>•</span>
            <span>{program.totalCredits} Total Credits</span>
          </div>
        </div>
      ))}
    </div>
   )}
  </section>

       
      </section>
    </main>
  );
} 